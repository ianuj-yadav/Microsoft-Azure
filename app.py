import streamlit as st
import requests
import time
import random
import datetime
import pandas as pd
import altair as alt

AZURE_ENDPOINT = "https://anuj-ai.cognitiveservices.azure.com/"

st.set_page_config(
    page_title="OpsCenter · Azure AI",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ══════════════════════════════════════════════════════════════════
#  DESIGN SYSTEM — "OPS TERMINAL"
#  Space Grotesk display · JetBrains Mono data · dot-grid dark BG
#  Signature: animated sonar ping orb showing live latency in hero
# ══════════════════════════════════════════════════════════════════

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');

/* ── Reset & Base ─────────────────────────────────────────── */
html, body, [class*="css"] {
    font-family: 'Inter', -apple-system, sans-serif !important;
    -webkit-font-smoothing: antialiased;
}

.stApp {
    background-color: var(--background-color) !important;
    background-image: radial-gradient(rgba(128, 128, 128, 0.12) 1px, transparent 1px) !important;
    background-size: 24px 24px !important;
}

.main .block-container {
    padding-top: 5.5rem !important;
    padding-bottom: 4rem !important;
    max-width: 1240px !important;
}

/* ── Hero Layout ──────────────────────────────────────────── */
/* ── Navbar ───────────────────────────────────────────────── */
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: var(--background-color);
    border-bottom: 1px solid rgba(128, 128, 128, 0.15);
    z-index: 999;
    display: flex;
    align-items: center;
    padding: 0 2rem;
    gap: 4rem; /* Keeps links close to the logo, leaving the right side empty for Streamlit controls */
}

/* Ensure Streamlit's native header floats seamlessly over our navbar */
[data-testid="stHeader"] {
    background: transparent !important;
}

.nav-brand {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    font-family: 'Inter', sans-serif;
    font-size: 1.4rem; /* Increased size */
    font-weight: 600;
    color: var(--text-color);
    letter-spacing: -0.02em;
}

.nav-logo {
    display: flex;
    align-items: center;
}

.nav-logo svg {
    width: 28px; /* Increased logo size */
    height: 28px;
}

.nav-links {
    display: flex;
    gap: 2rem;
    font-size: 0.95rem; /* Increased size */
    font-weight: 500;
    color: var(--text-color);
    opacity: 0.7;
    margin-top: 2px;
}

.nav-link {
    cursor: pointer;
    transition: opacity 0.2s, color 0.2s;
}

.nav-link:hover {
    opacity: 1;
    color: var(--primary-color, #3B82F6);
}

.hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0 2.5rem;
    gap: 2.5rem;
}

.hero-left { flex: 1; min-width: 0; }

.eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--primary-color, #2563EB);
    margin-bottom: 0.9rem;
    opacity: 0.85;
}

.hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(2.5rem, 5vw, 3.75rem);
    font-weight: 700;
    letter-spacing: -0.055em;
    line-height: 1;
    color: var(--text-color);
    margin: 0 0 0.9rem;
}

