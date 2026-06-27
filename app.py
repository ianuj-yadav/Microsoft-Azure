from fastapi import FastAPI
from fastapi.responses import FileResponse
import requests
import time

app = FastAPI(title="OpsCenter · Azure AI")

AZURE_ENDPOINT = "https://anuj-ai.cognitiveservices.azure.com/"

@app.get("/")
def read_root():
    return FileResponse("index.html")

@app.get("/style.css")
def get_css():
    return FileResponse("style.css")

@app.get("/script.js")
def get_js():
    return FileResponse("script.js")

@app.get("/api/probe")
def probe_endpoint():
    try:
        t0 = time.time()
        # Fast timeout since it's a diagnostic probe
        requests.get(AZURE_ENDPOINT, timeout=5)
        ms_val = round((time.time() - t0) * 1000)
        return {"status": "online", "latency_ms": ms_val}
    except requests.exceptions.RequestException:
        return {"status": "offline", "latency_ms": None}