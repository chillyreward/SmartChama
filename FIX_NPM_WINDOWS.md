# Fix NPM on Windows - Execution Policy Error

## The Problem
Windows PowerShell blocks npm scripts by default for security reasons.

Error message:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

## Solutions

### Solution 1: Change Execution Policy (Recommended)

1. **Open PowerShell as Administrator**
   - Press `Win + X`
   - Click "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Run this command:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Type `Y` and press Enter to confirm**

4. **Close and reopen your terminal**

5. **Now run:**
   ```powershell
   npm run dev
   ```

### Solution 2: Use CMD Instead

1. **Open Command Prompt (CMD)**
   - Press `Win + R`
   - Type `cmd` and press Enter

2. **Navigate to your project:**
   ```cmd
   cd C:\Users\swanti\SmartChama
   ```

3. **Run the dev server:**
   ```cmd
   npm run dev
   ```

### Solution 3: Bypass for Single Command

In PowerShell (no admin needed):
```powershell
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

### Solution 4: Use VS Code Terminal with CMD

1. In VS Code, press `` Ctrl + ` `` to open terminal
2. Click the dropdown arrow next to the `+` button
3. Select "Command Prompt" (not PowerShell)
4. Run `npm run dev`

## After Starting the Server

Once the server starts, you should see:
```
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

Open your browser and go to: **http://localhost:3000**

## Troubleshooting

### If port 3000 is already in use:
```cmd
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3001
```

### If you get module errors:
```cmd
# Delete node_modules and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

### If you get TypeScript errors:
```cmd
# Clear Next.js cache
rmdir /s /q .next
npm run dev
```

## Recommended: Set Default Terminal to CMD

In VS Code:
1. Press `Ctrl + Shift + P`
2. Type "Terminal: Select Default Profile"
3. Select "Command Prompt"
4. Now all new terminals will use CMD instead of PowerShell

This avoids the execution policy issue entirely!
