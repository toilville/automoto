# Automoto Quick Start Guide

> **AI-powered event recommendation agent** with CLI, HTTP API, Teams Bot, and Copilot Studio integration

## 🚀 Installation

```bash
# Clone the repo
cd automoto

# Install dependencies
pip install -r requirements.txt

# Verify installation
python agent.py recommend --interests "agents" --top 3
```

✅ **190+ tests passing** | 📚 **Complete documentation** | 🐳 **Docker ready** | 🔌 **Unified adapters**

---

## 🎯 Quick Start: Choose Your Mode

### 1️⃣ CLI Mode (Instant Testing)

**Best for**: Quick testing, scripting, automation

```bash
# Get recommendations
python agent.py recommend --interests "agents, ai safety" --top 3

# Explain a session match
python agent.py explain --session "Generative Agents in Production" --interests "agents, gen ai"

# Export itinerary to Markdown
python agent.py export --interests "agents, privacy" --output my_itinerary.md

# Save/load profiles
python agent.py recommend --interests "agents" --profile-save demo
python agent.py recommend --profile-load demo --top 5
```

### 2️⃣ HTTP API Server

**Best for**: REST API testing, integration, web apps

```bash
# Start server (port 8010 by default)
python agent.py serve --port 8010 --card

# Test endpoints
curl http://localhost:8010/health
curl "http://localhost:8010/recommend?interests=agents,ai+safety&top=3&card=1"
curl "http://localhost:8010/explain?session=Generative+Agents+in+Production&interests=agents"
curl "http://localhost:8010/export?interests=agents"
```

**Available endpoints**:
- `GET /health` - Health check
- `GET /recommend` - Get recommendations
- `GET /recommend-graph` - Calendar-based recommendations (requires Graph credentials)
- `GET /explain` - Explain session match
- `GET /export` - Export itinerary

### 3️⃣ Bot Framework Emulator

**Best for**: Conversation testing, adaptive cards, bot development

