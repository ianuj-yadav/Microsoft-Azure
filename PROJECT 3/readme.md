# 👁️ VisionPulse · Azure AI Computer Vision Studio (Project 3)

An enterprise-grade, interactive web studio demonstrating **Microsoft Azure Cognitive Services Vision (Computer Vision API v3.2)**. Built with premium dark-mode aesthetics, glassmorphism, real-time object bounding box overlays, and a secure lightweight backend proxy architecture.

---

## 🌟 Overview & Architecture

### Phase 1: Cloud Infrastructure & Secure Credentials
As outlined in best practices for cloud web applications, directly exposing Azure Cognitive Services subscription keys in frontend browser JavaScript creates security vulnerabilities. This project implements a **Dual-Mode Architecture**:
1. **Lightweight Secure Backend Proxy (`server.js`)**: Built with Node.js and Express. It loads your credentials securely from a local `.env` file (`AZURE_VISION_KEY` and `AZURE_VISION_ENDPOINT`) and proxies image analysis requests from the frontend to Azure without ever exposing keys to the browser network tab.
2. **Direct Client REST Mode & Offline Demo Mode**: For zero-setup demonstrations, the studio also includes an interactive API settings drawer where users can test directly from browser client storage or use simulated neural responses.

### Phase 2: Interactive Drag-and-Drop Frontend
Built using standard HTML5, CSS3, and modern vanilla JavaScript:
- **Interactive Drop Zone**: Features a custom dashed border (`rgba(56, 189, 248, 0.35)`) that illuminates with a neon cyan pulse animation when an image is dragged over it (`.dragover`).
- **Browser Behavior Override**: Standard browser behavior (which opens dropped images directly in the window, leaving the app) is systematically suppressed across `dragenter`, `dragover`, `dragleave`, and `drop` events using `e.preventDefault()` and `e.stopPropagation()`.
- **FileReader API Preview**: Extracts the dropped file via `e.dataTransfer.files[0]`, verifies MIME types, and uses `FileReader.readAsDataURL()` to render an instant high-resolution local preview before uploading to cloud servers.
- **Bounding Box Canvas Overlay**: Calculates coordinate ratios between natural Azure detection rectangles and the DOM-rendered image to draw glowing bounding boxes and confidence labels directly over detected objects!

---

## 🏗️ Project Structure

```
PROJECT 3/
├── .env              # Secure Azure AI Vision Endpoint & Subscription Key 1
├── .env.example      # Template for environment configuration
├── package.json      # Node.js dependencies (express, cors, dotenv, multer)
├── server.js         # Lightweight Node.js/Express secure proxy backend
├── index.html        # Drag-and-drop studio layout, preview canvas, and analytics cards
├── style.css         # Curated dark-mode design system, glassmorphic cards, animations
├── index.js          # FileReader drag-and-drop logic, bounding boxes, and Azure client
└── readme.md         # Documentation and setup guide
```

---

## 🚀 Getting Started

### 1. Running with the Secure Lightweight Backend (Recommended)

To run the application using the Phase 1 Node.js proxy server:
1. Open your terminal inside `a:\Azure Bootcamp\PROJECT 3\`.
2. Install dependencies (if not already installed):
   ```powershell
   npm install
   ```
3. Verify your `.env` file contains your Azure credentials:
   ```env
   AZURE_VISION_ENDPOINT=https://anuj-yadav1.cognitiveservices.azure.com/
   AZURE_VISION_KEY=YOUR_AZURE_VISION_KEY
   PORT=3000
   ```
4. Start the secure backend server:
   ```powershell
   npm start
   ```
5. Open your web browser to: **[http://localhost:3000](http://localhost:3000)**
   - Notice the green status badge reads: **`SECURE BACKEND PROXY · V3.2`**. Your keys are safely locked on the server!

---

### 2. Running Frontend Only (via Live Server or Python)

If you prefer to test the frontend without running Node.js:
1. Right-click `index.html` in VS Code and select **"Open with Live Server"** (or run `python -m http.server 8000`).
2. Click **⚙️ API & Proxy Settings** in the hero banner.
3. Select **🌐 Direct Azure REST API Mode** or **⚡ Offline Demo Mode**.
4. Drag and drop any image or click one of the **Quick Test Sample Images** to analyze!

---

## 📡 Azure AI Vision REST Specification

When analyzing images, the application communicates with Azure Computer Vision using the following REST endpoint structure:

- **HTTP Method**: `POST`
- **Endpoint URL**: `{Endpoint}/vision/v3.2/analyze?visualFeatures=Categories,Tags,Description,Faces,ImageType,Color,Objects`
- **Headers**:
  - `Ocp-Apim-Subscription-Key: {Your-Azure-Key}`
  - `Content-Type: application/octet-stream` (for binary file uploads) OR `application/json` (for `{ "url": "..." }`)
- **Key Response Features**:
  - `description.captions`: Natural language caption with confidence score.
  - `tags`: Array of visual labels and recognition confidence.
  - `objects`: Detected foreground entities with bounding box coordinates (`x, y, w, h`).
  - `color`: Dominant background, foreground, and accent hex color analysis.
