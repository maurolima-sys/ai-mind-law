import { readFileSync } from "fs";
import { config } from "dotenv";
config({ path: ".env.local" });

const key = process.env["LLAMACLOUD_API_KEY"];
if (!key) {
  console.error("LLAMACLOUD_API_KEY not found");
  process.exit(1);
}

const pdfBytes = readFileSync("public/request_for_proposal.pdf");
console.log("PDF size:", pdfBytes.length, "bytes");
console.log("PDF header:", Buffer.from(pdfBytes.slice(0, 5)).toString());

// Step 1: upload
const form = new FormData();
form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "test.pdf");
form.append("purpose", "parse");

const upRes = await fetch("https://api.cloud.llamaindex.ai/api/v1/beta/files", {
  method: "POST",
  headers: { Authorization: "Bearer " + key },
  body: form,
});
const upText = await upRes.text();
console.log("\n--- UPLOAD ---");
console.log("Status:", upRes.status);
console.log("Body:", upText.slice(0, 600));

if (!upRes.ok) process.exit(1);

const { id: fileId } = JSON.parse(upText);
console.log("File ID:", fileId);

// Step 2: start parse
const parseRes = await fetch("https://api.cloud.llamaindex.ai/api/v2/parse", {
  method: "POST",
  headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
  body: JSON.stringify({ file_id: fileId, tier: "fast", version: "latest" }),
});
const parseText = await parseRes.text();
console.log("\n--- PARSE START ---");
console.log("Status:", parseRes.status);
console.log("Body:", parseText.slice(0, 600));