**Setup**:
1. Download [Bot Framework Emulator v4.14.1+](https://github.com/microsoft/BotFramework-Emulator/releases)
2. Start the bot server:
   ```bash
   python bot_server.py
   ```
3. Open Bot Framework Emulator
4. Connect to: `http://localhost:3978/api/messages`

**Test commands**:
```
@bot recommend agents, ai safety --top 5
@bot explain "Session Title" --interests agents
@bot export agents --profile my_profile
@bot help
```

📖 **Full guide**: [LOCAL_TESTING.md](LOCAL_TESTING.md#3-bot-framework-emulator)

### 4️⃣ Microsoft Teams Bot

**Best for**: Real Teams integration, production testing

**Setup** (requires ngrok + Azure Bot registration):
1. Install ngrok: `choco install ngrok` (Windows) or [download](https://ngrok.com/download)
2. Start bot server: `python bot_server.py`
3. Start ngrok tunnel: `ngrok http 3978`
4. Update Teams manifest with ngrok URL
5. Upload to Teams: **Apps → Manage your apps → Upload an app**

**In Teams**:
```
@Automoto recommend agents, ai safety --top 5
@Automoto explain "Session Title" --interests agents
@Automoto help
```

📖 **Full guide**: [docs/agents-sdk-setup.md](docs/agents-sdk-setup.md)

### 5️⃣ Docker Container

**Best for**: Production-like testing, deployment validation

```bash
# Build image
docker build -t automoto:latest -f deploy/Dockerfile .

# Run container
docker run -d -p 8010:8010 --name automoto automoto:latest

# Test
curl http://localhost:8010/health
curl "http://localhost:8010/recommend?interests=agents&top=3"

# View logs
docker logs automoto

# Stop
docker stop automoto
```

**With Docker Compose**:
```bash
cd deploy
docker compose up -d
docker compose logs -f
```

📖 **Full guide**: [LOCAL_TESTING.md](LOCAL_TESTING.md#5-docker-local)

---

### 6️⃣ Microsoft Foundry (Azure AI Foundry)

**Best for**: Production AI orchestration, model evaluation, multi-agent systems

**Prerequisites**:
- Azure subscription
- Azure CLI installed
- Contributor role on subscription

**Deploy infrastructure** (10 minutes):
```bash
# Login to Azure
az login

# Deploy Foundry resources
az deployment group create \
  --resource-group automoto-foundry-rg \
  --template-file infra/main.bicep \
  --parameters deployFoundry=true openAIResourceName=automoto-openai

# Get deployment outputs
az deployment group show \
  --resource-group automoto-foundry-rg \
  --name main \
  --query properties.outputs
```

**Install Agent Framework SDK** (--pre flag required):
```bash
pip install agent-framework-azure-ai --pre
pip install promptflow promptflow-azure
```

**Configure environment**:
```bash
# Set Foundry environment variables
export FOUNDRY_ENABLED=true
export FOUNDRY_PROJECT_ENDPOINT="https://eastus.api.azureml.ms"
export FOUNDRY_SUBSCRIPTION_ID="your-subscription-id"
export FOUNDRY_RESOURCE_GROUP="automoto-foundry-rg"
export FOUNDRY_PROJECT_NAME="automoto-prod-project"
export FOUNDRY_MODEL_DEPLOYMENT="gpt-4o"
```

**Test Agent Framework**:
```python
from agent_framework_adapter import EventKitAgentFramework as AutomotoAgentFramework
import asyncio

async def test():
    agent = AutomotoAgentFramework()
    response = await agent.run("recommend sessions about AI agents and machine learning")
    print(response)

asyncio.run(test())
```

**Deploy Prompt Flow**:
```bash
# Test flow locally
pf flow test --flow flow.dag.yaml --inputs user_message="recommend AI sessions"

# Deploy to Foundry
pf flow create \
  --flow flow.dag.yaml \
  --workspace-name automoto-prod-project \
  --resource-group automoto-foundry-rg
```

**What you get**:
- ✅ AI Hub and Project for centralized management
- ✅ GPT-4o and GPT-3.5-turbo model deployments
- ✅ Prompt Flow orchestration (4-node workflow)
- ✅ Evaluation framework (precision, recall, F1, relevance scoring)
- ✅ Managed compute and auto-scaling
- ✅ Enterprise security (RBAC, Key Vault integration)

📖 **Complete guide**: [docs/foundry-deployment.md](docs/foundry-deployment.md)

---

## 🔧 Microsoft Graph Integration (Optional)

**Best for**: Calendar-based recommendations, real user data

**One-time setup** (5 minutes):
```bash
# Set Graph credentials
export GRAPH_TENANT_ID=your-tenant-id
export GRAPH_CLIENT_ID=your-client-id
export GRAPH_CLIENT_SECRET=your-client-secret

# Verify
python -c "from settings import Settings; print('Ready:', Settings().validate_graph_ready())"
```

**Usage**:
```bash
# CLI
python agent.py recommend --source graph --interests "ai safety" --top 3 --user-id user@company.com

# HTTP API
curl "http://localhost:8010/recommend-graph?interests=ai+safety&top=3&userId=user@company.com"
```

📖 **Full setup**: [docs/03-GRAPH-API/graph-setup.md](docs/03-GRAPH-API/graph-setup.md)

---

## 🧪 Testing Environments Comparison

| Environment | Setup Time | Use Case | Authentication | Adaptive Cards |
|-------------|------------|----------|----------------|----------------|
| **CLI** | 0 min | Quick testing | ❌ | ❌ |
| **HTTP API** | 0 min | REST testing | ❌ | ✅ |
| **Bot Emulator** | 5 min | Conversation testing | ❌ | ✅ |
| **Teams (ngrok)** | 15 min | Teams integration | ✅ | ✅ |
| **Docker** | 5 min | Production-like | ❌ | ✅ |
| **Foundry** | 15 min | AI orchestration | ✅ | ✅ |
| **Copilot Studio** | 30 min | Copilot testing | ✅ | ✅ |
| **Azure Production** | 60 min | Live deployment | ✅ | ✅ |

📖 **Complete testing guide**: [LOCAL_TESTING.md](LOCAL_TESTING.md)

---

## 📚 Documentation Hub

### Getting Started
- **[README.md](README.md)** - Main documentation
- **[QUICKSTART.md](QUICKSTART.md)** (this file) - Quick start guide
- **[LOCAL_TESTING.md](LOCAL_TESTING.md)** - Multi-channel testing guide

### Integration Guides

- **[docs/agents-sdk-setup.md](docs/agents-sdk-setup.md)** - Teams/Copilot integration (690+ lines)
- **[docs/deployment-guide.md](docs/deployment-guide.md)** - Production deployment (500+ lines)
- **[docs/UNIFIED_ADAPTER_ARCHITECTURE.md](docs/UNIFIED_ADAPTER_ARCHITECTURE.md)** ⭐ - Unified adapter pattern

### Development

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer guide
- **[docs/api-guide.md](docs/api-guide.md)** - API reference (100+ examples)
- **[docs/technical-guide.md](docs/technical-guide.md)** - Architecture deep dive
- **[docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Testing guide (190+ tests)

---

## 🎨 Manifest Editing

**No code changes required** - edit `agent.json` to:
- Add/remove sessions
- Adjust scoring weights
- Configure features (telemetry, export, external data)

```json
{
  "weights": {
    "interest_match": 0.40,
    "relevance": 0.25,
    "speaker_quality": 0.20,
    "novelty": 0.15
  },
  "features": {
    "telemetry": true,
    "export": true,
    "externalSessions": false
  }
}
```

After editing, rerun any command - changes take effect immediately.

---

## 🧪 Run Tests

```bash
# All tests (190+ passing)
python -m pytest tests -v

# Specific test file
python -m pytest tests/test_unified_adapters.py -v

# With coverage
python -m pytest tests --cov=. --cov-report=html
```

---

## 🐳 systemd Service (Optional)

```ini
[Unit]
Description=Automoto Agent
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/event-agent-example
ExecStart=/usr/bin/python3 agent.py serve --port 8010 --card
Restart=on-failure
Environment="GRAPH_TENANT_ID=your-tenant-id"
Environment="GRAPH_CLIENT_ID=your-client-id"
Environment="GRAPH_CLIENT_SECRET=your-client-secret"

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable --now eventkit.service
sudo systemctl status eventkit
```

---

## 🚀 Next Steps

1. **Test locally**: Choose your preferred testing environment above
2. **Configure Graph**: [docs/03-GRAPH-API/graph-setup.md](docs/03-GRAPH-API/graph-setup.md)
3. **Deploy to Teams**: [docs/agents-sdk-setup.md](docs/agents-sdk-setup.md)
4. **Deploy to Azure**: [docs/deployment-guide.md](docs/deployment-guide.md)
5. **Customize scoring**: Edit `agent.json` weights

---

## 💡 Tips

- **Profile persistence**: Saved at `~/.event_agent_profiles.json`
- **External sessions**: Drop `sessions_external.json` and enable feature in `agent.json`
- **Telemetry**: Check `telemetry.jsonl` for request logs
- **Adaptive Cards**: Add `?card=1` to HTTP endpoints or use `--card` flag
- **Docker logs**: `docker logs eventkit` or `docker compose logs -f`

---

## 🆘 Troubleshooting

### Bot server won't start
```bash
# Check if port 3978 is in use
netstat -ano | findstr :3978  # Windows
lsof -i :3978                 # macOS/Linux

# Use different port
python bot_server.py --port 3979
```

### Graph authentication fails
```bash
# Verify credentials
python -c "from settings import Settings; s=Settings(); print('Tenant:', s.graph_tenant_id); print('Ready:', s.validate_graph_ready())"

# Check Azure AD app permissions
# Required: Calendars.Read, User.Read
```

### Tests failing
```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run specific test
python -m pytest tests/test_agents_sdk.py::test_adapter_recommend -v
```

**More help**: [docs/troubleshooting.md](docs/troubleshooting.md)

---

**More help**: [docs/troubleshooting.md](docs/troubleshooting.md) or [README.md](README.md)
