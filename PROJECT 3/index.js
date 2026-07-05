// ============================================================================
// VisionPulse · Azure AI Computer Vision Studio (Project 3)
// Phase 1: Secure Cloud Infrastructure & Phase 2: Drag-and-Drop Frontend
// ============================================================================

// State Management
let state = {
    apiMode: 'proxy', // 'proxy' (localhost:3000), 'direct' (browser REST), or 'demo'
    selectedFile: null,
    selectedDataUrl: null,
    selectedSampleUrl: null,
    lastResponse: null
};

// Azure Configuration Defaults (from Phase 1 credentials)
let AZURE_CONFIG = {
    endpoint: "https://anuj-yadav1.cognitiveservices.azure.com/",
    apiKey: "", // Left blank for security! The backend proxy (server.js) uses your .env file automatically.
    apiVersion: "v3.2"
};

// Curated Sample Images for Instant UI Testing
const SAMPLE_IMAGES = {
    city: {
        title: "Cyberpunk Cityscape",
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
        demoResponse: {
            description: { captions: [{ text: "A futuristic city street at dusk illuminated by glowing neon lights and traffic.", confidence: 0.984 }] },
            tags: [
                { name: "city", confidence: 0.99 }, { name: "street", confidence: 0.97 }, { name: "night", confidence: 0.95 },
                { name: "building", confidence: 0.94 }, { name: "neon", confidence: 0.91 }, { name: "traffic", confidence: 0.88 },
                { name: "light", confidence: 0.86 }, { name: "downtown", confidence: 0.84 }, { name: "architecture", confidence: 0.81 }
            ],
            color: { dominantColorForeground: "Black", dominantColorBackground: "Blue", accentColor: "0078D4", isBwImg: false },
            objects: [
                { object: "car", confidence: 0.91, rectangle: { x: 120, y: 240, w: 180, h: 100 } },
                { object: "building", confidence: 0.94, rectangle: { x: 20, y: 10, w: 300, h: 220 } }
            ]
        }
    },
    dog: {
        title: "Golden Retriever Dog",
        url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80",
        demoResponse: {
            description: { captions: [{ text: "A happy golden retriever dog sitting outdoors looking directly at the camera.", confidence: 0.992 }] },
            tags: [
                { name: "dog", confidence: 0.99 }, { name: "mammal", confidence: 0.98 }, { name: "animal", confidence: 0.98 },
                { name: "golden retriever", confidence: 0.96 }, { name: "pet", confidence: 0.95 }, { name: "outdoor", confidence: 0.92 },
                { name: "cute", confidence: 0.89 }, { name: "canine", confidence: 0.87 }
            ],
            color: { dominantColorForeground: "Brown", dominantColorBackground: "Green", accentColor: "F59E0B", isBwImg: false },
            objects: [
                { object: "dog", confidence: 0.97, rectangle: { x: 150, y: 50, w: 380, h: 420 } }
            ]
        }
    },
    nature: {
        title: "Mountain Sunset",
        url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
        demoResponse: {
            description: { captions: [{ text: "A majestic mountain landscape with fog over pine trees during a colorful sunset.", confidence: 0.976 }] },
            tags: [
                { name: "nature", confidence: 0.99 }, { name: "mountain", confidence: 0.98 }, { name: "landscape", confidence: 0.97 },
                { name: "sky", confidence: 0.95 }, { name: "sunset", confidence: 0.94 }, { name: "forest", confidence: 0.91 },
                { name: "tree", confidence: 0.89 }, { name: "cloud", confidence: 0.85 }
            ],
            color: { dominantColorForeground: "Green", dominantColorBackground: "Orange", accentColor: "EC4899", isBwImg: false },
            objects: []
        }
    },
    workspace: {
        title: "Tech Workspace Setup",
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
        demoResponse: {
            description: { captions: [{ text: "A clean developer desk setup featuring a laptop, keyboard, smartphone, and coffee cup.", confidence: 0.965 }] },
            tags: [
                { name: "laptop", confidence: 0.99 }, { name: "computer", confidence: 0.98 }, { name: "technology", confidence: 0.97 },
                { name: "desk", confidence: 0.95 }, { name: "workspace", confidence: 0.93 }, { name: "office", confidence: 0.90 },
                { name: "keyboard", confidence: 0.88 }, { name: "gadget", confidence: 0.84 }
            ],
            color: { dominantColorForeground: "Grey", dominantColorBackground: "White", accentColor: "38BDF8", isBwImg: false },
            objects: [
                { object: "laptop", confidence: 0.96, rectangle: { x: 100, y: 80, w: 450, h: 300 } },
                { object: "keyboard", confidence: 0.89, rectangle: { x: 180, y: 280, w: 300, h: 100 } }
            ]
        }
    }
};

