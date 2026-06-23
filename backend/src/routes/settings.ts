import { Router, Request, Response } from "express";
import { db } from "../db";
import { siteSettingsSchema } from "../utils/validation";
import { requireAdmin, AuthRequest } from "../middleware/requireAdmin";
import { logger } from "../utils/logger";

const router = Router();

const SETTINGS_SELECT_FIELDS = `
  id, 
  whatsapp_number AS "whatsappNumber", 
  whatsapp_message AS "whatsappMessage", 
  hero_title AS "heroTitle", 
  hero_subtitle AS "heroSubtitle", 
  meta_title AS "metaTitle", 
  meta_description AS "metaDescription",
  theme,
  font_family AS "fontFamily",
  card_style AS "cardStyle",
  bg_sparkles AS "bgSparkles",
  primary_color AS "primaryColor",
  secondary_color AS "secondaryColor",
  background_color AS "backgroundColor"
`;

const DEFAULT_SETTINGS = {
  id: 1,
  whatsappNumber: "212600000000",
  whatsappMessage: "السلام عليكم، أرغب في طلب تصميم مخصص ✨",
  heroTitle: "معرض أعمالنا",
  heroSubtitle: "كراسات ودفاتر وكتب تعليمية مخصصة بلمسة فنية راقية",
  metaTitle: "معرض أعمالنا — كراسات وكتب تعليمية مخصصة",
  metaDescription: "معرض صور لأعمالنا: كراسات، دفاتر يومية، كتب تعليمية، أنشطة التحضيري وأغلفة مخصصة بلمسة فنية راقية.",
  theme: "royal_gold",
  fontFamily: "Tajawal",
  cardStyle: "medium",
  bgSparkles: "none",
  primaryColor: "",
  secondaryColor: "",
  backgroundColor: ""
};

// In-memory persistence for offline mode testing
let memorySettings = { ...DEFAULT_SETTINGS };

// GET /api/settings (Public)
router.get("/settings", async (req: Request, res: Response) => {
  try {
    const result = await db.query(`SELECT ${SETTINGS_SELECT_FIELDS} FROM site_settings ORDER BY id ASC LIMIT 1`);
    if (result.rows.length === 0) {
      return res.json({ data: memorySettings });
    }
    // Sync memory settings with DB if DB is online
    memorySettings = { ...result.rows[0] };
    res.json({ data: result.rows[0] });
  } catch (err: any) {
    logger.error(`Get settings error: ${err.message}. Returning in-memory settings.`);
    res.json({ data: memorySettings });
  }
});

// GET /api/admin/settings (Protected)
router.get("/admin/settings", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.query(`SELECT ${SETTINGS_SELECT_FIELDS} FROM site_settings ORDER BY id ASC LIMIT 1`);
    if (result.rows.length === 0) {
      return res.json({ data: memorySettings });
    }
    memorySettings = { ...result.rows[0] };
    res.json({ data: result.rows[0] });
  } catch (err: any) {
    logger.error(`Get admin settings error: ${err.message}. Returning in-memory settings.`);
    res.json({ data: memorySettings });
  }
});

