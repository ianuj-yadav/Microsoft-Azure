const historyData = [];
for(let i=0; i<60; i++) historyData.push(null);
let totalChecks = 0;
let okChecks = 0;

// Init Chart.js
const ctx = document.getElementById('latencyChart').getContext('2d');
const gradient = ctx.createLinearGradient(0, 0, 0, 250);
gradient.addColorStop(0, 'rgba(59,130,246,0.3)');
gradient.addColorStop(1, 'rgba(59,130,246,0.0)');

const latencyChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array(60).fill(''),
        datasets: [{
            label: 'Latency (ms)',
            data: historyData,
            borderColor: '#3B82F6',
            borderWidth: 2,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
            x: { display: false },
            y: { 
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'JetBrains Mono', size: 10 } }
            }
        },
        plugins: { legend: { display: false } }
    }
});

function getAvg() {
    const valid = historyData.filter(d => d !== null);
    if(valid.length === 0) return 0;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function getP95() {
    const valid = historyData.filter(d => d !== null).sort((a,b) => a-b);
    if(valid.length < 2) return 0;
    return valid[Math.max(0, Math.floor(valid.length * 0.95) - 1)];
}

document.getElementById('run-btn').addEventListener('click', async () => {
    const btn = document.getElementById('run-btn');
    btn.disabled = true;
    
    document.getElementById('status-message').className = 'status-message info';
    document.getElementById('status-message').innerHTML = '🔄 Probing endpoint...';
    
    try {
        const res = await fetch('/api/probe');
        const data = await res.json();
        
        totalChecks++;
        const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
        
        const logBox = document.getElementById('activity-log');
        if(logBox.innerHTML.includes('No activity recorded')) {
            logBox.innerHTML = '';
        }
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        if (data.status === 'online') {
            okChecks++;
            historyData.push(data.latency_ms);
            historyData.shift();
            latencyChart.update();
            
            // update orb
            document.getElementById('orb-wrapper').className = 'orb-wrap online';
            document.getElementById('orb-val').innerText = data.latency_ms + 'ms';
            
            // update pill
            document.getElementById('status-pill').className = 'pill online';
            document.getElementById('pill-text').innerText = `ONLINE · ${data.latency_ms}ms`;
            
            document.getElementById('status-message').className = 'status-message success';
            document.getElementById('status-message').innerHTML = `✅ <b>Operational</b> — Responded in ${data.latency_ms}ms. TLS handshake complete.`;
            
            logEntry.innerText = `✔  ${ts}    ${String(data.latency_ms).padStart(4, ' ')}ms    200 OK`;
        } else {
            document.getElementById('orb-wrapper').className = 'orb-wrap offline';
            document.getElementById('orb-val').innerText = 'ERR';
            
            document.getElementById('status-pill').className = 'pill offline';
            document.getElementById('pill-text').innerText = 'OFFLINE · TIMEOUT';
            
            document.getElementById('status-message').className = 'status-message error';
            document.getElementById('status-message').innerHTML = `🚨 <b>Unreachable</b> — Request timed out after 5s. Check firewall or DNS.`;
            
            logEntry.innerText = `✖  ${ts}    timeout    no response`;
        }
        
        logBox.insertBefore(logEntry, logBox.firstChild);
        if(logBox.children.length > 10) logBox.lastChild.remove();
        
        // Update metrics
        document.getElementById('val-avg').innerText = getAvg() + ' ms';
        document.getElementById('val-p95').innerText = getP95() + ' ms';
        document.getElementById('val-uptime').innerText = ((okChecks/totalChecks)*100).toFixed(1) + '%';
        
    } catch(err) {
        console.error(err);
        document.getElementById('status-message').className = 'status-message error';
        document.getElementById('status-message').innerHTML = `🚨 <b>Error</b> — Could not reach backend server.`;
    } finally {
        btn.disabled = false;
    }
});
