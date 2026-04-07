import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/gazrasxod";
const FALLBACK_DB_NAME = "gazrasxod";

declare global {
  var pgPool: Pool | undefined;
  var dbInitialized: boolean | undefined;
  var dbEnsured: boolean | undefined;
}

export const pool =
  global.pgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  global.pgPool = pool;
}

export async function initializeDb() {
  if (global.dbInitialized) {
    return;
  }

  await ensureDatabaseExists();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      login VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'dispatcher'))
    );

    CREATE TABLE IF NOT EXISTS points (
      id SERIAL PRIMARY KEY,
      point_code VARCHAR(50) UNIQUE NOT NULL,
      gas_supplier TEXT NOT NULL,
      company_name TEXT NOT NULL,
      line_type VARCHAR(20) NOT NULL CHECK (line_type IN ('line_ab', 'line_c', 'line_abc'))
    );

    CREATE TABLE IF NOT EXISTS daily_gas_entries (
      id SERIAL PRIMARY KEY,
      report_date DATE NOT NULL,
      point_code VARCHAR(50) NOT NULL REFERENCES points(point_code) ON DELETE RESTRICT,
      volume NUMERIC(18,3) NOT NULL CHECK (volume >= 0),
      entered_by VARCHAR(100) NOT NULL REFERENCES users(login) ON DELETE RESTRICT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(report_date, point_code)
    );
  `);

  await seedUsers();
  await seedPoints();

  global.dbInitialized = true;
}

async function ensureDatabaseExists() {
  if (global.dbEnsured) {
    return;
  }

  const targetUrl = new URL(connectionString);
  const targetDbName = (targetUrl.pathname.replace("/", "") || FALLBACK_DB_NAME).trim();
  const adminUrl = new URL(connectionString);
  adminUrl.pathname = "/postgres";

  const adminPool = new Pool({ connectionString: adminUrl.toString() });

  try {
    await adminPool.query(`CREATE DATABASE "${targetDbName.replace(/"/g, "\"\"")}"`);
  } catch (error) {
    const dbError = error as { code?: string };
    // 42P04: database already exists
    if (dbError.code !== "42P04") {
      throw error;
    }
  } finally {
    await adminPool.end();
  }

  global.dbEnsured = true;
}

async function seedUsers() {
  const users = [
    { login: "admin", password: "admin123", role: "admin" },
    { login: "dispatcher", password: "dispatcher123", role: "dispatcher" },
  ] as const;

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    await pool.query(
      `
      INSERT INTO users (login, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (login) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role
      `,
      [user.login, hash, user.role],
    );
  }
}

async function seedPoints() {
  const points = [
    { pointCode: "wkc1", gasSupplier: "WKC1 gasconsumption", lineType: "line_ab" },
    { pointCode: "wkc2", gasSupplier: "WKC2 gasconsumption", lineType: "line_ab" },
    { pointCode: "gcs_a", gasSupplier: "GCS-A gasconsumption", lineType: "line_ab" },
    { pointCode: "wkc3", gasSupplier: "WKC3 gasconsumption", lineType: "line_ab" },
    { pointCode: "ms", gasSupplier: "MS gasconsumption", lineType: "line_ab" },
    { pointCode: "ucs1", gasSupplier: "UCS1 gasconsumption", lineType: "line_c" },
    { pointCode: "gcs_b", gasSupplier: "GCS-B gasconsumption", lineType: "line_c" },
    { pointCode: "ucs3", gasSupplier: "UCS3 gasconsumption", lineType: "line_c" },
    { pointCode: "ukms", gasSupplier: "UKMS gasconsumption", lineType: "line_c" },
    { pointCode: "line_ab", gasSupplier: "Line AB gasconsumption", lineType: "line_ab" },
    { pointCode: "line_c", gasSupplier: "Line C gasconsumption", lineType: "line_c" },
    { pointCode: "line_abc", gasSupplier: "Total Line AB/C gasconsumption", lineType: "line_abc" },
  ] as const;

  for (const point of points) {
    await pool.query(
      `
      INSERT INTO points (point_code, gas_supplier, company_name, line_type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (point_code) DO UPDATE
      SET gas_supplier = EXCLUDED.gas_supplier,
          company_name = EXCLUDED.company_name,
          line_type = EXCLUDED.line_type
      `,
      [point.pointCode, point.gasSupplier, "JV AsiaTransGas", point.lineType],
    );
  }
}
