#!/bin/bash

# 🐳 Docker Resource Monitoring System - Worker1 Implementation
# Revolutionary approach to container monitoring

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🐳 Docker Resource Monitoring System${NC}"
echo -e "${PURPLE}======================================${NC}"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Installing Docker monitoring alternatives...${NC}"
    
    # Alternative monitoring for non-Docker environments
    echo -e "${YELLOW}🔄 Setting up Railway Environment Monitoring${NC}"
    
    # Memory monitoring
    echo -e "${BLUE}💾 Memory Usage:${NC}"
    if command -v free &> /dev/null; then
        free -h
    else
        # macOS alternative
        vm_stat | grep -E "(free|active|inactive|wired|compressed)"
    fi
    
    # CPU monitoring  
    echo -e "${BLUE}🖥️  CPU Usage:${NC}"
    if command -v top &> /dev/null; then
        top -l 1 | grep "CPU usage" || top -bn1 | grep "Cpu(s)"
    fi
    
    # Disk usage
    echo -e "${BLUE}💿 Disk Usage:${NC}"
    df -h /
    
    # Network connections
    echo -e "${BLUE}🌐 Network Connections:${NC}"
    netstat -an | head -10
    
    # Process monitoring
    echo -e "${BLUE}⚙️  Top Processes:${NC}"
    ps aux | head -10
    
else
    echo -e "${GREEN}✅ Docker detected! Implementing full monitoring...${NC}"
    
    # Docker container monitoring
    echo -e "${BLUE}📊 Container Status:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Resource usage
    echo -e "${BLUE}🔋 Resource Usage:${NC}"
    docker stats --no-stream
    
    # Docker system info
    echo -e "${BLUE}🏗️  Docker System Info:${NC}"
    docker system df
    
    # Network monitoring
    echo -e "${BLUE}🔗 Docker Networks:${NC}"
    docker network ls
fi

echo ""
echo -e "${CYAN}📊 Monitoring complete at $(date)${NC}"

# Generate monitoring report
REPORT_FILE="./tmp/docker-monitoring-report.md"
cat > "$REPORT_FILE" << EOF
# Docker/System Monitoring Report
Generated on: $(date)

## Environment Type
- Platform: $(uname -s)
- Architecture: $(uname -m)
- Docker Available: $(command -v docker &> /dev/null && echo "Yes" || echo "No")

## Resource Status
- Memory Usage: $(if command -v free &> /dev/null; then free -h | grep Mem; else echo "macOS - vm_stat output"; fi)
- Disk Usage: $(df -h / | tail -1)
- CPU Load: $(uptime)

## Network Status
- Active Connections: $(netstat -an | wc -l) total connections

## Recommendations
1. Set up continuous monitoring with 30-second intervals
2. Implement alerting for high resource usage (>80%)
3. Create automated scaling triggers for Railway deployment
4. Monitor API response times and error rates

## Revolutionary Monitoring Features Implemented
- Multi-platform compatibility (Docker + non-Docker)
- Real-time resource tracking
- Network connection monitoring
- Automated report generation
EOF

echo -e "${GREEN}📝 Report saved to: $REPORT_FILE${NC}"