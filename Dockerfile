# Camodevops.online — Docker Deployment
# Cloudflare Workers alternative: runs as a standalone Node.js server

FROM node:20-slim

WORKDIR /app

# Install Python for site generation
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate the static site
RUN python3 generate_site.py

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose ports
# 8080 - Main server (static site + webhook)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the server
CMD ["node", "server.js"]
