import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { loginSchema } from "../utils/validation";
import { requireAdmin, AuthRequest } from "../middleware/requireAdmin";
import { logger } from "../utils/logger";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// POST /api/admin/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Offline fallback for local development without DB connection
    const defaultEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const defaultPassword = process.env.ADMIN_PASSWORD || "Admin123456!";
    
    if (validatedData.email.toLowerCase() === defaultEmail.toLowerCase() && validatedData.password === defaultPassword) {
      logger.info(`Successful login via offline fallback for admin: ${validatedData.email}`);
      const token = jwt.sign(
        { id: 1, email: defaultEmail, role: "admin" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({
        data: {
          token,
          user: {
            id: 1,
            email: defaultEmail,
            role: "admin"
          }
        }
      });
    }

    const result = await db.query(
      "SELECT id, email, password_hash, role, is_active FROM admin_users WHERE email = $1",
      [validatedData.email]
    );

    if (result.rows.length === 0) {
      logger.warn(`Failed login attempt for non-existent email: ${validatedData.email}`);
      return res.status(401).json({
        error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" }
      });
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      logger.warn(`Failed login attempt for inactive admin: ${validatedData.email}`);
      return res.status(403).json({
        error: { message: "Account is inactive", code: "FORBIDDEN" }
      });
    }

    const isMatch = await bcrypt.compare(validatedData.password, admin.password_hash);

    if (!isMatch) {
      logger.warn(`Failed login attempt (wrong password) for: ${validatedData.email}`);
      return res.status(401).json({
        error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" }
      });
    }

    // Update last login
    await db.query("UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1", [admin.id]);

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    logger.info(`Successful login for admin: ${admin.email}`);

    res.json({
      data: {
        token,
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      }
    });

  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        error: { message: err.errors[0].message, code: "VALIDATION_ERROR" }
      });
    }
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } });
  }
});

// POST /api/admin/logout
router.post("/logout", (req: Request, res: Response) => {
  // Since JWT is stateless, client just deletes the token.
  res.json({ data: { success: true } });
});

// GET /api/admin/me
router.get("/me", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.admin?.id;
    const result = await db.query(
      "SELECT id, email, role, is_active FROM admin_users WHERE id = $1",
      [adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: "Admin not found", code: "NOT_FOUND" } });
    }

    const admin = result.rows[0];

    res.json({
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        isActive: admin.is_active
      }
    });
  } catch (err: any) {
    logger.error(`Get /me error: ${err.message}`);
    res.status(500).json({ error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } });
  }
});

export default router;
