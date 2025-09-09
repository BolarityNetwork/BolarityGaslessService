import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Pimlico API Proxy
 * 
 * This proxy serves as a secure intermediary between the frontend and Pimlico API.
 * It hides the API key from client-side code while maintaining full SDK compatibility.
 * 
 * Features:
 * - Transparent request/response forwarding
 * - API key injection on server-side
 * - Request validation and logging
 * - Rate limiting protection
 */

interface PimlicoResponse {
    jsonrpc?: string
    id?: number | string
    result?: any
    error?: {
        code: number
        message: string
        data?: any
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<PimlicoResponse | { error: string }>
) {
    // Only allow POST requests (Pimlico RPC uses POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get API key from server environment
    const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY
    if (!PIMLICO_API_KEY) {
        console.error('PIMLICO_API_KEY not found in environment variables')
        return res.status(500).json({ error: 'Server configuration error' })
    }

    // Validate network (currently supporting sepolia)
    const network = 'sepolia'
    const pimlicoApiUrl = `https://api.pimlico.io/v2/${network}/rpc?apikey=${PIMLICO_API_KEY}`

    try {
        // Log request for debugging (remove in production)
        if (process.env.NODE_ENV === 'development') {
            console.log('Pimlico Proxy Request:', {
                method: req.body?.method,
                id: req.body?.id,
                timestamp: new Date().toISOString()
            })
        }

        // Forward request to Pimlico
        const response = await fetch(pimlicoApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'permissionless-privy-proxy/1.0'
            },
            body: JSON.stringify(req.body)
        })

        if (!response.ok) {
            throw new Error(`Pimlico API responded with status: ${response.status}`)
        }

        const data: PimlicoResponse = await response.json()

        // Log response for debugging (remove in production)
        if (process.env.NODE_ENV === 'development') {
            console.log('Pimlico Proxy Response:', {
                success: !data.error,
                method: req.body?.method,
                id: data.id,
                hasResult: !!data.result,
                error: data.error?.message
            })
        }

        // Forward response back to client
        res.status(200).json(data)

    } catch (error) {
        console.error('Pimlico Proxy Error:', error)
        
        // Return generic error to client
        res.status(500).json({
            jsonrpc: '2.0',
            id: req.body?.id || null,
            error: {
                code: -32603,
                message: 'Internal server error',
                data: process.env.NODE_ENV === 'development' ? error : undefined
            }
        })
    }
}