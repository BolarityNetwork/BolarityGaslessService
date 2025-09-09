#!/usr/bin/env node

/**
 * Standalone Pimlico Proxy Server
 * 
 * Independent Express server that can be deployed separately from the main app.
 * Handles CORS, request validation, and transparent proxying to Pimlico API.
 */

const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
require('dotenv').config()

const app = express()
const PORT = process.env.PROXY_PORT || 8080

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}))
app.use(express.json({ limit: '1mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    })
})

// Main proxy endpoint
app.post('/pimlico-proxy', async (req, res) => {
    const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY
    
    if (!PIMLICO_API_KEY) {
        console.error('PIMLICO_API_KEY not found in environment')
        return res.status(500).json({ error: 'Server configuration error' })
    }

    const network = req.query.network || 'sepolia'
    const pimlicoApiUrl = `https://api.pimlico.io/v2/${network}/rpc?apikey=${PIMLICO_API_KEY}`

    try {
        // Request logging
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${new Date().toISOString()}] ${req.body?.method || 'unknown'} - ${req.ip}`)
        }

        // Forward to Pimlico
        const response = await fetch(pimlicoApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'pimlico-proxy/1.0'
            },
            body: JSON.stringify(req.body)
        })

        if (!response.ok) {
            throw new Error(`Pimlico API error: ${response.status}`)
        }

        const data = await response.json()
        res.json(data)

    } catch (error) {
        console.error('Proxy error:', error.message)
        res.status(500).json({
            jsonrpc: '2.0',
            id: req.body?.id || null,
            error: {
                code: -32603,
                message: 'Proxy server error'
            }
        })
    }
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Pimlico Proxy running on port ${PORT}`)
    console.log(`📡 Health check: http://localhost:${PORT}/health`)
    console.log(`🔗 Proxy endpoint: http://localhost:${PORT}/pimlico-proxy`)
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🔧 Development mode - detailed logging enabled`)
    }
})

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully')
    process.exit(0)
})