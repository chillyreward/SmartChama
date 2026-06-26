const fs = require('fs');
const readline = require('readline');

async function extractPrompt() {
  const logFile = "C:\\Users\\Lenny\\.gemini\\antigravity\\brain\\9059de9f-8704-41d5-b721-f41b9899368f\\.system_generated\\logs\\transcript_full.jsonl";
  
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lastUserInput = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' || (obj.source === 'USER_EXPLICIT' && obj.type === 'USER_INPUT')) {
        lastUserInput = obj;
      }
    } catch (err) {
      // ignore parse errors
    }
  }
  
  if (lastUserInput) {
    console.log("SUCCESS");
    fs.writeFileSync("last_user_prompt.txt", lastUserInput.content || lastUserInput.raw_content || JSON.stringify(lastUserInput));
  } else {
    console.log("No USER_INPUT found");
  }
}

extractPrompt();
