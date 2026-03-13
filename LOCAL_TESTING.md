# Local Testing Guide for Automoto Bot

**Updated**: December 18, 2025  
**Bot Framework Emulator**: v4.14.1+ (Modern Version)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd d:\code\automoto
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed botbuilder-core-4.20.0 botbuilder-integration-aiohttp-4.20.0 aiohttp-3.9.0 ...
```

### Step 2: Start Bot Server

```bash
python bot_server.py
```

**Expected output:**
```
INFO:__main__:Automoto Bot Server starting on port 3978
INFO:__main__:Starting Automoto Bot Server on 0.0.0.0:3978
INFO:__main__:Messages endpoint: http://0.0.0.0:3978/api/messages
INFO:__main__:Health check: http://0.0.0.0:3978/health
```

### Step 3: Test Health Endpoint

In another terminal:
```bash
curl http://localhost:3978/health
```

**Expected response:**
```json
{"status":"ok","service":"Automoto Bot","port":3978}
```

---

## 🤖 Bot Framework Emulator (Modern Version)

### What is the Modern Bot Framework Emulator?

**Bot Framework Emulator v4.14.1+** (Latest as of 2024-2025)

- **Repository**: https://github.com/microsoft/BotFramework-Emulator
- **Latest Release**: https://github.com/microsoft/BotFramework-Emulator/releases/latest
- **Supported Platforms**: Windows, macOS, Linux

### Download & Install

#### Windows
```bash
# Download the latest .exe installer
# https://github.com/microsoft/BotFramework-Emulator/releases/download/v4.14.1/BotFramework-Emulator-4.14.1-windows-setup.exe

# Or use winget (Windows 11)
winget install Microsoft.BotFrameworkEmulator
```

#### macOS
```bash
# Download .dmg
# https://github.com/microsoft/BotFramework-Emulator/releases/download/v4.14.1/BotFramework-Emulator-4.14.1-mac.dmg

# Or use Homebrew
brew install --cask bot-framework-emulator
```

#### Linux
```bash
# Download .AppImage
# https://github.com/microsoft/BotFramework-Emulator/releases/download/v4.14.1/BotFramework-Emulator-4.14.1-linux-x86_64.AppImage

# Make executable and run
chmod +x BotFramework-Emulator-4.14.1-linux-x86_64.AppImage
./BotFramework-Emulator-4.14.1-linux-x86_64.AppImage
```

---

## 🔧 Configure Bot Framework Emulator

### First Time Setup

1. **Launch Bot Framework Emulator**
2. Click **"Create a new bot configuration"** or **"Open Bot"**
3. Enter bot endpoint details:

   ```
   Bot URL: http://localhost:3978/api/messages
   Microsoft App ID: (leave empty for local testing)
   Microsoft App Password: (leave empty for local testing)
   ```

4. Click **"Connect"**

### Save Configuration (Optional)

To save your bot configuration:

1. Click **File → Save Bot Configuration As...**
2. Save as `automoto-local.bot` in your project directory
3. Next time, just **File → Open Bot Configuration**

---

## 🧪 Testing Scenarios

### Scenario 1: Basic Commands

**Start conversation:**
```
You: help
```

**Expected response:**
```
**Automoto Agent - Commands**

1. **recommend** - Get session recommendations
   `@bot recommend agents, ai safety --top 5`

2. **explain** - Understand why a session matches
   ...
```

### Scenario 2: Recommend Sessions

**Send message:**
```
You: recommend agents, machine learning --top 3
```

**Expected response:**
- Typing indicator (shows bot is processing)
- Adaptive card with 3 recommended sessions
- Text summary: "Found 3 recommended sessions based on: agents, machine learning"

### Scenario 3: Explain Session

**Send message:**
```
You: explain "Generative Agents in Production" --interests agents
```

**Expected response:**
- Markdown-formatted explanation
- Matched keywords list
- Relevance score

### Scenario 4: Export Itinerary

**Send message:**
```
You: export agents, ai safety --profile test_profile
```

**Expected response:**
- Full itinerary in Markdown format
- Confirmation: "✅ Profile 'test_profile' saved!"

### Scenario 5: Natural Language

**Send message:**
```
You: I want sessions about agents and AI safety
```

**Expected response:**
- Bot detects intent
- Extracts keywords: "agents, ai, safety"
- Returns recommendations

---

## 🐛 Common Issues & Solutions

### Issue 1: "Bot Framework SDK not installed"

**Error:**
```
Bot Framework SDK is required. Install with: pip install botbuilder-core botbuilder-integration-aiohttp
```

**Solution:**
```bash
pip install botbuilder-core>=4.20.0 botbuilder-integration-aiohttp>=4.20.0 aiohttp>=3.8.0
```

### Issue 2: "Automoto components not available"

**Error:**
```
WARNING:__main__:Automoto components not available: No module named 'agents_sdk_adapter'
```

**Solution:**
```bash
# Make sure you're in the project directory
cd d:\code\automoto

# Verify files exist
ls agents_sdk_adapter.py bot_handler.py

# If missing, the files might not have been created
```

### Issue 3: "Connection refused" in Bot Emulator

**Error in Emulator:**
```
Error: connect ECONNREFUSED 127.0.0.1:3978
```

**Solutions:**
1. Check bot server is running: `curl http://localhost:3978/health`
2. Restart bot server: `python bot_server.py`
3. Check firewall isn't blocking port 3978
4. Try `http://127.0.0.1:3978/api/messages` instead of `localhost`

### Issue 4: Bot responds with errors

**Error response:**
```
Error: InvalidInputError: 'interests' parameter is required
```

**Solution:**
- Make sure you're using correct command format
- Example: `recommend agents, ai safety` (not just `recommend`)
- Check command reference in TEAMS_QUICK_REFERENCE.md

