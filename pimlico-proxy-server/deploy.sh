#!/bin/bash

# Pimlico代理服务器一键部署脚本
# 适用于Ubuntu/CentOS云服务器

set -e  # 遇到错误立即停止

echo "🚀 开始部署Pimlico代理服务器..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        echo -e "${YELLOW}警告: 建议不要使用root用户运行，请创建普通用户${NC}"
        read -p "是否继续? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 安装Node.js
install_nodejs() {
    echo -e "${YELLOW}📦 安装Node.js...${NC}"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}Node.js已安装: $NODE_VERSION${NC}"
        
        # 检查版本是否>=18
        if node -e "process.exit(process.version.match(/^v(\d+)/)[1] >= 18 ? 0 : 1)" 2>/dev/null; then
            echo -e "${GREEN}Node.js版本符合要求(>=18)${NC}"
            return
        else
            echo -e "${RED}Node.js版本过低，需要>=18${NC}"
        fi
    fi
    
    # 安装Node.js 18 LTS
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    echo -e "${GREEN}✅ Node.js安装完成: $(node --version)${NC}"
}

# 安装PM2
install_pm2() {
    echo -e "${YELLOW}📦 安装PM2...${NC}"
    
    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}PM2已安装: $(pm2 --version)${NC}"
        return
    fi
    
    npm install -g pm2
    echo -e "${GREEN}✅ PM2安装完成${NC}"
}

# 创建项目目录
setup_project() {
    echo -e "${YELLOW}📁 设置项目目录...${NC}"
    
    PROJECT_DIR="$HOME/pimlico-proxy"
    
    if [ -d "$PROJECT_DIR" ]; then
        echo -e "${YELLOW}项目目录已存在，是否重新部署? (y/N):${NC}"
        read -p "" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$PROJECT_DIR"
        else
            echo -e "${RED}部署取消${NC}"
            exit 1
        fi
    fi
    
    mkdir -p "$PROJECT_DIR/logs"
    cd "$PROJECT_DIR"
    
    echo -e "${GREEN}✅ 项目目录创建完成: $PROJECT_DIR${NC}"
}

# 复制文件（这里需要用户手动上传文件到服务器）
setup_files() {
    echo -e "${YELLOW}📄 请将以下文件上传到服务器: $PROJECT_DIR${NC}"
    echo "  - server.js"
    echo "  - package.json" 
    echo "  - ecosystem.config.js"
    echo "  - .env (从.env.example复制并填入你的API KEY)"
    echo ""
    echo -e "${YELLOW}您可以使用以下方法上传:${NC}"
    echo "  scp -r ./pimlico-proxy-server/* user@your-server:$PROJECT_DIR/"
    echo "  或使用FTP/SFTP工具"
    echo ""
    read -p "文件上传完成后按Enter继续..."
}

# 安装依赖
install_dependencies() {
    echo -e "${YELLOW}📦 安装项目依赖...${NC}"
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json文件不存在${NC}"
        exit 1
    fi
    
    npm install --production
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 配置环境变量
setup_env() {
    echo -e "${YELLOW}⚙️  配置环境变量...${NC}"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${YELLOW}已复制.env.example到.env${NC}"
        else
            cat > .env << EOF
PIMLICO_API_KEY=your_pimlico_api_key_here
PORT=8080
NODE_ENV=production
ALLOWED_ORIGINS=*
RATE_LIMIT=1000
EOF
            echo -e "${YELLOW}已创建默认.env文件${NC}"
        fi
        
        echo -e "${RED}⚠️  请编辑.env文件，填入您的Pimlico API Key:${NC}"
        echo "  nano .env"
        read -p "编辑完成后按Enter继续..."
    fi
    
    echo -e "${GREEN}✅ 环境变量配置完成${NC}"
}

# 配置防火墙
setup_firewall() {
    echo -e "${YELLOW}🔥 配置防火墙...${NC}"
    
    if command -v ufw &> /dev/null; then
        sudo ufw allow 8080
        echo -e "${GREEN}✅ 防火墙规则添加完成 (端口8080)${NC}"
    else
        echo -e "${YELLOW}未检测到ufw，请手动开放8080端口${NC}"
    fi
}

# 启动服务
start_service() {
    echo -e "${YELLOW}🚀 启动服务...${NC}"
    
    # 停止可能存在的服务
    pm2 stop pimlico-proxy 2>/dev/null || true
    pm2 delete pimlico-proxy 2>/dev/null || true
    
    # 启动服务
    npm run pm2:start
    
    # 设置开机自启
    pm2 startup
    pm2 save
    
    echo -e "${GREEN}✅ 服务启动完成${NC}"
}

# 验证部署
verify_deployment() {
    echo -e "${YELLOW}🔍 验证部署...${NC}"
    
    sleep 3
    
    # 检查服务状态
    if pm2 list | grep -q "pimlico-proxy.*online"; then
        echo -e "${GREEN}✅ PM2服务运行正常${NC}"
    else
        echo -e "${RED}❌ PM2服务启动失败${NC}"
        pm2 logs pimlico-proxy --lines 10
        exit 1
    fi
    
    # 检查健康端点
    if curl -sf http://localhost:8080/health > /dev/null; then
        echo -e "${GREEN}✅ 健康检查通过${NC}"
    else
        echo -e "${RED}❌ 健康检查失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo ""
    echo -e "${YELLOW}服务信息:${NC}"
    echo "  🌐 健康检查: http://your-server-ip:8080/health"
    echo "  🔗 代理端点: http://your-server-ip:8080/pimlico-proxy"
    echo "  📊 监控: pm2 monit"
    echo "  📋 日志: pm2 logs pimlico-proxy"
    echo ""
    echo -e "${YELLOW}下一步:${NC}"
    echo "  1. 在你的前端应用中修改pimlicoUrl为: http://your-server-ip:8080/pimlico-proxy"
    echo "  2. 配置HTTPS反向代理 (推荐使用nginx)"
    echo "  3. 设置域名解析"
}

# 主函数
main() {
    echo "========================================"
    echo "     Pimlico代理服务器部署脚本"
    echo "========================================"
    echo ""
    
    check_root
    install_nodejs
    install_pm2
    setup_project
    setup_files
    install_dependencies
    setup_env
    setup_firewall
    start_service
    verify_deployment
    
    echo ""
    echo -e "${GREEN}🎉 部署成功完成！${NC}"
}

# 运行主函数
main "$@"