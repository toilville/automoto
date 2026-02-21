FROM python:3.11-slim

WORKDIR /app

COPY microsoft/deploy/requirements-starter.txt /tmp/requirements-starter.txt
RUN pip install --no-cache-dir -r /tmp/requirements-starter.txt

COPY microsoft /app/microsoft

ENV PORT=8010
EXPOSE 8010

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8010/health')" || exit 1

CMD ["python", "-m", "microsoft.agent", "serve", "--port", "8010"]