// ============================================================================
// Initialization & Backend Proxy Detection
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    setupPhase2DragAndDrop();
    
    // Check if our lightweight Node.js server (server.js) is running on port 3000
    await detectBackendProxy();
    
    // Populate settings drawer with initial credentials
    document.getElementById('azureEndpointInput').value = AZURE_CONFIG.endpoint;
    document.getElementById('azureKeyInput').value = AZURE_CONFIG.apiKey;
    
    updateStatusPill();
});

async function detectBackendProxy() {
    try {
        const res = await fetch('/api/status');
        if (res.ok) {
            const data = await res.json();
            console.log("🔒 Lightweight Node.js proxy backend detected:", data);
            state.apiMode = 'proxy';
            document.getElementById('modeProxy').checked = true;
            if (data.endpoint && data.endpoint !== 'Not configured') {
                AZURE_CONFIG.endpoint = data.endpoint;
            }
        }
    } catch (e) {
        console.warn("⚠️ Lightweight proxy not running on port 3000 or running via Live Server. Switching default to Direct Azure REST API mode.");
        state.apiMode = 'direct';
        document.getElementById('modeDirect').checked = true;
    }
}

// ============================================================================
// Phase 2: Drag-and-Drop Logic & FileReader API
// ============================================================================
function setupPhase2DragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    
    // 1. Prevent default browser behavior (which is to open the image) using e.preventDefault()
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 2. Add event listeners to the drop zone for dragover, dragleave, and drop
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    // 3. Extract the file from the event using e.dataTransfer.files[0]
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) {
            handleFileSelection(file);
        }
    }, false);

    // 4. Fallback file selection via input element
    dropZone.addEventListener('click', (e) => {
        if (e.target !== browseBtn) {
            fileInput.click();
        }
    });

    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelection(file);
        }
    });

    // Remove image button
    document.getElementById('removeImgBtn').addEventListener('click', resetImageInput);
}

