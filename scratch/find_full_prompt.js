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

for (let i = 0; i < lines.length; i++) {
  try {
    const step = JSON.parse(lines[i]);
    if (step.type === 'USER_INPUT') {
      const match = step.content.includes("complete rebuild") || step.content.includes("Saturday investor demo");
      console.log(`Step ${i}: type=${step.type}, status=${step.status}, length=${step.content.length}, match=${match}`);
      if (match) {
        console.log("Snippet:", step.content.substring(0, 200));
      }
    }
  } catch (e) {}
}
