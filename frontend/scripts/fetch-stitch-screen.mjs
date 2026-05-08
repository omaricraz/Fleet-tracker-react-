/**
 * Fetches Stitch screen HTML + screenshot URLs via API, then downloads with curl.
 * Requires STITCH_API_KEY (or Stitch OAuth env vars per @google/stitch-sdk).
 *
 * Usage (from frontend/):
 *   node scripts/fetch-stitch-screen.mjs <projectId> <screenId> [outDir]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stitch } from "@google/stitch-sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));

const projectId = process.argv[2] ?? "18187341505644561978";
const screenId = process.argv[3] ?? "02c3e253349c45edacc526a5fe28ab87";
const outDir =
  process.argv[4] ?? join(__dirname, "..", "stitch-assets", "driver-sales-pos-history");

function curlDownload(url, destPath) {
  execFileSync(
    "curl",
    ["-fSL", "--retry", "3", "-o", destPath, url],
    { stdio: "inherit" },
  );
}

async function main() {
  if (!process.env.STITCH_API_KEY && !process.env.STITCH_ACCESS_TOKEN) {
    console.error(
      "Missing STITCH_API_KEY (or STITCH_ACCESS_TOKEN + GOOGLE_CLOUD_PROJECT). See @google/stitch-sdk README.",
    );
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  const project = stitch.project(projectId);
  const screen = await project.getScreen(screenId);

  const htmlUrl = await screen.getHtml();
  const imageUrl = await screen.getImage();

  const meta = {
    title: "[Driver] Sales POS & History",
    projectId,
    screenId,
    htmlUrl,
    imageUrl,
  };

  writeFileSync(join(outDir, "download-urls.json"), JSON.stringify(meta, null, 2), "utf8");
  console.log("Wrote", join(outDir, "download-urls.json"));

  const htmlPath = join(outDir, "screen.html");
  const imagePath = join(outDir, "screen.png");

  console.log("Downloading HTML…");
  curlDownload(htmlUrl, htmlPath);
  console.log("Downloading screenshot…");
  curlDownload(imageUrl, imagePath);

  console.log("Done:", htmlPath, imagePath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
