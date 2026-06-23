import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { securityHeaders, apiLimiter } from "./middleware/security";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import authRoutes from "./routes/auth";
import categoriesRoutes from "./routes/categories";
import galleryRoutes from "./routes/gallery";
import settingsRoutes from "./routes/settings";
import uploadRoutes from "./routes/upload";
import analyticsRoutes from "./routes/analytics";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(securityHeaders); // Helmet security headers
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } })); // HTTP logging
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Routes
app.use("/api/admin", authRoutes); // mounts login, logout, me under /api/admin
app.use("/api", categoriesRoutes);
app.use("/api", galleryRoutes);
app.use("/api", settingsRoutes);
app.use("/api", uploadRoutes);
app.use("/api", analyticsRoutes);

// Basic Health Check Route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running securely!" });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
