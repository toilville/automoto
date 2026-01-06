# Phase E: Integration & Deployment Checklist

**Status**: ✅ COMPLETE  
**Date**: January 5, 2026  
**Next Step**: Production Deployment  

---

## Pre-Deployment Configuration

### 1. Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/knowledge_agent
DATABASE_POOL_SIZE=20
DATABASE_ECHO=false

# Authentication
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
BCRYPT_ROUNDS=12

# API
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=false
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Neo4j (optional)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

# Logging
LOG_LEVEL=INFO
STRUCTLOG_FORMAT=json

# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090

# Evaluation
EVALUATION_CACHE_TTL=3600
EVALUATION_TIMEOUT=300
```

### 2. Database Setup

```bash
# Install PostgreSQL (if not already installed)
# macOS
brew install postgresql@15

# Linux (Ubuntu)
sudo apt-get install postgresql-15

# Windows
# Download from https://www.postgresql.org/download/windows/

# Create database
createdb knowledge_agent

# Create user
createuser knowledge_user
psql -c "ALTER USER knowledge_user WITH PASSWORD 'secure_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE knowledge_agent TO knowledge_user;"

# Run migrations
cd project_root
alembic upgrade head
```

### 3. Redis Setup

```bash
# macOS
brew install redis
redis-server

# Linux
sudo apt-get install redis-server
redis-server

# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Verify
redis-cli ping  # Should return PONG
```

### 4. Neo4j Setup (Optional)

```bash
# Docker (recommended)
docker run \
  -d \
  --name neo4j \
  -p 7687:7687 \
  -p 7474:7474 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest

# Access: http://localhost:7474/browser/
```

---

## Installation Steps

### 1. Clone & Setup

```bash
cd knowledge-agent-poc
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

### 2. Install Dependencies

```bash
# Core dependencies
pip install -r requirements.txt

# Or specific versions for Phase E
pip install \
  fastapi==0.104.1 \
  sqlalchemy==2.0.23 \
  celery==5.3.4 \
  redis==5.0.1 \
  neo4j==5.17.0 \
  pydantic==2.5.0 \
  structlog==24.1.0 \
  prometheus-client==0.19.0 \
  psycopg2-binary==2.9.9 \
  alembic==1.13.0 \
  python-jose==3.3.0 \
  passlib==1.7.4 \
  python-multipart==0.0.6
```

### 3. Initialize Application

```bash
# Create .env file with configurations
cp .env.example .env
# Edit .env with your settings

# Run database migrations
alembic upgrade head

# Verify database
python -c "from infra.database import DatabaseEngine; db = DatabaseEngine(); print('Database connected!')"
```

---

## Service Startup

### 1. Start Main Application

```bash
# Terminal 1: Main API
python main.py

# Should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

### 2. Start Celery Worker

```bash
# Terminal 2: Celery worker
celery -A async_execution.celery_config worker --loglevel=info

# Should see:
# celery worker started, hostname=...@...
# Ready to accept tasks
```

### 3. Start Celery Beat (Optional - for scheduled tasks)

```bash
# Terminal 3: Celery beat scheduler
celery -A async_execution beat --loglevel=info

# Should see:
# celery beat scheduler started
```

---

## Verification Tests

### 1. Health Checks

```bash
# Main application health
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy", ...}

# Async health
curl http://localhost:8000/api/async/health

# Analytics health
curl http://localhost:8000/api/analytics/dashboard/health
```

### 2. Authentication Flow

```bash
# Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "TestPass123!", "email": "test@example.com"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "TestPass123!"}'

# Expected response: {"access_token": "...", "token_type": "bearer"}
```

### 3. Database Test

```bash
# List users
curl http://localhost:8000/api/auth/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Async Job Test

```bash
# Start evaluation job
curl -X POST http://localhost:8000/api/async/evaluate/project-1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected response: {"job_id": "...", "status": "queued"}

# Check job status
curl http://localhost:8000/api/async/jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Analytics Test

```bash
# Get real-time dashboard
curl http://localhost:8000/api/analytics/dashboard/realtime \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get daily report
curl "http://localhost:8000/api/analytics/reports/daily?date=2024-01-05" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Knowledge Graph Test

```bash
# Create node
curl -X POST http://localhost:8000/api/knowledge-graph/nodes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "node_id": "paper-1",
    "node_type": "PAPER",
    "properties": {"title": "Test Paper"}
  }'

# Search nodes
curl "http://localhost:8000/api/knowledge-graph/nodes/search?query=machine+learning" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Running Tests

### 1. Run All Tests

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# Coverage report will be in htmlcov/index.html
```

### 2. Run Specific Test Suites

```bash
# E1 Database tests
pytest tests/test_e1_database.py -v

# E1.2 Authentication tests
pytest tests/test_e1_2_authentication.py -v

# E1.4 Monitoring tests
pytest tests/test_e1_4_monitoring.py -v

# E2 Async tests
pytest tests/test_e2_async.py -v

# E3 Analytics tests
pytest tests/test_e3_analytics.py -v

# E4 Knowledge Graph tests
pytest tests/test_e4_knowledge_graph.py -v
```

