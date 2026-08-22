# Agentic Harness — WhatsApp + Telegram AI backend
# No build step, no external deps — plain Node http server.

FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY server.js ./

RUN mkdir -p /app/memory \
    && groupadd -r appuser && useradd -r -g appuser appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s \
  CMD node -e "fetch('http://localhost:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
