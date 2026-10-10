import AdmZip from "adm-zip";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const ROOT = process.cwd();

const INCLUDE_DIRS = ["src", "scripts"];
const INCLUDE_FILES = [
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "drizzle.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  ".gitignore",
  "README.md",
  ".env.example",
];

const IGNORE_NAMES = new Set(["node_modules", ".next", ".git", ".kilo", ".env", "source-code.zip"]);

function addDirToZip(zip: AdmZip, dirPath: string, zipPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_NAMES.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    const entryZipPath = path.posix.join(zipPath, entry.name);
    if (entry.isDirectory()) {
      addDirToZip(zip, fullPath, entryZipPath);
    } else if (entry.isFile()) {
      zip.addLocalFile(fullPath, zipPath);
    }
  }
}

export async function GET() {
  try {
    const zip = new AdmZip();

    for (const dir of INCLUDE_DIRS) {
      const abs = path.join(ROOT, dir);
      if (fs.existsSync(abs)) {
        addDirToZip(zip, abs, dir);
      }
    }

    for (const file of INCLUDE_FILES) {
      const abs = path.join(ROOT, file);
      if (fs.existsSync(abs)) {
        zip.addLocalFile(abs, "");
      }
    }

    const buffer = zip.toBuffer();
    const ab = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(ab).set(buffer);
    const blob = new Blob([ab], { type: "application/zip" });

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="simpan-source-code.zip"',
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Gagal membuat arsip source code." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
