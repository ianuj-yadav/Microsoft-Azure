// ============================================================================
// VisionPulse · Azure AI Vision Lightweight Backend Proxy
// Phase 1: Secure Cloud Infrastructure & Credentials Management
// ============================================================================
// Best Practice: This Node.js/Express backend handles API requests to Azure
// Cognitive Services securely without exposing your API keys in the browser!

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Azure AI Vision Configuration
const AZURE_ENDPOINT = process.env.AZURE_VISION_ENDPOINT || 'https://anuj-yadav1.cognitiveservices.azure.com/';
const AZURE_KEY = process.env.AZURE_VISION_KEY || '';

// Middleware setup
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '20mb' }));
app.use(express.static(path.join(__dirname)));

// ── Health & Config Endpoint ─────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        mode: 'secure-backend',
        endpoint: AZURE_ENDPOINT ? AZURE_ENDPOINT.replace(/\/+$/, '') : 'Not configured',
        hasKey: Boolean(AZURE_KEY && AZURE_KEY.length > 5),
        timestamp: new Date().toISOString()
    });
});

// ── Secure Azure Vision Analysis Proxy Endpoint ──────────────────────────────
app.post('/api/analyze', async (req, res) => {
    if (!AZURE_KEY) {
        return res.status(500).json({
            error: "Azure API Key is missing on the server. Please check your .env file."
        });
    }

    try {
        const cleanEndpoint = AZURE_ENDPOINT.replace(/\/+$/, '');
        // We request tags, description, objects, faces, color, and categories
        const apiUrl = `${cleanEndpoint}/vision/v3.2/analyze?visualFeatures=Categories,Tags,Description,Faces,ImageType,Color,Objects`;

        let fetchOptions = {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_KEY
            }
        };

        // Check if incoming request is JSON with an image URL or base64 data URL
        if (req.is('application/json') && req.body) {
            if (req.body.url) {
                // Analyze by Image URL
                fetchOptions.headers['Content-Type'] = 'application/json';
                fetchOptions.body = JSON.stringify({ url: req.body.url });
            } else if (req.body.image || req.body.base64) {
                // Analyze by Base64 Data URL converted to binary buffer
                const base64Str = req.body.image || req.body.base64;
                const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                
                fetchOptions.headers['Content-Type'] = 'application/octet-stream';
                fetchOptions.body = buffer;
            }
        } else if (req.is('application/octet-stream') || Buffer.isBuffer(req.body)) {
            // Direct binary upload
            fetchOptions.headers['Content-Type'] = 'application/octet-stream';
            fetchOptions.body = req.body;
        } else {
            return res.status(400).json({ error: "Unsupported payload format. Please send an image URL or binary image data." });
        }

        console.log(`[Azure AI Vision] Forwarding request to: ${apiUrl.split('?')[0]}...`);
        const startTime = Date.now();
        
        // Dynamic import for node-fetch if in older node or use native fetch
        const fetchFn = typeof fetch === 'function' ? fetch : (...args) => import('node-fetch').then(({default: f}) => f(...args));
        const azureResponse = await fetchFn(apiUrl, fetchOptions);
        
        const data = await azureResponse.json();
        const latency = Date.now() - startTime;

        if (!azureResponse.ok) {
            console.error(`[Azure Error] ${azureResponse.status}:`, data);
            return res.status(azureResponse.status).json({
                error: data.error ? data.error.message : "Azure AI Vision API request failed",
                details: data
            });
        }

        console.log(`[Azure Success] Analysis completed in ${latency}ms`);
        res.json({
            success: true,
            latencyMs: latency,
            data: data
        });

    } catch (err) {
        console.error("[Proxy Server Error]:", err);
        res.status(500).json({
            error: "Internal server error during Azure communication",
            message: err.message
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 VisionPulse · Azure AI Vision Studio Backend Online`);
    console.log(`📡 Local Server URL : http://localhost:${PORT}`);
    console.log(`🔒 Azure Endpoint   : ${AZURE_ENDPOINT}`);
    console.log(`🔑 Secure Key Status: ${AZURE_KEY ? 'Configured ✅' : 'Missing ❌'}`);
    console.log(`======================================================\n`);
});
