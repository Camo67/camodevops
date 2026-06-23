#!/bin/bash
# Camodevops.online — Deploy Script
# Usage: ./deploy.sh [build|up|down|logs|backup]

set -e

ACTION="${1:-up}"
COMPOSE_FILE="docker-compose.yml"

echo "╔══════════════════════════════════════════╗"
echo "║   Camodevops.online — Deploy Script      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

case $ACTION in
  build)
    echo "🔨 Building images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    echo "✅ Build complete"
    ;;
    
  up)
    echo "🚀 Starting services..."
    docker-compose -f $COMPOSE_FILE up -d
    echo ""
    echo "✅ Services started:"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    echo "📋 URLs:"
    echo "   Site:      http://localhost:8080"
    echo "   Webhook:   http://localhost:8080/webhook"
    echo "   Health:    http://localhost:8080/health"
    echo "   Harness:   http://localhost:8081"
    echo "   Ollama:    http://localhost:11434"
    ;;
    
  down)
    echo "🛑 Stopping services..."
    docker-compose -f $COMPOSE_FILE down
    echo "✅ Services stopped"
    ;;
    
  logs)
    echo "📋 Showing logs (Ctrl+C to exit)..."
    docker-compose -f $COMPOSE_FILE logs -f
    ;;
    
  restart)
    echo "🔄 Restarting services..."
    docker-compose -f $COMPOSE_FILE restart
    echo "✅ Services restarted"
    ;;
    
  status)
    echo "📊 Service status:"
    docker-compose -f $COMPOSE_FILE ps
    ;;
    
  backup)
    echo "💾 Creating backup..."
    BACKUP_DIR="./backups"
    DATE=$(date +%Y-%m-%d_%H-%M-%S)
    mkdir -p $BACKUP_DIR
    
    # Backup harness memory
    docker cp camodevops-harness:/app/memory $BACKUP_DIR/memory_$DATE 2>/dev/null || true
    
    # Backup ollama models (if exists)
    docker cp camodevops-ollama:/root/.ollama $BACKUP_DIR/ollama_$DATE 2>/dev/null || true
    
    echo "✅ Backup created: $BACKUP_DIR/*_$DATE"
    ;;
    
  *)
    echo "Usage: $0 [build|up|down|logs|restart|status|backup]"
    exit 1
    ;;
esac
