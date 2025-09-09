# Pimlico代理服务器 - 云服务器部署指南

## 🚀 一键部署到云服务器

### 准备工作
确保你的云服务器满足以下要求：
- **操作系统**: Ubuntu 20.04+ 或 CentOS 8+
- **内存**: 至少 1GB RAM
- **网络**: 公网IP，开放8080端口
- **权限**: sudo权限

### 快速部署步骤

#### 1. 上传文件到服务器
```bash
# 在本地机器上执行
scp -r ./pimlico-proxy-server/ user@your-server:~/
```

#### 2. 登录服务器并运行部署脚本
```bash
ssh user@your-server
cd ~/pimlico-proxy-server
./deploy.sh
```

#### 3. 配置API Key
部署过程中会提示编辑`.env`文件：
```bash
nano .env
```
填入你的Pimlico API Key：
```env
PIMLICO_API_KEY=pim_your_actual_api_key_here
PORT=8080
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.com
RATE_LIMIT=1000
```

### 验证部署

#### 健康检查
```bash
curl http://your-server-ip:8080/health
```
应该返回：
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T...",
  "version": "1.0.0",
  "uptime": 123
}
```

#### 测试代理功能
```bash
curl -X POST http://your-server-ip:8080/pimlico-proxy \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "pimlico_getUserOperationGasPrice",
    "params": [],
    "id": 1
  }'
```

### 前端配置

在你的前端应用中修改Pimlico URL：
```typescript
// 修改 UserOperation.tsx
const pimlicoUrl = 'http://your-server-ip:8080/pimlico-proxy'
// 或使用域名
const pimlicoUrl = 'https://proxy.your-domain.com/pimlico-proxy'
```

### 生产环境优化

#### 配置HTTPS (推荐)
```bash
# 安装nginx
sudo apt install nginx

# 配置反向代理
sudo nano /etc/nginx/sites-available/pimlico-proxy
```

nginx配置示例：
```nginx
server {
    listen 443 ssl;
    server_name proxy.your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 监控和维护

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs pimlico-proxy

# 重启服务
pm2 restart pimlico-proxy

# 查看详细监控
pm2 monit
```

### 常用命令

```bash
# 启动服务
npm run pm2:start

# 停止服务
npm run pm2:stop

# 重启服务
npm run pm2:restart

# 查看日志
npm run pm2:logs

# 更新代码后重启
git pull && npm install && pm2 restart pimlico-proxy
```

### 故障排除

#### 服务无法启动
```bash
# 检查日志
pm2 logs pimlico-proxy --lines 50

# 检查端口占用
netstat -tulpn | grep 8080

# 手动启动测试
node server.js
```

#### 无法访问服务
```bash
# 检查防火墙
sudo ufw status
sudo ufw allow 8080

# 检查服务状态
curl localhost:8080/health
```

#### API Key错误
```bash
# 检查环境变量
cat .env
pm2 restart pimlico-proxy
```

### 性能优化

#### PM2集群模式
服务器默认使用所有CPU核心运行多个进程实例，自动负载均衡。

#### 内存监控
```bash
# 设置内存限制，超过1GB自动重启
pm2 start ecosystem.config.js --max-memory-restart 1G
```

#### 日志轮转
```bash
# 安装PM2日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 安全建议

1. **API Key保护**: 确保`.env`文件权限为600
2. **防火墙配置**: 只开放必要端口
3. **HTTPS**: 生产环境必须使用HTTPS
4. **速率限制**: 根据需求调整`RATE_LIMIT`
5. **域名白名单**: 配置`ALLOWED_ORIGINS`

### 支持与维护

- 🔧 配置问题: 检查`.env`和`ecosystem.config.js`
- 📊 性能监控: 使用`pm2 monit`
- 📋 日志分析: 使用`pm2 logs`
- 🔄 自动重启: PM2已配置故障自动重启

部署完成后，你的Pimlico代理服务器将以高可用、高性能的方式运行！