### Issue 5: Import errors with core functions

**Error:**
```
AttributeError: module 'core' has no attribute 'recommend'
```

**Solution:**
```bash
# Verify core.py exists and has the functions
python -c "from core import recommend, explain; print('OK')"

# If error, check core.py is present
ls core.py
```

---

## 🔍 Debugging Tips

### Enable Verbose Logging

Modify `bot_server.py` temporarily:

```python
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO to DEBUG
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### View Bot Emulator Logs

In Bot Framework Emulator:
1. Click **"Log"** panel at bottom
2. Expand to see detailed HTTP requests/responses
3. Check for errors or unexpected responses

### Check Request/Response in Emulator

Click on any message in the conversation:
- **Request**: Shows what was sent to your bot
- **Response**: Shows what your bot returned
- **JSON**: View raw JSON data

### Test with curl Instead

```bash
# Send test message directly
curl -X POST http://localhost:3978/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message",
    "text": "recommend agents",
    "from": {"id": "user1", "name": "Test User"},
    "recipient": {"id": "bot", "name": "Automoto"},
    "id": "msg1",
    "channelId": "emulator",
    "conversation": {"id": "conv1"}
  }'
```

---

## 🎯 Advanced Testing

### Test Graph Integration (Optional)

If you have Graph credentials configured:

```bash
# Set environment variables
$env:GRAPH_TENANT_ID="your-tenant-id"
$env:GRAPH_CLIENT_ID="your-client-id"
$env:GRAPH_CLIENT_SECRET="your-client-secret"

# Restart bot server
python bot_server.py

# In Bot Emulator, test:
You: recommend agents --use_graph true
```

### Test Rate Limiting

Send rapid requests to verify rate limiting works:

```bash
# PowerShell script to test rate limiting
for ($i=1; $i -le 110; $i++) {
    curl http://localhost:3978/health
    Write-Host "Request $i"
}
```

After 100 requests in 60 seconds, you should see rate limit errors.

### Test Error Handling

Try invalid commands to verify error handling:

```
recommend                           # Missing interests
explain "Test"                      # Missing interests
export                              # Missing interests
invalid_command                     # Unknown command
```

Expected: Graceful error messages, not crashes

---

## 📊 Performance Benchmarking

### Response Time Test

```bash
# Measure recommendation response time
Measure-Command {
    curl -X POST http://localhost:3978/api/messages `
      -H "Content-Type: application/json" `
      -d '{
        "type": "message",
        "text": "recommend agents",
        "from": {"id": "user1"},
        "recipient": {"id": "bot"},
        "id": "msg1"
      }'
}
```

**Target**: < 2 seconds for recommendations

### Load Test (Simple)

```bash
# Run 100 concurrent requests
1..100 | ForEach-Object -Parallel {
    curl http://localhost:3978/health
} -ThrottleLimit 10
```

---

## ✅ Local Testing Checklist

Before deploying to Azure, verify locally:

- [ ] Bot server starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Bot Emulator connects successfully
- [ ] All 4 commands work (recommend, explain, export, help)
- [ ] Natural language queries work
- [ ] Error messages are clear and helpful
- [ ] Response times < 2 seconds
- [ ] No crashes on invalid input
- [ ] Logs appear correctly
- [ ] Rate limiting enforces limits

---

## 🔄 Alternative Testing (Without Emulator)

### Option 1: Using PowerShell

```powershell
# Create test message
$body = @{
    type = "message"
    text = "recommend agents"
    from = @{ id = "user1"; name = "Test User" }
    recipient = @{ id = "bot"; name = "Automoto" }
    id = "msg-$(Get-Random)"
    channelId = "test"
    conversation = @{ id = "conv1" }
} | ConvertTo-Json

# Send to bot
Invoke-RestMethod -Uri "http://localhost:3978/api/messages" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Option 2: Using Python Script

Create `test_bot_local.py`:

```python
import requests
import json

def test_bot(message: str):
    """Send test message to local bot."""
    payload = {
        "type": "message",
        "text": message,
        "from": {"id": "user1", "name": "Test User"},
        "recipient": {"id": "bot", "name": "Automoto"},
        "id": f"msg-{hash(message)}",
        "channelId": "test",
        "conversation": {"id": "conv1"}
    }
    
    response = requests.post(
        "http://localhost:3978/api/messages",
        json=payload
    )
    
    print(f"Status: {response.status_code}")
    if response.text:
        print(f"Response: {response.text}")

# Test commands
test_bot("help")
test_bot("recommend agents, ai safety")
test_bot("explain \"Session Title\" --interests agents")
```

Run with:
```bash
python test_bot_local.py
```

---

## 🎓 Next Steps After Local Testing

Once local testing passes:

1. **Deploy to Azure** → Follow `docs/deployment-guide.md`
2. **Register Bot Service** → Get production Bot ID/Password
3. **Update Configuration** → Use real credentials
4. **Test in Teams** → Upload teams-app.json
5. **Monitor** → Check Application Insights logs

---

## 📞 Need Help?

| Issue | Resource |
|-------|----------|
| Bot Emulator not connecting | Check firewall, restart bot server |
| Commands not working | See TEAMS_QUICK_REFERENCE.md for format |
| Import errors | Verify all files created: `ls *.py` |
| Performance issues | Check manifest size, enable caching |
| Graph integration | See docs/03-GRAPH-API/troubleshooting.md |

---

**Bot Framework Emulator Version**: v4.14.1+  
**Recommended**: Download from https://github.com/microsoft/BotFramework-Emulator/releases/latest  
**Status**: Modern, actively maintained, production-ready

---

*Test locally first, then deploy with confidence!* ✅
