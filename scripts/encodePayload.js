// scripts/encodePayload.js
// Run with: node scripts/encodePayload.js <path-to-json>
const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node scripts/encodePayload.js <path-to-json-file>");
  process.exit(1);
}

try {
  const absolutePath = path.resolve(filePath);
  const jsonRaw = fs.readFileSync(absolutePath, "utf-8");

  // Validate JSON format
  JSON.parse(jsonRaw);

  const base64String = Buffer.from(jsonRaw).toString("base64");

  console.log("\n=======================================================");
  console.log("SUCCESS! Here is your Base64 Encoded Environment String:");
  console.log("=======================================================\n");
  console.log(base64String);
  console.log("\n=======================================================");
  console.log("Paste this into Vercel under Environment Variable:");
  console.log("NEXT_PUBLIC_COMPANY_DATA");
  console.log("=======================================================\n");
} catch (err) {
  console.error("Error reading or parsing JSON file:", err.message);
}
