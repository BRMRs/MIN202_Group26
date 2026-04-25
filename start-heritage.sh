#!/bin/bash

# ===============================================
# Heritage Platform 启动脚本
# ===============================================
# 功能：
#   1. 检查/初始化数据库（首次创建，后续保留数据）
#   2. 清理占用端口 (8080: 后端, 5173: 前端)
#   3. 启动后端 (Spring Boot)
#   4. 启动前端 (React + Vite)
# ===============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Heritage Platform 启动脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# ------------------------------------------------------
# 1. 数据库初始化（安全模式：不删除现有数据）
# ------------------------------------------------------
echo -e "${YELLOW}[1/4] 检查数据库...${NC}"
cd /Users/rui/MIN202_Group26

# 检查数据库是否存在
DB_EXISTS=$(mysql -u root -p'Heritage@2026' -e "SHOW DATABASES LIKE 'heritage_db';" 2>/dev/null | grep -c "heritage_db" || true)

if [ "$DB_EXISTS" -eq 0 ]; then
    echo "  - 数据库不存在，执行完整初始化..."
    mysql -u root -p'Heritage@2026' < database/init.sql 2>/dev/null
    mysql -u root -p'Heritage@2026' heritage_db < database/seed_china_cities.sql 2>/dev/null
    echo -e "  ${GREEN}✓ 数据库初始化完成${NC}"
else
    echo "  - 数据库已存在，执行安全更新（保留现有数据）..."
    mysql -u root -p'Heritage@2026' < database/init-safe.sql 2>/dev/null
    echo -e "  ${GREEN}✓ 数据库检查完成${NC}"
fi

# ------------------------------------------------------
# 2. 清理占用端口
# ------------------------------------------------------
echo -e "${YELLOW}[2/4] 清理占用端口...${NC}"

# 清理 8080 (后端)
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  - 杀掉占用 8080 的进程..."
    lsof -ti :8080 | xargs kill -9 2>/dev/null || true
fi

# 清理 5173 (前端)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  - 杀掉占用 5173 的进程..."
    lsof -ti :5173 | xargs kill -9 2>/dev/null || true
fi

# 也清理可能的 maven/java 进程
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "heritage" 2>/dev/null || true

echo -e "  ${GREEN}端口清理完成${NC}"

# ------------------------------------------------------
# 3. 启动后端
# ------------------------------------------------------
echo -e "${YELLOW}[3/4] 启动后端 (Spring Boot)...${NC}"

cd /Users/rui/MIN202_Group26/backend

# 确保 mvnw 可执行
chmod +x mvnw

# 后台启动后端
./mvnw spring-boot:run > /tmp/heritage-backend.log 2>&1 &
BACKEND_PID=$!

echo "  - 后端 PID: $BACKEND_PID"
echo "  - 日志: /tmp/heritage-backend.log"

# 等待后端启动完成
echo -e "  ${YELLOW}等待后端启动...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ 后端启动成功 (http://localhost:8080)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "  ${RED}✗ 后端启动超时，请查看日志: /tmp/heritage-backend.log${NC}"
        exit 1
    fi
    sleep 2
done

# ------------------------------------------------------
# 4. 启动前端
# ------------------------------------------------------
echo -e "${YELLOW}[4/4] 启动前端 (React + Vite)...${NC}"

cd /Users/rui/MIN202_Group26/frontend

# 首次运行安装依赖
if [ ! -d "node_modules" ]; then
    echo "  - 首次运行，安装依赖..."
    npm install
fi

# 前台启动前端
npm run dev &
FRONTEND_PID=$!

echo "  - 前端 PID: $FRONTEND_PID"

# 等待前端启动
echo -e "  ${YELLOW}等待前端启动...${NC}"
for i in {1..15}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ 前端启动成功 (http://localhost:5173)${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "  ${RED}✗ 前端启动超时${NC}"
        exit 1
    fi
    sleep 1
done

# ------------------------------------------------------
# 完成
# ------------------------------------------------------
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} Heritage Platform 启动完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  前端: ${GREEN}http://localhost:5173${NC}"
echo -e "  后端: ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "停止命令: pkill -f 'spring-boot:run' && pkill -f 'vite'${NC}"
echo ""