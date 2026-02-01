import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const artifactsDir = path.resolve(process.cwd(), "artifacts");
const summaries = [];

if (!fs.existsSync(artifactsDir)) {
  console.error(`❌ Artifacts directory not found: ${artifactsDir}`);
  console.log("Current working directory:", process.cwd());
  console.log("Creating empty summary...");
  // Use a different folder for the output to avoid confusion if artifacts dir is missing
  const jobResultsDir = path.resolve(process.cwd(), "job-results");
  fs.mkdirSync(jobResultsDir, { recursive: true });
  fs.writeFileSync(path.join(jobResultsDir, "parsed-summary.json"), JSON.stringify([], null, 2));
  process.exit(0);
}

let dirs = [];
try {
  dirs = fs
    .readdirSync(artifactsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(artifactsDir, d.name));
} catch (error) {
  console.error(`❌ Error reading artifacts directory ${artifactsDir}: ${error.message}`);
  process.exit(1);
}

console.log(`Found ${dirs.length} artifact directories`);

for (const dir of dirs) {
  const dirName = path.basename(dir);
  console.log(`Processing: ${dirName}`);

  const logFile = path.join(dir, "log.txt");
  if (!fs.existsSync(logFile)) {
    console.warn(`⚠️  Log file missing in ${dirName}`);
    summaries.push({
      nodeVersion: dirName.replace("test-logs-", ""),
      status: "❌ Log missing",
    });
    continue;
  }

  let log;
  let status;
  try {
    log = fs.readFileSync(logFile, "utf8");
    if (log.includes("Tests passed successfully")) {
      status = "✅ Passed";
    } else if (log.includes("Tests failed")) {
      status = "❌ Failed";
    } else {
      status = "❓ Unknown";
    }
  } catch (error) {
    console.error(`❌ Error reading log file ${logFile}: ${error.message}`);
    status = "❓ Unknown";
  }

  summaries.push({
    nodeVersion: dirName.replace("test-logs-", ""),
    status,
  });
}

const outputPath = path.resolve(process.cwd(), "job-results", "parsed-summary.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(summaries, null, 2));

console.log(`✅ Parsed summary ready at ${outputPath} with ${summaries.length} results`);
console.log(JSON.stringify(summaries, null, 2));
