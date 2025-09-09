#!/usr/bin/env node

/**
 * 独立Pimlico代理服务器
 * 专为云服务器部署优化
 */

const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 8080

// 安全中间件
app.use(helmet())

// CORS配置
app.use(cors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type',
'Authorization']
}))

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: process.env.RATE_LIMIT || 1000, // 每IP最多1000次请求
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
})
app.use('/pimlico-proxy', limiter)

// JSON解析
app.use(express.json({ limit: '1mb' }))

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
    })
})

// 主代理端点
app.post('/pimlico-proxy', async (req, res) => {
    const startTime = Date.now()
    
    try {
        // 验证API Key
        const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY
        if (!PIMLICO_API_KEY) {
            console.error('[ERROR] PIMLICO_API_KEY not configured')
            return res.status(500).json({ 
                jsonrpc: '2.0',
                id: req.body?.id || null,
                error: { code: -32603, message: 'Server configuration error' }
            })
        }

        // 网络配置
        const network = req.query.network || 'sepolia'
        const pimlicoApiUrl = `https://api.pimlico.io/v2/${network}/rpc?apikey=${PIMLICO_API_KEY}`

        // 请求日志
        console.log(`[${new Date().toISOString()}] ${req.body?.method || 'unknown'} - ${req.ip}`)

        // 动态导入node-fetch (支持Node.js 18+)
        const fetch = (await import('node-fetch')).default

        // 转发请求到Pimlico
        const response = await fetch(pimlicoApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'pimlico-proxy-server/1.0'
            },
            body: JSON.stringify(req.body)
        })

        if (!response.ok) {
            throw new Error(`Pimlico API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const duration = Date.now() - startTime

        // 响应日志
        console.log(`[${new Date().toISOString()}] Response: ${response.status} (${duration}ms)`)

        res.json(data)

    } catch (error) {
        const duration = Date.now() - startTime
        console.error(`[ERROR] ${error.message} (${duration}ms)`)
        
        res.status(500).json({
            jsonrpc: '2.0',
            id: req.body?.id || null,
            error: {
                code: -32603,
                message: 'Proxy server error',
                data: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        })
    }
})

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' })
})

// 错误处理
app.use((error, req, res, next) => {
    console.error('[GLOBAL ERROR]', error)
    res.status(500).json({ error: 'Internal server error' })
})

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Pimlico Proxy Server Started!
📡 Port: ${PORT}
🌐 Health: http://localhost:${PORT}/health
🔗 Proxy: http://localhost:${PORT}/pimlico-proxy
📊 Environment: ${process.env.NODE_ENV || 'development'}
⏰ Started at: ${new Date().toISOString()}
    `)
})

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...')
    server.close(() => {
        console.log('✅ Server closed successfully')
        process.exit(0)
    })
})

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...')
    server.close(() => {
        console.log('✅ Server closed successfully')
        process.exit(0)
    })
})