### 3. Test Coverage Summary

```bash
# Generate coverage report
pytest tests/ --cov=. --cov-report=term-missing

# Expected coverage: >80% across all modules
```

---

## Production Deployment

### 1. Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/knowledge_agent
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
      - neo4j

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: knowledge_agent
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  neo4j:
    image: neo4j:latest
    environment:
      NEO4J_AUTH: neo4j/password
    ports:
      - "7687:7687"
      - "7474:7474"

  worker:
    build: .
    command: celery -A async_execution worker --loglevel=info
    depends_on:
      - redis
      - db

volumes:
  postgres_data:
```

Deploy:

```bash
docker-compose up -d
docker-compose logs -f api
```

### 2. Kubernetes Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: knowledge-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: knowledge-agent
  template:
    metadata:
      labels:
        app: knowledge-agent
    spec:
      containers:
      - name: api
        image: knowledge-agent:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          value: redis://redis-service:6379/0
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

Deploy:

```bash
kubectl apply -f k8s/
kubectl rollout status deployment/knowledge-agent
```

---

## Monitoring & Operations

### 1. Prometheus Metrics

Access metrics at: `http://localhost:9090`

Key metrics:
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `db_queries_total` - Total database queries
- `auth_attempts_total` - Authentication attempts
- `celery_tasks_total` - Async task count

### 2. Application Logs

Structured logs with JSON output:

```bash
# View logs
tail -f logs/application.log | jq '.'

# Filter by level
cat logs/application.log | jq 'select(.level=="error")'

# Filter by component
cat logs/application.log | jq 'select(.component=="database")'
```

### 3. Database Maintenance

```bash
# Backup
pg_dump knowledge_agent > backup.sql

# Restore
psql knowledge_agent < backup.sql

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM projects;
```

### 4. Redis Monitoring

```bash
# Check Redis stats
redis-cli INFO stats

# Monitor commands
redis-cli MONITOR

# Check memory
redis-cli INFO memory
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
Error: could not connect to server: Connection refused
```

**Solution**:
```bash
# Check PostgreSQL running
psql -U postgres -l

# Start PostgreSQL
pg_ctl -D /usr/local/var/postgres start  # macOS
sudo systemctl start postgresql           # Linux
```

#### 2. Redis Connection Error

```
Error: Connection refused, connection attempt failed
```

**Solution**:
```bash
# Check Redis running
redis-cli ping

# Start Redis
redis-server
```

#### 3. Worker Not Processing Tasks

```
# Check worker status
celery -A async_execution inspect active

# Restart worker
kill WORKER_PID
celery -A async_execution worker --loglevel=info
```

#### 4. Authentication Token Invalid

```
# Verify token
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer INVALID_TOKEN"

# Get new token
curl -X POST http://localhost:8000/api/auth/login \
  -d '{"username": "user", "password": "pass"}'
```

---

## Security Checklist

- [ ] Change default Neo4j password
- [ ] Set strong DATABASE_URL password
- [ ] Generate random SECRET_KEY (min 32 chars)
- [ ] Enable HTTPS in production
- [ ] Configure CORS for production domains
- [ ] Set up database backups
- [ ] Enable Redis password
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Enable database encryption
- [ ] Rotate JWT tokens periodically
- [ ] Audit access logs

---

## Performance Tuning

### Database

```sql
-- Create indexes for common queries
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_evaluations_project_id ON evaluations(project_id);
CREATE INDEX idx_artifacts_project_id ON artifacts(project_id);

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM evaluations WHERE project_id = $1;
```

### Celery

```python
# config/settings.py
CELERY_TASK_PREFETCH_MULTIPLIER = 4
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000
```

### Redis

```bash
# Increase max memory
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## Next Steps

1. **Immediate** (Day 1):
   - [ ] Setup PostgreSQL & Redis
   - [ ] Configure environment variables
   - [ ] Run database migrations
   - [ ] Start API and verify health

2. **Short-term** (Week 1):
   - [ ] Setup monitoring (Prometheus + Grafana)
   - [ ] Configure backup strategy
   - [ ] Setup CI/CD pipeline
   - [ ] Load test with expected traffic

3. **Medium-term** (Month 1):
   - [ ] Deploy to Kubernetes
   - [ ] Setup auto-scaling
   - [ ] Configure alerting
   - [ ] Performance optimization

4. **Long-term** (Q1 2026):
   - [ ] Add caching layer
   - [ ] Implement GraphQL
   - [ ] Setup data pipelines
   - [ ] Advanced ML models

---

## Support & Documentation

- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Completion Report**: PHASE_E_COMPLETION.md
- **Summary**: PHASE_E_SUMMARY.md
- **Code**: All source files include docstrings

---

**Status**: ✅ Ready for Production Deployment