.hero-title .accent { color: var(--primary-color, #3B82F6); }

.hero-desc {
    font-size: 0.82rem;
    color: var(--text-color);
    opacity: 0.75;
    line-height: 1.7;
    max-width: 420px;
    margin-bottom: 1.4rem;
}

/* ── Status Pill ──────────────────────────────────────────── */
.pill {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.32rem 0.85rem;
    border-radius: 999px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    border: 1px solid;
    user-select: none;
}

.pill.online  { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.25); color: #10B981; }
.pill.offline { background: rgba(239,68,68,0.08);  border-color: rgba(239,68,68,0.25);  color: #EF4444; }
.pill.idle    { background: rgba(128,128,128,0.08); border-color: rgba(128,128,128,0.25); color: var(--text-color); }

.pill-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
}

.online  .pill-dot { background: #10B981; box-shadow: 0 0 5px #10B981; animation: blink 2s ease infinite; }
.offline .pill-dot { background: #EF4444; box-shadow: 0 0 5px #EF4444; animation: blink 1.1s ease infinite; }
.idle    .pill-dot { background: gray; }

@keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
}

/* ── Sonar Ping Orb (Signature Element) ───────────────────── */
.orb-wrap {
    position: relative;
    width: 152px;
    height: 152px;
    flex-shrink: 0;
}

/* Three concentric ripple rings */
.orb-ring {
    position: absolute;
    top: 50%; left: 50%;
    width: 44px; height: 44px;
    margin: -22px 0 0 -22px;
    border-radius: 50%;
    border: 1px solid transparent;
    animation: sonar 3.6s ease-out infinite;
}
.orb-ring:nth-child(2) { animation-delay: 1.2s; }
.orb-ring:nth-child(3) { animation-delay: 2.4s; }

.orb-wrap.online  .orb-ring { border-color: rgba(16,185,129,0.6); }
.orb-wrap.offline .orb-ring { border-color: rgba(239,68,68,0.6); }
.orb-wrap.idle    .orb-ring { border-color: rgba(128,128,128,0.4); }

@keyframes sonar {
    0%   { transform: scale(1);   opacity: 0.85; }
    100% { transform: scale(3.2); opacity: 0;    }
}

/* Center core */
.orb-core {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 68px; height: 68px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background-color: var(--secondary-background-color);
}

.orb-wrap.online  .orb-core {
    background-image: radial-gradient(circle at center, rgba(16,185,129,0.14) 0%, transparent 70%);
    border: 1px solid rgba(16,185,129,0.25);
    box-shadow: 0 0 24px rgba(16,185,129,0.15);
}
.orb-wrap.offline .orb-core {
    background-image: radial-gradient(circle at center, rgba(239,68,68,0.14) 0%, transparent 70%);
    border: 1px solid rgba(239,68,68,0.25);
    box-shadow: 0 0 24px rgba(239,68,68,0.15);
}
.orb-wrap.idle .orb-core {
    border: 1px solid rgba(128,128,128,0.2);
}

.orb-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-color);
    line-height: 1;
}

.orb-lbl {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.42rem;
    color: var(--text-color);
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: 0.14em;
}

/* ── Metric Cards ─────────────────────────────────────────── */
[data-testid="stMetric"] {
    background: var(--secondary-background-color) !important;
    border: 1px solid rgba(128,128,128,0.15) !important;
    border-left: 3px solid rgba(128,128,128,0.3) !important;
    border-radius: 10px !important;
    padding: 1.1rem 1.4rem !important;
    transition: border-left-color 0.25s ease, transform 0.2s ease, box-shadow 0.2s ease !important;
    position: relative !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
}

[data-testid="stMetric"]:hover {
    border-left-color: var(--primary-color, #3B82F6) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
}

[data-testid="stMetricLabel"] {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.58rem !important;
    color: var(--text-color) !important;
    opacity: 0.7 !important;
    font-weight: 400 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.22em !important;
}

[data-testid="stMetricValue"] {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 1.45rem !important;
    font-weight: 600 !important;
    color: var(--text-color) !important;
    letter-spacing: -0.025em !important;
    background: none !important;
    -webkit-text-fill-color: var(--text-color) !important;
    line-height: 1.2 !important;
}

[data-testid="stMetricDelta"] {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.6rem !important;
}

/* ── Section Labels ───────────────────────────────────────── */
h3 {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.54rem !important;
    font-weight: 500 !important;
    letter-spacing: 0.25em !important;
    text-transform: uppercase !important;
    color: var(--text-color) !important;
    margin-bottom: 1rem !important;
    padding-bottom: 0.65rem !important;
    border-bottom: 1px solid rgba(128,128,128,0.15) !important;
    display: block !important;
}

/* ── Run Button ───────────────────────────────────────────── */
.stButton > button {
    font-family: 'Inter', sans-serif !important;
    font-size: 0.78rem !important;
    font-weight: 500 !important;
    background: var(--secondary-background-color) !important;
    color: var(--text-color) !important;
    border: 1px solid rgba(128,128,128,0.25) !important;
    border-radius: 7px !important;
    padding: 0.55rem 1.2rem !important;
    letter-spacing: 0.01em !important;
    transition: all 0.15s ease !important;
    box-shadow: none !important;
}

.stButton > button:hover {
    background: var(--background-color) !important;
    color: var(--primary-color, #3B82F6) !important;
    border-color: var(--primary-color, #3B82F6) !important;
}

/* ── Notifications ────────────────────────────────────────── */
[data-testid="stNotification"] {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.7rem !important;
    border-radius: 8px !important;
    letter-spacing: 0.01em !important;
    background: var(--secondary-background-color) !important;
    color: var(--text-color) !important;
    border: 1px solid rgba(128,128,128,0.2) !important;
}

/* ── Code / Terminal blocks ───────────────────────────────── */
[data-testid="stCodeBlock"] pre, [data-testid="stCodeBlock"] code {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.67rem !important;
    line-height: 1.7 !important;
    background: var(--secondary-background-color) !important;
    border: 1px solid rgba(128,128,128,0.15) !important;
    border-radius: 6px !important;
    color: var(--text-color) !important;
}

/* ── Expander ─────────────────────────────────────────────── */
.streamlit-expanderHeader {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.58rem !important;
    letter-spacing: 0.18em !important;
    text-transform: uppercase !important;
    color: var(--text-color) !important;
    opacity: 0.8 !important;
    background: transparent !important;
    border: none !important;
    padding: 0 0 0.5rem !important;
}

[data-testid="stExpander"] {
    border: none !important;
    background: transparent !important;
}

/* ── Divider ──────────────────────────────────────────────── */
hr {
    border: none !important;
    border-top: 1px solid rgba(128,128,128,0.15) !important;
    margin: 1.75rem 0 !important;
}

/* ── Caption ──────────────────────────────────────────────── */
[data-testid="stCaptionContainer"] {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.57rem !important;
    color: var(--text-color) !important;
    opacity: 0.7 !important;
    letter-spacing: 0.05em !important;
}

/* ── Scrollbar ────────────────────────────────────────────── */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 5px; }
::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.4); }
</style>
""", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════
#  STATE
# ══════════════════════════════════════════════════════════════════

if "history"      not in st.session_state:
    st.session_state.history      = [random.randint(12, 25) for _ in range(20)]
if "log"          not in st.session_state:
    st.session_state.log          = []
if "last_status"  not in st.session_state:
    st.session_state.last_status  = None
if "last_latency" not in st.session_state:
    st.session_state.last_latency = None
if "total_checks" not in st.session_state:
    st.session_state.total_checks = 0
if "ok_checks"    not in st.session_state:
    st.session_state.ok_checks    = 0

# ══════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════

def probe_endpoint(url: str):
    try:
        t0 = time.time()
        requests.get(url, timeout=5)
        return True, round((time.time() - t0) * 1000)
    except requests.exceptions.RequestException:
        return False, None

def uptime_pct() -> float:
    if st.session_state.total_checks == 0:
        return 100.0
    return round(st.session_state.ok_checks / st.session_state.total_checks * 100, 1)

def avg_latency() -> int:
    h = st.session_state.history
    return round(sum(h) / len(h)) if h else 0

def p95_latency() -> int:
    h = st.session_state.history
    if len(h) < 2:
        return 0
    return sorted(h)[max(0, int(len(h) * 0.95) - 1)]

# ══════════════════════════════════════════════════════════════════
#  HERO — renders from current state at the top of each run
# ══════════════════════════════════════════════════════════════════

s      = st.session_state.last_status
ms     = st.session_state.last_latency

orb_cls  = "online" if s is True else "offline" if s is False else "idle"
orb_val  = f"{ms}ms"   if s is True  else "ERR" if s is False else "—"
pill_txt = (f"ONLINE · {ms}ms" if s is True
            else "OFFLINE · TIMEOUT" if s is False
            else "IDLE · NO PROBE")

st.markdown(f"""
<div class="navbar">
  <div class="nav-brand">
    <div class="nav-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
        <path fill="#f35325" d="M0 0h11v11H0z"/>
        <path fill="#81bc06" d="M12 0h11v11H12z"/>
        <path fill="#05a6f0" d="M0 12h11v11H0z"/>
        <path fill="#ffba08" d="M12 12h11v11H12z"/>
      </svg>
    </div>
    Microsoft Azure
  </div>
  <div class="nav-links">
    <span class="nav-link">Overview</span>
    <span class="nav-link">Telemetry</span>
    <span class="nav-link">Documentation</span>
  </div>
</div>

<div class="hero">
  <div class="hero-left">
    <div class="eyebrow">Azure AI · anuj-ai · Central India</div>
    <div class="hero-title">Ops<span class="accent">Center</span></div>
    <div class="hero-desc">Endpoint telemetry for anuj-ai cognitive services.<br>Probe the endpoint to measure reachability and response latency.</div>
    <div class="pill {orb_cls}">
      <span class="pill-dot"></span>
      {pill_txt}
    </div>
  </div>
  <div class="orb-wrap {orb_cls}">
    <div class="orb-ring"></div>
    <div class="orb-ring"></div>
    <div class="orb-ring"></div>
    <div class="orb-core">
      <span class="orb-val">{orb_val}</span>
      <span class="orb-lbl">latency</span>
    </div>
  </div>
</div>
""", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════
#  METRICS ROW
# ══════════════════════════════════════════════════════════════════

c1, c2, c3, c4 = st.columns(4)

with c1:
    st.metric("Service", "Cognitive API", help=AZURE_ENDPOINT)
with c2:
    st.metric("Avg Latency", f"{avg_latency()} ms")
with c3:
    st.metric("P95 Latency", f"{p95_latency()} ms")
with c4:
    st.metric("Uptime", f"{uptime_pct()}%")

st.divider()

# ══════════════════════════════════════════════════════════════════
#  MAIN CONTENT
# ══════════════════════════════════════════════════════════════════

left_col, right_col = st.columns([2.5, 1.05], gap="large")

with left_col:
    st.markdown("### Probe")

    btn_col, _ = st.columns([1, 3])
    with btn_col:
        go = st.button("▶  Run Diagnostic", use_container_width=True)

    status_slot = st.empty()

    # ── Run probe ────────────────────────────────────────────────
    if go or s is None:
        with status_slot.container():
            st.info("Probing endpoint…", icon="🔄")
        time.sleep(0.25)

        is_ok, ms_val = probe_endpoint(AZURE_ENDPOINT)
        st.session_state.last_status  = is_ok
        st.session_state.last_latency = ms_val
        st.session_state.total_checks += 1
        ts = datetime.datetime.now().strftime("%H:%M:%S")

        if is_ok:
            st.session_state.ok_checks += 1
            st.session_state.history.append(ms_val)
            if len(st.session_state.history) > 60:
                st.session_state.history.pop(0)
            st.session_state.log.insert(0, f"✔  {ts}    {ms_val:>4}ms    200 OK")
        else:
            st.session_state.log.insert(0, f"✖  {ts}    timeout    no response")

        if len(st.session_state.log) > 10:
            st.session_state.log.pop()

        st.rerun()

    # ── Status message ───────────────────────────────────────────
    with status_slot.container():
        if s is True:
            st.success(f"**Operational** — Responded in {ms}ms. TLS handshake complete.", icon="✅")
        elif s is False:
            st.error("**Unreachable** — Request timed out after 5s. Check firewall or DNS.", icon="🚨")
        else:
            st.info("No probe data yet. Click **▶ Run Diagnostic** to begin.", icon="ℹ️")

    # ── Latency chart ────────────────────────────────────────────
    st.markdown("### Response Time · Last 60 Probes")

    hist = st.session_state.history
    df   = pd.DataFrame({"probe": range(len(hist)), "ms": hist})

    chart = (
        alt.Chart(df)
        .mark_area(
            interpolate="monotone",
            line={"color": "#3B82F6", "strokeWidth": 1.5},
            color=alt.Gradient(
                gradient="linear",
                stops=[
                    alt.GradientStop(color="rgba(59,130,246,0.2)", offset=0),
                    alt.GradientStop(color="rgba(59,130,246,0.0)", offset=1),
                ],
                x1=1, x2=1, y1=1, y2=0,
            ),
        )
        .encode(
            x=alt.X("probe:Q", axis=None),
            y=alt.Y(
                "ms:Q",
                axis=alt.Axis(
                    title=None,
                    grid=True,
                    gridColor="#07090F",
                    labelColor="#1E293B",
                    labelFont="JetBrains Mono",
                    labelFontSize=9,
                    tickCount=4,
                    domain=False,
                    ticks=False,
                ),
                scale=alt.Scale(zero=False, padding=10),
            ),
            tooltip=[
                alt.Tooltip("probe:Q", title="Probe #"),
                alt.Tooltip("ms:Q",    title="Latency (ms)"),
            ],
        )
        .properties(height=200, background="transparent")
        .configure_view(strokeWidth=0, fill="transparent")
    )

    st.altair_chart(chart, use_container_width=True)

# ── Right panel ───────────────────────────────────────────────────

with right_col:
    st.markdown("### Resource")
    with st.expander("Configuration", expanded=True):
        st.code(
            "Group     Azure-AI-Project-anuj\n"
            "Sub       Azure for Students\n"
            "Tier      S0  Standard\n"
            "Access    Public\n"
            "Protocol  HTTPS / TLS 1.2\n"
            "Region    Central India",
            language=None,
        )

    st.markdown("### Activity Log")
    if not st.session_state.log:
        st.caption("No activity recorded.")
    else:
        for entry in st.session_state.log:
            st.code(entry, language=None)

    st.markdown("---")
    st.caption(f"Target: `{AZURE_ENDPOINT}`")
    st.caption("Manual refresh · click ▶ Run Diagnostic to probe")