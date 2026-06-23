import { Router, Request, Response } from "express";
import { db } from "../db";
import { logger } from "../utils/logger";

const router = Router();

const ALLOWED_SOURCES = ["instagram", "whatsapp", "direct"];

// POST /api/analytics/visit
router.post("/analytics/visit", async (req: Request, res: Response) => {
  try {
    let { source } = req.body;
    
    // Normalize source
    if (!source || typeof source !== "string") {
      source = "direct";
    }
    
    source = source.toLowerCase().trim();
    
    // If not one of allowed sources, map to direct
    if (!ALLOWED_SOURCES.includes(source)) {
      source = "direct";
    }

    // Daily upsert: Insert click_count = 1 or increment existing click_count by 1
    await db.query(
      `INSERT INTO visitor_analytics (referrer_source, visit_date, click_count)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (referrer_source, visit_date) 
       DO UPDATE SET click_count = visitor_analytics.click_count + 1`,
      [source]
    );

    res.json({ success: true, source });
  } catch (err: any) {
    // We log the error but don't want to crash the frontend or return 500 in a blocking way
    // if there's a temporary DB issue, just log and return 200 or 500 silently
    logger.error(`Analytics visit tracking failed: ${err.message}`);
    res.status(500).json({ error: { message: "Failed to record analytics", code: "ANALYTICS_ERROR" } });
  }
});

export default router;