// 5. Use the FileReader API to display a preview of the image before submitting to Azure
function handleFileSelection(file) {
    if (!file.type.startsWith('image/')) {
        alert("⚠️ Please select a valid image file (PNG, JPEG, WEBP, or BMP).");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert("⚠️ File size exceeds 10MB limit for Azure Computer Vision.");
        return;
    }

    state.selectedFile = file;
    state.selectedSampleUrl = null;

    // Use FileReader API
    const reader = new FileReader();
    reader.onload = (event) => {
        state.selectedDataUrl = event.target.result;
        displayImagePreview(state.selectedDataUrl, `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.readAsDataURL(file);
}

function displayImagePreview(imageSrc, badgeText) {
    const dropZone = document.getElementById('dropZone');
    const previewContainer = document.getElementById('previewContainer');
    const previewImg = document.getElementById('previewImage');
    const fileBadge = document.getElementById('fileInfoBadge');
    const analyzeBtn = document.getElementById('analyzeBtn');

    previewImg.src = imageSrc;
    fileBadge.textContent = badgeText;
    
    // Show preview, hide drop zone
    dropZone.style.display = 'none';
    previewContainer.classList.add('active');
    analyzeBtn.disabled = false;

    // Clear previous bounding box canvas overlay
    const canvas = document.getElementById('boundingOverlay');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function resetImageInput() {
    state.selectedFile = null;
    state.selectedDataUrl = null;
    state.selectedSampleUrl = null;

    document.getElementById('dropZone').style.display = 'flex';
    document.getElementById('previewContainer').classList.remove('active');
    document.getElementById('previewImage').src = "";
    document.getElementById('fileInput').value = "";
    document.getElementById('analyzeBtn').disabled = true;

    // Clear analytics dashboard
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('latencyBadge').style.display = 'none';
}

// ============================================================================
// Event Listeners & Sample Chips
// ============================================================================
function setupEventListeners() {
    // Config Drawer Toggle
    document.getElementById('configToggleBtn').addEventListener('click', () => {
        const panel = document.getElementById('configPanel');
        panel.classList.toggle('active');
        const icon = document.getElementById('configIcon');
        icon.textContent = panel.classList.contains('active') ? '▲' : '▼';
    });

    // Save Config Button
    document.getElementById('saveConfigBtn').addEventListener('click', () => {
        const endpoint = document.getElementById('azureEndpointInput').value.trim();
        const key = document.getElementById('azureKeyInput').value.trim();
        const mode = document.querySelector('input[name="apiMode"]:checked').value;

        if (endpoint) AZURE_CONFIG.endpoint = endpoint;
        if (key) AZURE_CONFIG.apiKey = key;
        state.apiMode = mode;

        updateStatusPill();
        document.getElementById('configPanel').classList.remove('active');
        document.getElementById('configIcon').textContent = '▼';
        alert(`✅ Azure AI Vision Configuration Saved!\nMode: ${mode.toUpperCase()}`);
    });

    // Mode Radio Buttons
    document.querySelectorAll('input[name="apiMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.apiMode = e.target.value;
            updateStatusPill();
        });
    });

    // Sample Image Chips
    document.querySelectorAll('.sample-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const sampleKey = chip.getAttribute('data-sample');
            const sample = SAMPLE_IMAGES[sampleKey];
            if (sample) {
                state.selectedFile = null;
                state.selectedDataUrl = null;
                state.selectedSampleUrl = sample.url;
                
                displayImagePreview(sample.url, `⚡ Sample: ${sample.title}`);
                
                // If in demo mode, auto analyze or just let user click analyze
                if (state.apiMode === 'demo') {
                    runVisionAnalysis(sampleKey);
                }
            }
        });
    });

    // Analyze Button
    document.getElementById('analyzeBtn').addEventListener('click', () => {
        runVisionAnalysis();
    });

    // Telemetry JSON Toggle
    document.getElementById('telemetryToggle').addEventListener('click', () => {
        const body = document.getElementById('telemetryBody');
        body.classList.toggle('open');
        document.getElementById('telemetryIcon').textContent = body.classList.contains('open') ? '▲' : '▼';
    });

    // Redraw canvas boxes on window resize if an image is loaded
    window.addEventListener('resize', () => {
        if (state.lastResponse && state.lastResponse.objects) {
            drawBoundingBoxes(state.lastResponse.objects);
        }
    });
}

function updateStatusPill() {
    const pill = document.getElementById('statusPill');
    const text = document.getElementById('pillText');

    if (state.apiMode === 'proxy') {
        text.textContent = "SECURE BACKEND PROXY · V3.2";
        pill.style.borderColor = "rgba(56, 189, 248, 0.4)";
        pill.style.color = "#38bdf8";
    } else if (state.apiMode === 'direct') {
        text.textContent = "DIRECT AZURE REST API · V3.2";
        pill.style.borderColor = "rgba(16, 185, 129, 0.4)";
        pill.style.color = "#34d399";
    } else {
        text.textContent = "OFFLINE DEMO MODE · SIMULATED";
        pill.style.borderColor = "rgba(139, 92, 246, 0.4)";
        pill.style.color = "#a78bfa";
    }
}

// ============================================================================
// Azure AI Computer Vision API Client (Dual Mode + Demo)
// ============================================================================
async function runVisionAnalysis(sampleKeyOverride = null) {
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    const dashboardContent = document.getElementById('dashboardContent');
    const latencyBadge = document.getElementById('latencyBadge');

    emptyState.style.display = 'none';
    dashboardContent.style.display = 'none';
    loadingState.style.display = 'flex';
    latencyBadge.style.display = 'none';

    const startTime = Date.now();

    try {
        let resultData = null;

        // 1. Offline Demo Mode
        if (state.apiMode === 'demo' || sampleKeyOverride) {
            await new Promise(r => setTimeout(r, 650)); // Simulate realistic network latency
            const sampleKey = sampleKeyOverride || (state.selectedSampleUrl ? Object.keys(SAMPLE_IMAGES).find(k => SAMPLE_IMAGES[k].url === state.selectedSampleUrl) : 'city');
            resultData = SAMPLE_IMAGES[sampleKey || 'city'].demoResponse;
        }
        // 2. Secure Backend Proxy Mode (http://localhost:3000/api/analyze)
        else if (state.apiMode === 'proxy') {
            let payload = {};
            if (state.selectedSampleUrl) {
                payload = { url: state.selectedSampleUrl };
            } else if (state.selectedDataUrl) {
                payload = { base64: state.selectedDataUrl };
            }

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resJson = await response.json();
            if (!response.ok || !resJson.success) {
                throw new Error(resJson.error || "Backend proxy analysis failed");
            }
            resultData = resJson.data;
        }
        // 3. Direct Browser REST API Mode
        else {
            const cleanEndpoint = AZURE_CONFIG.endpoint.replace(/\/+$/, '');
            const apiUrl = `${cleanEndpoint}/vision/v3.2/analyze?visualFeatures=Categories,Tags,Description,Faces,ImageType,Color,Objects`;

            let fetchOptions = {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': AZURE_CONFIG.apiKey
                }
            };

            if (state.selectedSampleUrl) {
                fetchOptions.headers['Content-Type'] = 'application/json';
                fetchOptions.body = JSON.stringify({ url: state.selectedSampleUrl });
            } else if (state.selectedFile) {
                // Convert file to binary buffer for direct REST upload
                fetchOptions.headers['Content-Type'] = 'application/octet-stream';
                fetchOptions.body = state.selectedFile;
            } else {
                throw new Error("No image selected for analysis.");
            }

            const response = await fetch(apiUrl, fetchOptions);
            resultData = await response.json();

            if (!response.ok) {
                throw new Error(resultData.error ? resultData.error.message : `Azure API HTTP Error ${response.status}`);
            }
        }

        const latency = Date.now() - startTime;
        state.lastResponse = resultData;
        
        renderDashboard(resultData, latency);

    } catch (err) {
        console.error("[Vision Analysis Error]:", err);
        loadingState.style.display = 'none';
        emptyState.style.display = 'flex';
        alert(`❌ Azure AI Vision Error: ${err.message}\n\nTip: Make sure your API Key and Endpoint in the Settings drawer are correct, or try Demo Mode!`);
    }
}

// ============================================================================
// Render UI Dashboard & Bounding Box Overlay
// ============================================================================
function renderDashboard(data, latencyMs) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'flex';

    // Latency Badge
    const latencyBadge = document.getElementById('latencyBadge');
    latencyBadge.textContent = `⏱️ ${latencyMs} ms`;
    latencyBadge.style.display = 'inline-block';

    // 1. Caption / Description
    const captionText = document.getElementById('captionText');
    const captionConf = document.getElementById('captionConfidence');
    
    if (data.description && data.description.captions && data.description.captions.length > 0) {
        const topCaption = data.description.captions[0];
        captionText.textContent = `"${topCaption.text.charAt(0).toUpperCase() + topCaption.text.slice(1)}"`;
        captionConf.textContent = `${(topCaption.confidence * 100).toFixed(1)}% CONFIDENCE`;
    } else {
        captionText.textContent = "No descriptive caption could be synthesized for this image.";
        captionConf.textContent = "N/A";
    }

    // 2. Tags Cloud
    const tagsContainer = document.getElementById('tagsContainer');
    const tagCount = document.getElementById('tagCountBadge');
    tagsContainer.innerHTML = "";
    
    if (data.tags && data.tags.length > 0) {
        tagCount.textContent = `${data.tags.length} detected`;
        data.tags.forEach(tag => {
            const pill = document.createElement('div');
            pill.className = 'tag-pill';
            pill.innerHTML = `
                <span>${tag.name}</span>
                <span class="tag-score">${(tag.confidence * 100).toFixed(0)}%</span>
            `;
            tagsContainer.appendChild(pill);
        });
    } else {
        tagCount.textContent = "0 detected";
        tagsContainer.innerHTML = `<span style="color:var(--text-dim)">No specific visual tags recognized.</span>`;
    }

    // 3. Detected Objects & Bounding Boxes
    const objectsContainer = document.getElementById('objectsContainer');
    objectsContainer.innerHTML = "";
    
    if (data.objects && data.objects.length > 0) {
        data.objects.forEach((obj, idx) => {
            const card = document.createElement('div');
            card.className = 'object-card';
            card.innerHTML = `
                <span style="font-weight:600; color:var(--text-main); text-transform:capitalize;">📦 #${idx+1} ${obj.object}</span>
                <span style="font-family:'JetBrains Mono', monospace; font-size:0.8rem; color:#34d399;">${(obj.confidence * 100).toFixed(1)}%</span>
            `;
            objectsContainer.appendChild(card);
        });
        
        // Draw bounding boxes on canvas
        drawBoundingBoxes(data.objects);
    } else {
        objectsContainer.innerHTML = `<div style="grid-column: span 2; color:var(--text-dim); font-size:0.9rem;">No distinct foreground bounding boxes identified.</div>`;
        clearBoundingBoxes();
    }

    // 4. Color Analysis Swatches
    const colorsContainer = document.getElementById('colorsContainer');
    const bwBadge = document.getElementById('isBwBadge');
    colorsContainer.innerHTML = "";

    if (data.color) {
        bwBadge.textContent = data.color.isBwImg ? "⚫ Black & White Image" : "🌈 Vibrant Color Image";
        
        const colorItems = [
            { label: "Foreground", name: data.color.dominantColorForeground || "Grey", hex: mapColorNameToHex(data.color.dominantColorForeground) },
            { label: "Background", name: data.color.dominantColorBackground || "Grey", hex: mapColorNameToHex(data.color.dominantColorBackground) },
            { label: "Accent Color", name: `#${data.color.accentColor || '0078D4'}`, hex: `#${data.color.accentColor || '0078D4'}` }
        ];

        colorItems.forEach(item => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch-card';
            swatch.innerHTML = `
                <div class="color-circle" style="background-color: ${item.hex};"></div>
                <span class="color-name">${item.label}</span>
                <span class="color-hex">${item.name}</span>
            `;
            colorsContainer.appendChild(swatch);
        });
    }

    // 5. Raw Telemetry JSON
    document.getElementById('jsonViewer').textContent = JSON.stringify(data, null, 2);
}