// PATCH /api/admin/settings (Protected)
router.patch("/admin/settings", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = siteSettingsSchema.parse(req.body);

    // Get current settings first to merge values
    const currentResult = await db.query("SELECT * FROM site_settings ORDER BY id ASC LIMIT 1");
    
    let currentSettings = currentResult.rows[0] || {};
    
    const whatsappNumber = validatedData.whatsappNumber !== undefined ? validatedData.whatsappNumber : (currentSettings.whatsapp_number || memorySettings.whatsappNumber);
    const whatsappMessage = validatedData.whatsappMessage !== undefined ? validatedData.whatsappMessage : (currentSettings.whatsapp_message || memorySettings.whatsappMessage);
    const heroTitle = validatedData.heroTitle !== undefined ? validatedData.heroTitle : (currentSettings.hero_title || memorySettings.heroTitle);
    const heroSubtitle = validatedData.heroSubtitle !== undefined ? validatedData.heroSubtitle : (currentSettings.hero_subtitle || memorySettings.heroSubtitle);
    const metaTitle = validatedData.metaTitle !== undefined ? validatedData.metaTitle : (currentSettings.meta_title || memorySettings.metaTitle);
    const metaDescription = validatedData.metaDescription !== undefined ? validatedData.metaDescription : (currentSettings.meta_description || memorySettings.metaDescription);
    const theme = validatedData.theme !== undefined ? validatedData.theme : (currentSettings.theme || memorySettings.theme);
    const fontFamily = validatedData.fontFamily !== undefined ? validatedData.fontFamily : (currentSettings.font_family || memorySettings.fontFamily);
    const cardStyle = validatedData.cardStyle !== undefined ? validatedData.cardStyle : (currentSettings.card_style || memorySettings.cardStyle);
    const bgSparkles = validatedData.bgSparkles !== undefined ? validatedData.bgSparkles : (currentSettings.bg_sparkles || memorySettings.bgSparkles);
    const primaryColor = validatedData.primaryColor !== undefined ? validatedData.primaryColor : (currentSettings.primary_color ?? memorySettings.primaryColor);
    const secondaryColor = validatedData.secondaryColor !== undefined ? validatedData.secondaryColor : (currentSettings.secondary_color ?? memorySettings.secondaryColor);
    const backgroundColor = validatedData.backgroundColor !== undefined ? validatedData.backgroundColor : (currentSettings.background_color ?? memorySettings.backgroundColor);

    const result = await db.query(
      `INSERT INTO site_settings (
        id, whatsapp_number, whatsapp_message, hero_title, hero_subtitle, 
        meta_title, meta_description, theme, font_family, card_style, 
        bg_sparkles, primary_color, secondary_color, background_color
      ) 
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         whatsapp_number = EXCLUDED.whatsapp_number,
         whatsapp_message = EXCLUDED.whatsapp_message,
         hero_title = EXCLUDED.hero_title,
         hero_subtitle = EXCLUDED.hero_subtitle,
         meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         theme = EXCLUDED.theme,
         font_family = EXCLUDED.font_family,
         card_style = EXCLUDED.card_style,
         bg_sparkles = EXCLUDED.bg_sparkles,
         primary_color = EXCLUDED.primary_color,
         secondary_color = EXCLUDED.secondary_color,
         background_color = EXCLUDED.background_color,
         updated_at = CURRENT_TIMESTAMP
       RETURNING ${SETTINGS_SELECT_FIELDS}`,
      [
        whatsappNumber, whatsappMessage, heroTitle, heroSubtitle, 
        metaTitle, metaDescription, theme, fontFamily, cardStyle, 
        bgSparkles, primaryColor, secondaryColor, backgroundColor
      ]
    );

    const updatedSettings = result.rows[0];
    memorySettings = { ...updatedSettings }; // Sync in-memory
    logger.info(`Site settings updated by admin ${req.admin?.email}`);
    res.json({ data: updatedSettings });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        error: { message: err.errors[0].message, code: "VALIDATION_ERROR" }
      });
    }
    // Offline mock response if DB connection fails
    logger.error(`Update settings error: ${err.message}. Mocking update and persisting in-memory for offline mode.`);
    const mockUpdated = {
      whatsappNumber: req.body.whatsappNumber || memorySettings.whatsappNumber,
      whatsappMessage: req.body.whatsappMessage || memorySettings.whatsappMessage,
      heroTitle: req.body.heroTitle || memorySettings.heroTitle,
      heroSubtitle: req.body.heroSubtitle || memorySettings.heroSubtitle,
      metaTitle: req.body.metaTitle || memorySettings.metaTitle,
      metaDescription: req.body.metaDescription || memorySettings.metaDescription,
      theme: req.body.theme || memorySettings.theme,
      fontFamily: req.body.fontFamily || memorySettings.fontFamily,
      cardStyle: req.body.cardStyle || memorySettings.cardStyle,
      bgSparkles: req.body.bgSparkles || memorySettings.bgSparkles,
      primaryColor: req.body.primaryColor !== undefined ? req.body.primaryColor : memorySettings.primaryColor,
      secondaryColor: req.body.secondaryColor !== undefined ? req.body.secondaryColor : memorySettings.secondaryColor,
      backgroundColor: req.body.backgroundColor !== undefined ? req.body.backgroundColor : memorySettings.backgroundColor,
    };
    memorySettings = { ...mockUpdated, id: 1 }; // PERSIST IN-MEMORY!
    res.json({ data: mockUpdated });
  }
});

export default router;
