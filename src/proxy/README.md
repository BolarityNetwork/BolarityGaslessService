# Pimlico Proxy Service

## 概述

这个代理服务为前端和 Pimlico API 之间提供安全的中介层，隐藏 API key 的同时保持完整的 SDK 兼容性。

## 架构

```
前端 SDK → /api/pimlico-proxy → Pimlico API
```

## 安全特性

✅ **API Key 保护**: API key 仅存在于服务器环境变量中  
✅ **透明代理**: 前端 SDK 无需修改，完全兼容  
✅ **请求验证**: 服务器端验证和过滤请求  
✅ **错误处理**: 统一的错误处理和日志记录  

## 文件结构

```
src/
├── pages/api/
│   └── pimlico-proxy.ts     # 主要代理 API 路由
├── proxy/
│   └── README.md           # 本文档
└── components/
    └── UserOperation.tsx   # 修改后的前端代码
```

## 环境变量

```bash
# Server-side only (secure)
PIMLICO_API_KEY=pim_your_actual_api_key

# Client-side accessible
NEXT_PUBLIC_SPONSORSHIP_POLICY_ID=sp_your_policy_id
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://1rpc.io/sepolia
```

## 使用方法

### 前端调用
```typescript
// 原来 (不安全)
const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${API_KEY}`

// 现在 (安全)
const pimlicoUrl = '/api/pimlico-proxy'

// SDK 使用完全不变
const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl)
})
```

### 支持的操作
- ✅ 创建 Pimlico 客户端
- ✅ 获取 gas 价格
- ✅ 发送 UserOperation
- ✅ Paymaster 赞助
- ✅ 所有 ERC-4337 操作

## 开发模式

开发环境下会输出详细日志：
```
Pimlico Proxy Request: {
  method: "pimlico_getUserOperationGasPrice",
  id: 1,
  timestamp: "2025-01-09T..."
}
```

## 生产环境

生产环境建议：
1. 移除开发日志
2. 添加速率限制
3. 增加更严格的验证
4. 启用请求缓存

## 故障排除

### 常见问题

**Q: 代理返回 500 错误**  
A: 检查 `PIMLICO_API_KEY` 环境变量是否正确设置

**Q: SDK 连接失败**  
A: 确保使用 `/api/pimlico-proxy` 而不是直接的 Pimlico URL

**Q: 本地开发无法访问**  
A: 确保 Next.js 开发服务器正在运行 (`pnpm dev`)

### 日志查看
```bash
# 查看 Next.js 控制台输出
pnpm dev

# 或查看 Vercel 部署日志
vercel logs
```