function mapColorNameToHex(colorName) {
    if (!colorName) return "#808080";
    const map = {
        "Black": "#0a0a0a", "Blue": "#2563eb", "Brown": "#92400e", "Grey": "#64748b",
        "Green": "#10b981", "Orange": "#f97316", "Pink": "#ec4899", "Purple": "#8b5cf6",
        "Red": "#ef4444", "Teal": "#06b6d4", "White": "#f8fafc", "Yellow": "#eab308"
    };
    return map[colorName] || colorName;
}

// ── Bounding Box Canvas Overlay Logic ────────────────────────────────────────
function drawBoundingBoxes(objects) {
    const img = document.getElementById('previewImage');
    const canvas = document.getElementById('boundingOverlay');
    const ctx = canvas.getContext('2d');

    if (!img.naturalWidth || !img.naturalHeight) return;

    // Match canvas size to actual rendered image dimensions
    const rect = img.getBoundingClientRect();
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale ratio from natural Azure coordinates to displayed image
    const scaleX = img.width / img.naturalWidth;
    const scaleY = img.height / img.naturalHeight;

    objects.forEach((obj, idx) => {
        const r = obj.rectangle;
        if (!r) return;

        const x = r.x * scaleX;
        const y = r.y * scaleY;
        const w = r.w * scaleX;
        const h = r.h * scaleY;

        // Draw glowing bounding box
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
        ctx.shadowBlur = 10;
        ctx.strokeRect(x, y, w, h);

        // Draw label background pill
        const labelText = `#${idx+1} ${obj.object} (${(obj.confidence*100).toFixed(0)}%)`;
        ctx.font = '600 12px "JetBrains Mono", monospace';
        const textMetrics = ctx.measureText(labelText);
        const labelW = textMetrics.width + 12;
        const labelH = 22;

        ctx.fillStyle = '#0078D4';
        ctx.shadowBlur = 0;
        ctx.fillRect(x, Math.max(0, y - labelH), labelW, labelH);

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, x + 6, Math.max(16, y - 6));
    });
}

function clearBoundingBoxes() {
    const canvas = document.getElementById('boundingOverlay');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
