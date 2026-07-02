const fs = require('fs');
const path = require('path');

const logDir = 'C:\\Users\\Lenny\\.gemini\\antigravity\\brain\\9059de9f-8704-41d5-b721-f41b9899368f\\.system_generated\\logs';
const fullLogPath = path.join(logDir, 'transcript_full.jsonl');

if (!fs.existsSync(fullLogPath)) {
  console.log("transcript_full.jsonl does not exist!");
  process.exit(1);
}

const fileContent = fs.readFileSync(fullLogPath, 'utf8');
const lines = fileContent.trim().split('\n');

try {
  const step = JSON.parse(lines[5380]);
  fs.writeFileSync('scratch/untruncated_prompt_5380.txt', step.content);
  console.log("Successfully wrote Step 5380 to scratch/untruncated_prompt_5380.txt, length: " + step.content.length);
} catch (e) {
  console.error("Failed to parse or write Step 5380:", e);
}
