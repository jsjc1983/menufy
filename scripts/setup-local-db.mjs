import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const envLocalPath = join(root, ".env.local");
const localDatabaseUrl = "file:./dev.db";

function cleanEnvValue(value) {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

function readEnvValue(filePath, key) {
  if (!existsSync(filePath)) return undefined;

  const line = readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));

  if (!line) return undefined;
  return cleanEnvValue(line.slice(line.indexOf("=") + 1));
}

function isPlaceholderDatabaseUrl(value) {
  return !value || /USER:PASSWORD@HOST:PORT/.test(value);
}

function isSqliteDatabaseUrl(value) {
  return cleanEnvValue(value)?.startsWith("file:");
}

function writeLocalEnv() {
  const localLine = `DATABASE_URL="${localDatabaseUrl}"`;

  if (!existsSync(envPath)) {
    writeFileSync(envPath, `${localLine}\n`);
    return;
  }

  const current = readFileSync(envPath, "utf8");
  const envDatabaseUrl = readEnvValue(envPath, "DATABASE_URL");
  if (
    envDatabaseUrl &&
    !isSqliteDatabaseUrl(envDatabaseUrl) &&
    !isPlaceholderDatabaseUrl(envDatabaseUrl)
  ) {
    return;
  }

  if (/^DATABASE_URL=/m.test(current)) {
    writeFileSync(
      envPath,
      current.replace(/^DATABASE_URL=.*$/m, localLine)
    );
    return;
  }

  writeFileSync(envPath, `${current.replace(/\s*$/, "\n")}${localLine}\n`);
}

function runPrisma(args) {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(executable, ["prisma", ...args], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const configuredDatabaseUrl =
  cleanEnvValue(process.env.DATABASE_URL) ||
  readEnvValue(envLocalPath, "DATABASE_URL") ||
  readEnvValue(envPath, "DATABASE_URL");

if (
  isSqliteDatabaseUrl(configuredDatabaseUrl) ||
  isPlaceholderDatabaseUrl(configuredDatabaseUrl)
) {
  writeLocalEnv();
  console.log("Using local SQLite database at prisma/dev.db");
  runPrisma([
    "db",
    "push",
    "--schema",
    "prisma/schema.local.prisma",
    "--skip-generate",
  ]);
  runPrisma(["generate", "--schema", "prisma/schema.local.prisma"]);
} else {
  console.log("Using configured PostgreSQL DATABASE_URL");
  runPrisma(["generate"]);
}
