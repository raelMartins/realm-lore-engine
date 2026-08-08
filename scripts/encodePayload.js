// Encode a world content JSON file for NEXT_PUBLIC_COMPANY_DATA
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
  console.log("Encoded world content string:");
  console.log("=======================================================\n");
  console.log(base64String);
  console.log("\n=======================================================");
  console.log("Set as deployment env var:");
  console.log("NEXT_PUBLIC_COMPANY_DATA");
  console.log("=======================================================\n");
} catch (err) {
  console.error("Error reading or parsing JSON file:", err.message);
}
