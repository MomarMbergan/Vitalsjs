/**
 * processIDscan.js
 * Reads IDscan.html, extracts scanned front and back image data,
 * formats it into one paragraph, and appends it to InsuranceDatafile.txt
 * with two paragraph spaces between each record.
 */

import fs from "fs";

// Paths to your files in the repo
const idScanPath = "IDscan.html";
const insuranceFilePath = "InsuranceDatafile.txt";

try {
  // 1️⃣ Read the HTML scan file
  const html = fs.readFileSync(idScanPath, "utf8");

  // 2️⃣ Extract image data (for <img id="frontScan" src="..." /> and <img id="backScan" src="..." />)
  const frontMatch = html.match(/<img[^>]*id=["']frontScan["'][^>]*src=["']([^"']+)["']/i);
  const backMatch = html.match(/<img[^>]*id=["']backScan["'][^>]*src=["']([^"']+)["']/i);

  if (!frontMatch || !backMatch) {
    console.error("❌ Could not find both front and back scan data in IDscan.html");
    process.exit(1);
  }

  const frontData = frontMatch[1].trim();
  const backData = backMatch[1].trim();

  // 3️⃣ Create formatted paragraph text
  const timestamp = new Date().toISOString();
  const paragraph = `🪪 ID Scan Recorded: ${timestamp}\nFront Scan Data: ${frontData} Back Scan Data: ${backData}\n\n\n`;

  // 4️⃣ Append to the InsuranceDatafile.txt file (creates if missing)
  fs.appendFileSync(insuranceFilePath, paragraph, "utf8");

  console.log("✅ Successfully appended scan data to InsuranceDatafile.txt");

} catch (err) {
  console.error("❌ Error processing ID scan:", err);
  process.exit(1);
}
