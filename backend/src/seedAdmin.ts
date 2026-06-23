import { Client } from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN_EMAIL or ADMIN_PASSWORD environment variables are not set. Skipping auto-seeding.");
    return;
  }

  console.log(`Seeding admin user: ${email}`);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Check if admin already exists
    const checkResult = await client.query("SELECT id FROM admin_users WHERE email = $1", [email]);
    if (checkResult.rows.length > 0) {
      console.log("Admin user already exists. Skipping seed.");
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert admin
    await client.query(
      `INSERT INTO admin_users (email, password_hash, role, is_active) 
       VALUES ($1, $2, 'admin', true)`,
      [email, passwordHash]
    );

    console.log("Admin user created successfully.");
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedAdmin();
