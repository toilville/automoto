# Automoto - Development Setup

## Quick Start

```bash
# Run the setup script
bash setup.sh

# Or manually:
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
pre-commit install
```

## Available Commands

```bash
make help          # Show all available commands
make install       # Install production dependencies
make dev           # Install development dependencies + pre-commit hooks
make test          # Run all tests with coverage
make lint          # Run linting checks
make format        # Auto-format code
make run           # Run the agent server locally
make docker-build  # Build Docker image
make docker-run    # Run Docker container
make clean         # Remove cached files
```

## Configuration

1. Copy the environment template:
   ```bash
   cp deploy/.env.example deploy/.env
   ```

2. Update `deploy/.env` with your credentials:
   - `APP_INSIGHTS_CONNECTION_STRING` - Application Insights connection string
   - `API_TOKEN` - API authentication token
   - `GRAPH_*` - Microsoft Graph API credentials

## Pre-commit Hooks

Pre-commit hooks automatically run before each commit to ensure code quality:

- **black**: Code formatting
- **isort**: Import sorting
- **pylint**: Code linting
- **bandit**: Security checks
- **pytest**: Run tests

Install hooks with:
```bash
pre-commit install
```

Run manually:
```bash
pre-commit run --all-files
```

Skip hooks (not recommended):
```bash
git commit --no-verify
```

## Running Tests

```bash
# Run all tests with coverage
make test

# Run tests quickly (stop on first failure)
make test-fast

# Run specific test file
pytest tests/test_recommend.py -v

# Run with specific marker
pytest -m security -v
```

## Code Quality

```bash
# Check code formatting
make lint

# Auto-format code
make format

# Run security scan
bandit -r . -f txt
```

## Local Development

```bash
# Run the agent server
make run

# Run with unbuffered output (better for debugging)
make run-dev

# Check health endpoint
make health
```

## Docker Development

```bash
# Build Docker image
make docker-build

# Run container
make docker-run

# View logs
make docker-logs

# Stop container
make docker-stop

# Open shell in running container
make docker-shell
```

## Azure Deployment

```bash
# Deploy to development
make deploy-dev

# Deploy to production
make deploy-prod

# Or use GitHub Actions workflow (recommended)
git push origin main  # Triggers CI/CD pipeline
```

## Troubleshooting

### Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt requirements-dev.txt
```

### Test Failures
```bash
# Clear pytest cache
rm -rf .pytest_cache
pytest --cache-clear

# Run with verbose output
pytest -vv --tb=long
```

### Docker Issues
```bash
# Rebuild without cache
docker build --no-cache -t automoto:latest -f deploy/Dockerfile .

# Remove all containers and images
make docker-stop
docker system prune -a
```

### Pre-commit Hook Failures
```bash
# Update pre-commit hooks
pre-commit autoupdate

# Clean and reinstall
pre-commit clean
pre-commit install
```

## CI/CD Pipeline

GitHub Actions workflows are configured for:

- **test.yml** - Run tests on every PR/push
- **lint.yml** - Run linting checks
- **deploy.yml** - Deploy to Azure on merge to main
- **security.yml** - Weekly security scans

Configure GitHub secrets:
- `AZURE_CLIENT_ID` - Azure service principal client ID
- `AZURE_TENANT_ID` - Azure tenant ID
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID
- `AZURE_RESOURCE_GROUP` - Resource group name
- `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_USER_ID`
- `API_TOKEN` - API authentication token
- `CODECOV_TOKEN` - (Optional) Codecov token for coverage reports

## Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and run tests: `make test`
3. Format code: `make format`
4. Commit changes (pre-commit hooks run automatically)
5. Push branch: `git push origin feature/my-feature`
6. Open PR (CI runs automatically)
7. Merge to main (triggers deployment)

## VSCode Dev Containers

Open in Dev Container:
1. Install "Dev Containers" extension
2. Press `F1` → "Dev Containers: Reopen in Container"
3. Wait for container to build
4. All tools and dependencies pre-installed

## Additional Resources

- [Technical Guide](docs/technical-guide.md)
- [Evaluation Guide](docs/evaluation.md)
- [Performance Guide](docs/performance-guide.md)
- [Troubleshooting](docs/troubleshooting.md)
