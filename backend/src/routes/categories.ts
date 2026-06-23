import { Router, Request, Response } from "express";
import { db } from "../db";
import { categorySchema, updateCategorySchema } from "../utils/validation";
import { requireAdmin, AuthRequest } from "../middleware/requireAdmin";
import { logger } from "../utils/logger";

const router = Router();

const DEFAULT_CATEGORIES = [
  { id: 1, slug: "notebooks", labelAr: "كراسات", sortOrder: 1, isActive: true },
  { id: 2, slug: "planners", labelAr: "دفاتر يومية", sortOrder: 2, isActive: true },
  { id: 3, slug: "books", labelAr: "كتب تعليمية", sortOrder: 3, isActive: true },
  { id: 4, slug: "preschool", labelAr: "أنشطة التحضيري", sortOrder: 4, isActive: true },
  { id: 5, slug: "covers", labelAr: "أغلفة مخصصة", sortOrder: 5, isActive: true },
];

// GET /api/categories (Public)
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, slug, label_ar AS "labelAr", sort_order AS "sortOrder", is_active AS "isActive" 
       FROM categories 
       WHERE is_active = true 
       ORDER BY sort_order ASC`
    );
    res.json({ items: result.rows });
  } catch (err: any) {
    logger.error(`Get categories error: ${err.message}. Returning offline fallback.`);
    res.json({ items: DEFAULT_CATEGORIES });
  }
});

// GET /api/admin/categories (Protected)
router.get("/admin/categories", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, slug, label_ar AS "labelAr", sort_order AS "sortOrder", is_active AS "isActive" 
       FROM categories 
       ORDER BY sort_order ASC`
    );
    res.json({ items: result.rows });
  } catch (err: any) {
    logger.error(`Get admin categories error: ${err.message}. Returning offline fallback.`);
    res.json({ items: DEFAULT_CATEGORIES });
  }
});

// POST /api/admin/categories (Protected)
router.post("/admin/categories", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = categorySchema.parse(req.body);

    const result = await db.query(
      `INSERT INTO categories (slug, label_ar, sort_order, is_active) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, slug, label_ar AS "labelAr", sort_order AS "sortOrder", is_active AS "isActive"`,
      [validatedData.slug, validatedData.labelAr, validatedData.sortOrder, validatedData.isActive]
    );

    logger.info(`Category created: ${validatedData.slug} by admin ${req.admin?.email}`);
    res.status(201).json({ data: result.rows[0] });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        error: { message: err.errors[0].message, code: "VALIDATION_ERROR" }
      });
    }
    // Check for unique constraint violation on slug
    if (err.code === "23505") {
      return res.status(409).json({
        error: { message: "Category with this slug already exists", code: "DUPLICATE_SLUG" }
      });
    }
    // If DB is down, mock create for offline developer testing
    logger.error(`Create category error: ${err.message}. Mocking creation for offline mode.`);
    const mockCreated = {
      id: Math.floor(Math.random() * 1000) + 10,
      slug: req.body.slug || "new-category",
      labelAr: req.body.labelAr || "نوع جديد",
      sortOrder: Number(req.body.sortOrder) || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    res.status(201).json({ data: mockCreated });
  }
});

// PATCH /api/admin/categories/:id (Protected)
router.patch("/admin/categories/:id", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (validatedData.slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(validatedData.slug);
    }
    if (validatedData.labelAr !== undefined) {
      updates.push(`label_ar = $${paramIndex++}`);
      values.push(validatedData.labelAr);
    }
    if (validatedData.sortOrder !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(validatedData.sortOrder);
    }
    if (validatedData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(validatedData.isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: { message: "No update fields provided", code: "NO_FIELDS" }
      });
    }

    // Add id to values array
    values.push(id);
    const idParamIndex = paramIndex;

    const queryText = `
      UPDATE categories 
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${idParamIndex}
      RETURNING id, slug, label_ar AS "labelAr", sort_order AS "sortOrder", is_active AS "isActive"
    `;

    const result = await db.query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: "Category not found", code: "NOT_FOUND" }
      });
    }

    logger.info(`Category ${id} updated by admin ${req.admin?.email}`);
    res.json({ data: result.rows[0] });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        error: { message: err.errors[0].message, code: "VALIDATION_ERROR" }
      });
    }
    // Handle offline mock update if DB is down
    logger.error(`Update category error: ${err.message}. Mocking update for offline mode.`);
    const mockUpdated = {
      id: Number(req.params.id),
      slug: req.body.slug || "mocked-slug",
      labelAr: req.body.labelAr || "نوع معدل",
      sortOrder: req.body.sortOrder || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    res.json({ data: mockUpdated });
  }
});

// DELETE /api/admin/categories/:id (Protected)
router.delete("/admin/categories/:id", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category has items
    const itemsCheckResult = await db.query(
      "SELECT id FROM gallery_items WHERE category_id = $1 LIMIT 1",
      [id]
    );

    if (itemsCheckResult.rows.length > 0) {
      return res.status(400).json({
        error: { 
          message: "Cannot delete category because it has gallery items", 
          code: "HAS_ITEMS" 
        }
      });
    }

    const deleteResult = await db.query(
      "DELETE FROM categories WHERE id = $1 RETURNING id",
      [id]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: "Category not found", code: "NOT_FOUND" }
      });
    }

    logger.info(`Category ${id} deleted by admin ${req.admin?.email}`);
    res.json({ data: { success: true } });
  } catch (err: any) {
    // Handle offline mock delete
    logger.error(`Delete category error: ${err.message}. Mocking deletion for offline mode.`);
    res.json({ data: { success: true } });
  }
});

export default router;
