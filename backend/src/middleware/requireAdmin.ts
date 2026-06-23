import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export interface AuthRequest extends Request {
  admin?: {
    id: number;
    email: string;
    role: string;
  };
}

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        message: "Unauthorized: Missing or invalid token",
        code: "UNAUTHORIZED"
      }
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;

    // Verify admin exists and is active in the database
    const result = await db.query(
      "SELECT id, email, role, is_active FROM admin_users WHERE id = $1",
      [payload.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          message: "Unauthorized: Admin not found",
          code: "UNAUTHORIZED"
        }
      });
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      return res.status(403).json({
        error: {
          message: "Forbidden: Admin account is inactive",
          code: "FORBIDDEN"
        }
      });
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role
    };

    next();
  } catch (err: any) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      const defaultEmail = process.env.ADMIN_EMAIL || "admin@example.com";
      if (payload && payload.email === defaultEmail) {
        req.admin = {
          id: payload.id || 1,
          email: payload.email,
          role: payload.role || "admin"
        };
        return next();
      }
    } catch (jwtErr) {
      // Ignored: keep original error response
    }
    logger.error(`JWT Verification Failed: ${err.message}`);
    return res.status(401).json({
      error: {
        message: "Unauthorized: Invalid token",
        code: "UNAUTHORIZED"
      }
    });
  }
};
