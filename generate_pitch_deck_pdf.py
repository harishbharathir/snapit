"""
SnapIt - AI-Powered Smart Campus Canteen Operating System
Pitch Deck & Executive Presentation PDF Generator
"""

import os
import base64
import subprocess
import re

# 1. Base64 Encode Logo
logo_path = os.path.join(os.path.dirname(__file__), 'backend', 'snapit_logo.png')
logo_b64 = ""
if os.path.exists(logo_path):
    with open(logo_path, 'rb') as f:
        logo_b64 = f"data:image/png;base64,{base64.b64encode(f.read()).decode('utf-8')}"
else:
    alt_logo = os.path.join(os.path.dirname(__file__), 'frontend', 'public', 'snapit_logo.png')
    if os.path.exists(alt_logo):
        with open(alt_logo, 'rb') as f:
            logo_b64 = f"data:image/png;base64,{base64.b64encode(f.read()).decode('utf-8')}"

# HTML Template with 13 Landscape Widescreen Slides
html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SnapIt - Smart Campus Canteen OS Pitch Deck</title>
<style>
  @page {{
    size: 1920px 1080px;
    margin: 0;
  }}
  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}
  html, body {{
    width: 1920px;
    background-color: #0b0f19;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}
  .slide {{
    width: 1920px;
    height: 1080px;
    max-height: 1080px;
    page-break-after: always;
    page-break-inside: avoid;
    overflow: hidden;
    position: relative;
    padding: 60px 80px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    background: radial-gradient(circle at 90% 10%, rgba(249, 115, 22, 0.08) 0%, transparent 45%),
                radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.06) 0%, transparent 40%),
                #0b0f19;
  }}

  /* Top Slide Header */
  .slide-header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 35px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding-bottom: 20px;
  }}
  .slide-header .brand-area {{
    display: flex;
    align-items: center;
    gap: 16px;
  }}
  .slide-header .brand-logo {{
    height: 48px;
    object-fit: contain;
  }}
  .slide-header .slide-category {{
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #f97316;
  }}
  .slide-header h2 {{
    font-size: 34px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
  }}
  .slide-header .slide-number {{
    font-size: 16px;
    font-weight: 700;
    color: #64748b;
    font-mono: true;
  }}

  /* Typography */
  h1 {{ font-weight: 800; line-height: 1.1; }}
  p {{ color: #94a3b8; font-size: 17px; line-height: 1.5; }}
  .text-highlight {{ color: #f97316; }}
  .text-emerald {{ color: #10b981; }}
  .text-blue {{ color: #38bdf8; }}
  .text-amber {{ color: #f59e0b; }}

  /* Cards & Containers */
  .card {{
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 26px;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  }}
  .card-gradient-orange {{
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(249, 115, 22, 0.03));
    border: 1px solid rgba(249, 115, 22, 0.25);
  }}
  .card-gradient-blue {{
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(56, 189, 248, 0.03));
    border: 1px solid rgba(56, 189, 248, 0.25);
  }}
  .card-gradient-emerald {{
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.03));
    border: 1px solid rgba(16, 185, 129, 0.25);
  }}

  /* Badges & Pills */
  .pill {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }}
  .pill-orange {{ background: rgba(249, 115, 22, 0.15); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.3); }}
  .pill-emerald {{ background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }}
  .pill-blue {{ background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }}

  /* Grid Layouts */
  .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }}
  .grid-3 {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }}
  .grid-4 {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }}

  /* Tables */
  table {{
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 16px;
    border-radius: 14px;
    overflow: hidden;
  }}
  th {{
    background: rgba(15, 23, 42, 0.9);
    color: #94a3b8;
    text-align: left;
    padding: 14px 18px;
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }}
  td {{
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(30, 41, 59, 0.4);
    color: #e2e8f0;
  }}
  tr:last-child td {{ border-bottom: none; }}

  /* Metric Callouts */
  .stat-val {{
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 4px;
  }}
  .stat-label {{
    font-size: 14px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
  }}
</style>
</head>
<body>

  <!-- ==================== SLIDE 1: COVER SLIDE ==================== -->
  <div class="slide" style="justify-content: center; align-items: center; text-align: center; position: relative;">
    <div style="position: absolute; top: 60px; left: 80px; display: flex; align-items: center; gap: 15px;">
      {f'<img src="{logo_b64}" style="height: 54px;" />' if logo_b64 else '<span style="font-size: 32px; font-weight: 900; color: #f97316;">SNAPIT</span>'}
      <span class="pill pill-orange">Institutional Pitch Deck</span>
    </div>
    <div style="position: absolute; top: 60px; right: 80px;">
      <span style="color: #64748b; font-size: 15px; font-weight: 600;">CONFIDENTIAL • SERIES SEED • 2026</span>
    </div>

    <div style="max-width: 1400px; margin-top: 40px;">
      <span class="pill pill-orange" style="margin-bottom: 25px; font-size: 15px; padding: 8px 20px;">
        🚀 Beyond Food Delivery: An Institution-Wide Cafeteria OS
      </span>
      <h1 style="font-size: 76px; letter-spacing: -1.5px; margin-bottom: 24px; color: #ffffff;">
        SNAPIT <span style="background: linear-gradient(135deg, #f97316, #fb923c); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CAMPUS FOOD OS</span>
      </h1>
      <p style="font-size: 26px; color: #94a3b8; max-width: 1100px; margin: 0 auto 50px; line-height: 1.4;">
        The AI-powered multi-stakeholder management ecosystem transforming campus dining for 
        <strong style="color: #fff;">Students</strong>, <strong style="color: #fff;">Kitchen Crews</strong>, 
        <strong style="color: #fff;">Counter Staff</strong>, and <strong style="color: #fff;">Campus Leadership</strong>.
      </p>

      <!-- 4 Quick Stats Hero Row -->
      <div class="grid-4" style="margin-top: 30px;">
        <div class="card card-gradient-orange">
          <div class="stat-val text-highlight">65%</div>
          <div class="stat-label">Queue Time Reduction</div>
          <p style="font-size: 14px; margin-top: 6px;">From 28 mins down to 5.2 mins per student meal cycle</p>
        </div>
        <div class="card card-gradient-blue">
          <div class="stat-val text-blue">YOLOv8</div>
          <div class="stat-label">Computer Vision AI</div>
          <p style="font-size: 14px; margin-top: 6px;">Live zone heatmaps & automated bottleneck alerts</p>
        </div>
        <div class="card card-gradient-emerald">
          <div class="stat-val text-emerald">Dual-Station</div>
          <div class="stat-label">Split QR Routing</div>
          <p style="font-size: 14px; margin-top: 6px;">Decouples 30-sec beverage queues from cooked meals</p>
        </div>
        <div class="card" style="border: 1px solid rgba(168, 85, 247, 0.3); background: rgba(168, 85, 247, 0.08);">
          <div class="stat-val" style="color: #c084fc;">0-Latency</div>
          <div class="stat-label">Campus Valet Wallet</div>
          <p style="font-size: 14px; margin-top: 6px;">Sub-second checkout impervious to campus network drops</p>
        </div>
      </div>
    </div>

    <div style="position: absolute; bottom: 40px; display: flex; gap: 40px; color: #64748b; font-size: 14px; font-weight: 600;">
      <span>Cross-Platform Android & Web</span>
      <span>•</span>
      <span>Real-Time WebSocket Sync</span>
      <span>•</span>
      <span>Zero-Capex Hardware Onboarding</span>
      <span>•</span>
      <span>Enterprise Auditing</span>
    </div>
  </div>

  <!-- ==================== SLIDE 2: THE PROBLEM ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">The Institutional Crisis</div>
          <h2>Campus Dining is Fundamentally Broken</h2>
        </div>
      </div>
      <div class="slide-number">02 / 13</div>
    </div>

    <p style="font-size: 20px; color: #cbd5e1; margin-bottom: 30px;">
      Institutions force thousands of people into high-density 30–45 minute dining windows. 
      Traditional consumer delivery apps (Swiggy/Zomato) fail because campus dining obeys entirely different physical and economic laws.
    </p>

    <div class="grid-4" style="margin-bottom: 35px;">
      <div class="card" style="border-top: 4px solid #ef4444;">
        <div style="font-size: 20px; font-weight: 700; color: #f87171; margin-bottom: 12px;">1. The Student Trap</div>
        <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">
          Students waste <strong>20–35 minutes</strong> standing in congested queues during a 45-minute break. 
          They face unknown menu availability, missing out on lunch or arriving late to lecture halls.
        </p>
      </div>
      <div class="card" style="border-top: 4px solid #f97316;">
        <div style="font-size: 20px; font-weight: 700; color: #fb923c; margin-bottom: 12px;">2. Kitchen Blind Spots</div>
        <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">
          Chefs cook blind without real-time demand forecasts. This results in either 
          <strong>25–35% food waste</strong> from over-cooking or selling out in 10 minutes, generating massive kitchen panic and student outrage.
        </p>
      </div>
      <div class="card" style="border-top: 4px solid #eab308;">
        <div style="font-size: 20px; font-weight: 700; color: #facc15; margin-bottom: 12px;">3. Counter Chokepoint</div>
        <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">
          Cashiers struggle with manual paper tokens, cash change disputes, and lost receipts. 
          A student ordering a single cup of tea is held behind someone ordering a 5-item family meal.
        </p>
      </div>
      <div class="card" style="border-top: 4px solid #64748b;">
        <div style="font-size: 20px; font-weight: 700; color: #94a3b8; margin-bottom: 12px;">4. Admin Exclusion</div>
        <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">
          Deans and Campus Directors have <strong>zero operational visibility</strong> into cafeteria tenant revenue, 
          hygiene standards, crowd surge hazards, or vendor lease compliance.
        </p>
      </div>
    </div>

    <!-- The Flaw of Consumer Apps -->
    <div class="card card-gradient-orange" style="display: flex; align-items: center; justify-content: space-between; padding: 22px 36px;">
      <div>
        <h4 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px;">Why Don't Institutions Just Use DoorDash, Swiggy, or Zomato?</h4>
        <p style="font-size: 15px; color: #cbd5e1; max-width: 1250px;">
          Third-party delivery apps demand 20–30% vendor commissions, require delivery personnel (strictly barred inside academic blocks), 
          cannot interface with campus CCTV feeds, and completely lack multi-station kitchen display routing.
        </p>
      </div>
      <span class="pill pill-orange" style="font-size: 16px; padding: 12px 24px; white-space: nowrap;">SnapIt Solves Campus Physics</span>
    </div>
  </div>

  <!-- ==================== SLIDE 3: THE 4-STAKEHOLDER SOLUTION ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">Core Value Proposition</div>
          <h2>The 4-Way Multi-Stakeholder Matrix</h2>
        </div>
      </div>
      <div class="slide-number">03 / 13</div>
    </div>

    <p style="font-size: 18px; color: #cbd5e1; margin-bottom: 25px;">
      SnapIt is not an isolated consumer food app. It is a full-stack operational engine designed to optimize the workflow of all 4 campus stakeholders simultaneously.
    </p>

    <div class="grid-4" style="height: calc(100% - 150px);">
      <!-- Stakeholder 1: Students -->
      <div class="card" style="border-top: 4px solid #f97316; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 22px; font-weight: 700; color: #fff;">1. Students (Buyers)</h3>
          <span class="pill pill-orange">Experience</span>
        </div>
        <ul style="list-style: none; space-y: 12px; font-size: 15px; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <li>📍 <strong>Live Crowd Radar</strong>: View real-time occupancy & wait times before walking to the dining hall.</li>
          <li>⚡ <strong>Cross-Canteen Recommendation</strong>: Smart suggestions diverting students to least congested outlets.</li>
          <li>💳 <strong>Valet Card Wallet</strong>: Instant 1-tap checkout immune to cellular network congestion.</li>
          <li>📱 <strong>Split-Station QR</strong>: Independent ticket codes for drinks vs kitchen meals.</li>
          <li>🥗 <strong>Nutritional Transparency</strong>: Calorie, protein, carb & fat counts displayed per item.</li>
          <li>🧾 <strong>Digital Receipts</strong>: Instant downloadable graphics & bill history.</li>
        </ul>
      </div>

      <!-- Stakeholder 2: Kitchen Staff -->
      <div class="card" style="border-top: 4px solid #38bdf8; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 22px; font-weight: 700; color: #fff;">2. Kitchen & Chefs</h3>
          <span class="pill pill-blue">Production</span>
        </div>
        <ul style="list-style: none; space-y: 12px; font-size: 15px; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <li>📋 <strong>Live Digital KDS</strong>: Clean chronological ticket queue replacing messy paper slips.</li>
          <li>🔥 <strong>Station Separation</strong>: Hot meals and express beverages automatically segregated.</li>
          <li>📉 <strong>Live Stock Decrementing</strong>: Inventory drops in real-time; prevents orders for sold-out food.</li>
          <li>🍳 <strong>Batch Prep Visibility</strong>: Cook 10 dosas at once by seeing incoming order clusters.</li>
          <li>⏱️ <strong>Status Toggling</strong>: One-touch update from PENDING &rarr; PREPARING &rarr; READY.</li>
          <li>🌿 <strong>Waste Reduction</strong>: Accurate demand sync cuts over-preparation by up to 35%.</li>
        </ul>
      </div>

      <!-- Stakeholder 3: Counter Staff -->
      <div class="card" style="border-top: 4px solid #10b981; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 22px; font-weight: 700; color: #fff;">3. Counter Staff</h3>
          <span class="pill pill-emerald">Fulfillment</span>
        </div>
        <ul style="list-style: none; space-y: 12px; font-size: 15px; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <li>📷 <strong>Built-in jsQR Camera Scanner</strong>: Sub-second redemption using phone or tablet camera.</li>
          <li>🎟️ <strong>Partial Ticket Claim</strong>: Redeem beverage voucher at chai stall without closing kitchen meal.</li>
          <li>🛠️ <strong>Live Menu Management</strong>: Add dishes, upload food photos, and adjust prices on the fly.</li>
          <li>⭐ <strong>Promotional Badging</strong>: Flag "Today's Special", "New Arrival", or deal prices instantly.</li>
          <li>🚨 <strong>Bottleneck Alerts</strong>: Notified when queue density exceeds comfortable thresholds.</li>
          <li>🚫 <strong>Zero Hardware Capex</strong>: Runs seamlessly on any low-cost mobile phone or tablet.</li>
        </ul>
      </div>

      <!-- Stakeholder 4: Admin & Leadership -->
      <div class="card" style="border-top: 4px solid #a855f7; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 22px; font-weight: 700; color: #fff;">4. Administration</h3>
          <span class="pill" style="background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.3);">Oversight</span>
        </div>
        <ul style="list-style: none; space-y: 12px; font-size: 15px; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <li>🏢 <strong>Multi-Canteen Command</strong>: Single view of Main Canteen, Food Court & Snack Corner.</li>
          <li>👁️ <strong>YOLOv8 Vision Heatmaps</strong>: Real-time people count in Counter, Seating & Entry zones.</li>
          <li>📊 <strong>Hourly Peak Analytics</strong>: Correlate class schedules with dining surge patterns.</li>
          <li>💰 <strong>Revenue Audit & Settlement</strong>: Daily GMV, hourly trends, and vendor reconciliation.</li>
          <li>📁 <strong>Native Report Exports</strong>: 1-click audit-grade CSV reports saved to device files.</li>
          <li>🛡️ <strong>Safety & Compliance</strong>: Prevent hazardous crowding and guarantee student dining SLAs.</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 4: TECHNICAL ARCHITECTURE ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">System Engineering</div>
          <h2>Full-Stack High-Concurrency Architecture</h2>
        </div>
      </div>
      <div class="slide-number">04 / 13</div>
    </div>

    <div class="grid-2" style="height: calc(100% - 130px);">
      <!-- Left Column: Layer Breakdown -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card" style="padding: 18px 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 18px; font-weight: 700; color: #f97316;">1. Mobile Client & Presentation Layer</div>
            <span class="pill pill-orange">Android + Web</span>
          </div>
          <p style="font-size: 14px; color: #cbd5e1;">
            Built with <strong>React 18 + Vite + Tailwind CSS</strong>, encapsulated in <strong>Capacitor 8</strong> for native Android deployment. 
            Features Framer Motion animations, Recharts analytics, HTML5 Canvas bill generation, and client-side <strong>jsQR</strong> camera streaming.
          </p>
        </div>

        <div class="card" style="padding: 18px 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 18px; font-weight: 700; color: #38bdf8;">2. Asynchronous API & WebSocket Bus</div>
            <span class="pill pill-blue">FastAPI Python</span>
          </div>
          <p style="font-size: 14px; color: #cbd5e1;">
            High-performance asynchronous <strong>FastAPI</strong> microservice engine. Features an in-memory <strong>WebSocket ConnectionManager</strong> 
            broadcasting real-time order state mutations to students, kitchen staff, and counter screens simultaneously with sub-50ms latency.
          </p>
        </div>

        <div class="card" style="padding: 18px 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 18px; font-weight: 700; color: #10b981;">3. Computer Vision & Crowd Inference</div>
            <span class="pill pill-emerald">YOLOv8 Engine</span>
          </div>
          <p style="font-size: 14px; color: #cbd5e1;">
            <strong>Ultralytics YOLOv8m</strong> model performing real-time person detection and centroid tracking across configured spatial boundaries 
            (Counter, Seating, Entry) with OpenCV. Graceful fallback to smooth random-walk simulation ensures 100% demo uptime.
          </p>
        </div>

        <div class="card" style="padding: 18px 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 18px; font-weight: 700; color: #c084fc;">4. Distributed Data & Payment Engine</div>
            <span class="pill" style="background: rgba(168,85,247,0.15); color: #c084fc;">MongoDB + Razorpay</span>
          </div>
          <p style="font-size: 14px; color: #cbd5e1;">
            Async <strong>Motor MongoDB</strong> with compound indexing across users, orders, and crowd history. PBKDF2 cryptography for credential security. 
            Integrated <strong>Razorpay Payment Gateway</strong> supporting UPI, Net Banking, and instant campus wallet top-up.
          </p>
        </div>
      </div>

      <!-- Right Column: Architecture Schematic Box -->
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; background: rgba(15, 23, 42, 0.8);">
        <div>
          <h3 style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 16px;">Enterprise Integration Blueprint</h3>
          <p style="font-size: 15px; color: #94a3b8; margin-bottom: 24px;">
            The platform is engineered for zero-dependency portability. It can run on low-cost edge servers, commercial clouds (Render/AWS), or institution-hosted on-premise clusters.
          </p>

          <table style="font-size: 14px;">
            <thead>
              <tr>
                <th>Component</th>
                <th>Technology</th>
                <th>Design Benefit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Mobile Wrapper</strong></td>
                <td>Capacitor Android</td>
                <td>Single codebase generates native Android APK and Web PWA</td>
              </tr>
              <tr>
                <td><strong>Vision Model</strong></td>
                <td>YOLOv8m + SciPy</td>
                <td>Centroid spatial clustering maps heads to precise counter zones</td>
              </tr>
              <tr>
                <td><strong>Order Push</strong></td>
                <td>WebSockets (/api/ws)</td>
                <td>Eliminates battery-draining polling; instant status delivery</td>
              </tr>
              <tr>
                <td><strong>QR Engine</strong></td>
                <td>jsQR + PyQRCode</td>
                <td>Device-native camera scanning with zero proprietary hardware</td>
              </tr>
              <tr>
                <td><strong>Resilience</strong></td>
                <td>MongoMock + SQLite bridge</td>
                <td>Zero-config in-memory fallback guarantees operational continuity</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card card-gradient-emerald" style="padding: 18px 22px; margin-top: 20px;">
          <div style="font-size: 15px; font-weight: 700; color: #10b981; margin-bottom: 4px;">🔐 Security & Privacy Assurance</div>
          <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">
            CCTV video feeds are analyzed strictly for anonymous spatial coordinate tracking (person centroid counts). 
            <strong>No facial recognition or biometric imagery is stored or transmitted</strong>, guaranteeing total student privacy and GDPR/FERPA compliance.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 5: INNOVATIVE FEATURES ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">Key Differentiators</div>
          <h2>4 Flagship Engineering Breakthroughs</h2>
        </div>
      </div>
      <div class="slide-number">05 / 13</div>
    </div>

    <div class="grid-2" style="height: calc(100% - 130px);">
      <!-- Feature 1 -->
      <div class="card card-gradient-orange" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span class="pill pill-orange">Breakthrough #1</span>
            <span style="font-size: 14px; font-weight: 700; color: #f97316;">Split-Station Routing</span>
          </div>
          <h3 style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px;">Dual-Station QR Code Architecture</h3>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
            <strong>The Problem:</strong> In cafeterias, drinks (tea/coffee) take 15 seconds to pour, while dosas take 7 minutes to fry. 
            Putting both items on one ticket paralyzes the counter queue.<br><br>
            <strong>SnapIt's Fix:</strong> The backend automatically parses the cart. Beverages generate a dedicated 
            <code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; color: #fb923c;">qr_code_tea</code> 
            and food generates a distinct <code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; color: #fb923c;">qr_code_snacks</code>. 
            Students grab chai at the express station immediately while lunch is prepared.
          </p>
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 12px 18px; border-radius: 12px; font-size: 13px; color: #fdba74;">
          🚀 Result: 4x faster drink pickup and zero counter cross-congestion.
        </div>
      </div>

      <!-- Feature 2 -->
      <div class="card card-gradient-blue" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span class="pill pill-blue">Breakthrough #2</span>
            <span style="font-size: 14px; font-weight: 700; color: #38bdf8;">Computer Vision</span>
          </div>
          <h3 style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px;">YOLOv8 Dynamic Zone Mapping</h3>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
            <strong>The Problem:</strong> Knowing total people in a hall is useless if you don't know WHERE they are.<br><br>
            <strong>SnapIt's Fix:</strong> We partition the cafeteria camera frame into 3 distinct zones: 
            <strong>Counter Zone</strong> (ordering queue), <strong>Seating Zone</strong> (table occupancy), and <strong>Entryway</strong> (congestion flow). 
            When counter queue density crosses 70%, the system triggers an automated <em>Bottleneck Alert</em> to staff and updates wait-time forecasts.
          </p>
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 12px 18px; border-radius: 12px; font-size: 13px; color: #7dd3fc;">
          👁️ Result: Granular crowd intelligence without expensive specialized sensors.
        </div>
      </div>

      <!-- Feature 3 -->
      <div class="card card-gradient-emerald" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span class="pill pill-emerald">Breakthrough #3</span>
            <span style="font-size: 14px; font-weight: 700; color: #10b981;">Campus Load-Balancing</span>
          </div>
          <h3 style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px;">Intelligent Cross-Canteen Dispatch</h3>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
            <strong>The Problem:</strong> The Central Canteen is chronically slammed at 1:00 PM while the Library Food Court sits at 25% capacity.<br><br>
            <strong>SnapIt's Fix:</strong> A real-time cross-canteen recommendation algorithm continuously weighs wait times across Canteens A, B, and C. 
            The student home screen actively prompts: <em>"Go to Snack Corner — shortest wait time (3.2 min wait)"</em>, leveling campus-wide foot traffic.
          </p>
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 12px 18px; border-radius: 12px; font-size: 13px; color: #6ee7b7;">
          ⚖️ Result: Prevents facility crowding and redistributes revenue to all campus vendors.
        </div>
      </div>

      <!-- Feature 4 -->
      <div class="card" style="border: 1px solid rgba(168, 85, 247, 0.3); background: rgba(168, 85, 247, 0.08); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span class="pill" style="background: rgba(168,85,247,0.15); color: #c084fc;">Breakthrough #4</span>
            <span style="font-size: 14px; font-weight: 700; color: #c084fc;">Frictionless Payments</span>
          </div>
          <h3 style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px;">Integrated Campus Valet Digital Card</h3>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
            <strong>The Problem:</strong> During recess, 2,000 students try to initiate external UPI/SMS OTP bank transactions simultaneously, causing cellular gridlock and 30% gateway timeout failures.<br><br>
            <strong>SnapIt's Fix:</strong> An in-app prepaid campus Valet Card. Students top-up once via Razorpay and enjoy sub-second, 1-tap local checkout that works reliably even on congested campus Wi-Fi.
          </p>
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 12px 18px; border-radius: 12px; font-size: 13px; color: #e9d5ff;">
          💳 Result: 100% payment success rate and instant checkout velocity.
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 6: PRODUCT WORKFLOWS ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">User Experience & Operations</div>
          <h2>Seamless End-to-End Operational Workflows</h2>
        </div>
      </div>
      <div class="slide-number">06 / 13</div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 24px; height: calc(100% - 130px);">
      <!-- Flow 1: Student Flow -->
      <div class="card" style="padding: 22px 28px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 20px; font-weight: 700; color: #f97316;">Flow A: The Student Dine & Pickup Journey</h3>
          <span class="pill pill-orange">Average Duration: 3.5 Minutes</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; position: relative;">
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(249,115,22,0.2); border: 2px solid #f97316; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">1</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Check Heatmap</div>
            <div style="font-size: 12px; color: #94a3b8;">Review live wait time</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(249,115,22,0.2); border: 2px solid #f97316; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">2</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Select Items</div>
            <div style="font-size: 12px; color: #94a3b8;">Inspect macros & stock</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(249,115,22,0.2); border: 2px solid #f97316; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">3</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Valet Checkout</div>
            <div style="font-size: 12px; color: #94a3b8;">Sub-second execution</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(249,115,22,0.2); border: 2px solid #f97316; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">4</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Dual QR Vouchers</div>
            <div style="font-size: 12px; color: #94a3b8;">Separate tea & food</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(249,115,22,0.2); border: 2px solid #f97316; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">5</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">WebSocket Ping</div>
            <div style="font-size: 12px; color: #94a3b8;">"Your order is READY"</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(16,185,129,0.3); border: 2px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">✓</div>
            <div style="font-size: 14px; font-weight: 700; color: #10b981;">Scan & Collect</div>
            <div style="font-size: 12px; color: #94a3b8;">Instant meal pickup</div>
          </div>
        </div>
      </div>

      <!-- Flow 2: Kitchen & Counter Flow -->
      <div class="card" style="padding: 22px 28px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 20px; font-weight: 700; color: #38bdf8;">Flow B: Kitchen Display & Counter Validation</h3>
          <span class="pill pill-blue">Zero Order Leakage</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(56,189,248,0.2); border: 2px solid #38bdf8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">1</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Order Arrival</div>
            <div style="font-size: 12px; color: #94a3b8;">Pops up on KDS feed</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(56,189,248,0.2); border: 2px solid #38bdf8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">2</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Stock Deduction</div>
            <div style="font-size: 12px; color: #94a3b8;">Auto-inventory decrement</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(56,189,248,0.2); border: 2px solid #38bdf8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">3</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Meal Preparation</div>
            <div style="font-size: 12px; color: #94a3b8;">Chef marks PREPARING</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(56,189,248,0.2); border: 2px solid #38bdf8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">4</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Ready Trigger</div>
            <div style="font-size: 12px; color: #94a3b8;">Notifies student screen</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(56,189,248,0.2); border: 2px solid #38bdf8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">5</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Camera QR Scan</div>
            <div style="font-size: 12px; color: #94a3b8;">Sub-second jsQR decode</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 14%;">
            <div style="width: 44px; height: 44px; background: rgba(16,185,129,0.3); border: 2px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 800; color: #fff;">✓</div>
            <div style="font-size: 14px; font-weight: 700; color: #10b981;">Order Served</div>
            <div style="font-size: 12px; color: #94a3b8;">Closed on ledger</div>
          </div>
        </div>
      </div>

      <!-- Flow 3: Admin & AI Flow -->
      <div class="card" style="padding: 22px 28px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 20px; font-weight: 700; color: #10b981;">Flow C: Computer Vision Crowd Intelligence & Audit</h3>
          <span class="pill pill-emerald">Autonomous Background Pipeline</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="text-align: center; width: 18%;">
            <div style="font-size: 28px; margin-bottom: 4px;">📹</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">RTSP / CCTV Feed</div>
            <div style="font-size: 12px; color: #94a3b8;">Existing camera inputs</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 18%;">
            <div style="font-size: 28px; margin-bottom: 4px;">🧠</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">YOLOv8 Detection</div>
            <div style="font-size: 12px; color: #94a3b8;">Person centroid extraction</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 18%;">
            <div style="font-size: 28px; margin-bottom: 4px;">📐</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Zone Mapping</div>
            <div style="font-size: 12px; color: #94a3b8;">Counter vs Dining area</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 18%;">
            <div style="font-size: 28px; margin-bottom: 4px;">🚨</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff;">Bottleneck Engine</div>
            <div style="font-size: 12px; color: #94a3b8;">Trigger alerts if &gt;70%</div>
          </div>
          <div style="color: #64748b; font-size: 20px;">&rarr;</div>
          <div style="text-align: center; width: 18%;">
            <div style="font-size: 28px; margin-bottom: 4px;">📊</div>
            <div style="font-size: 14px; font-weight: 700; color: #10b981;">Executive Dashboard</div>
            <div style="font-size: 12px; color: #94a3b8;">Revenue & CSV export</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 7: BUSINESS MODEL ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">Monetization Engine</div>
          <h2>Robust, Multi-Layered B2B Revenue Model</h2>
        </div>
      </div>
      <div class="slide-number">07 / 13</div>
    </div>

    <div class="grid-3" style="margin-bottom: 24px;">
      <div class="card card-gradient-orange">
        <span class="pill pill-orange" style="margin-bottom: 12px;">Primary Recurring SaaS</span>
        <h3 style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 8px;">Canteen Vendor Subscription</h3>
        <div style="font-size: 32px; font-weight: 800; color: #f97316; margin-bottom: 10px;">₹4,500 <span style="font-size: 16px; color: #94a3b8;">/ counter / mo</span></div>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
          Charged to private cafeteria contractors for KDS, real-time inventory management, staff jsQR scanner app, menu deal promotions, and billing logs.
        </p>
      </div>

      <div class="card card-gradient-emerald">
        <span class="pill pill-emerald" style="margin-bottom: 12px;">Transaction Volume</span>
        <h3 style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 8px;">Order & Wallet Take-Rate</h3>
        <div style="font-size: 32px; font-weight: 800; color: #10b981; margin-bottom: 10px;">1.8% – 2.2% <span style="font-size: 16px; color: #94a3b8;">convenience fee</span></div>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
          Captured on digital payments and Valet Card wallet deposits. A 5,000-student university generating ₹2.5 Lakhs daily GMV yields ₹4,500 – ₹5,500/day in pure recurring commission.
        </p>
      </div>

      <div class="card card-gradient-blue">
        <span class="pill pill-blue" style="margin-bottom: 12px;">Enterprise AI License</span>
        <h3 style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 8px;">Computer Vision Suite</h3>
        <div style="font-size: 32px; font-weight: 800; color: #38bdf8; margin-bottom: 10px;">₹45,000 <span style="font-size: 16px; color: #94a3b8;">/ campus / yr</span></div>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
          Direct institutional contract with College Trustees/Facility Leadership for campus CCTV camera AI crowd mapping, bottleneck mitigation, and executive CSV reporting.
        </p>
      </div>
    </div>

    <!-- Secondary Streams & Unit Economics -->
    <div class="grid-2">
      <div class="card">
        <h4 style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 12px;">Additional High-Margin Monetization Channels</h4>
        <ul style="list-style: none; space-y: 10px; font-size: 14px; color: #cbd5e1;">
          <li style="margin-bottom: 8px;">📢 <strong>Sponsored Brand Placements</strong>: FMCG beverage (Pepsi/Coke) and snack brands sponsor "Today's Deal" badges on student app banners.</li>
          <li style="margin-bottom: 8px;">💳 <strong>Campus Enterprise Integration</strong>: Tailored integration fees for university ERPs (SAP/Canvas), hostel mess meal plans, and RFID card readers.</li>
          <li>🏦 <strong>Float Income on Prepaid Wallets</strong>: Interest yield generated from aggregate prepaid student balances resting inside the digital valet pool.</li>
        </ul>
      </div>

      <div class="card" style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.1);">
        <h4 style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 8px;">Single-Campus Annual Unit Economics (Model)</h4>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 8px 0; font-size: 14px;">
          <span style="color: #94a3b8;">Average Student Body</span>
          <strong style="color: #fff;">5,000 Students & Faculty</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 8px 0; font-size: 14px;">
          <span style="color: #94a3b8;">Food Outlets (Canteen A, B, C)</span>
          <strong style="color: #fff;">3 Canteen Counters</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 8px 0; font-size: 14px;">
          <span style="color: #94a3b8;">Annual Platform GMV</span>
          <strong style="color: #10b981;">₹4.2 Crore ($510,000)</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0 0 0; font-size: 16px;">
          <span style="color: #f97316; font-weight: 700;">Net Annual Revenue to SnapIt</span>
          <strong style="color: #f97316;">₹11.8 Lakhs ($14,200) / campus</strong>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 8: MARKET SIZING ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">Market Opportunity</div>
          <h2>Massive, Underserved Institutional Market</h2>
        </div>
      </div>
      <div class="slide-number">08 / 13</div>
    </div>

    <div class="grid-3" style="margin-bottom: 30px;">
      <div class="card" style="border-left: 6px solid #64748b;">
        <div style="font-size: 15px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Total Addressable Market (TAM)</div>
        <div style="font-size: 46px; font-weight: 900; color: #fff; margin-bottom: 6px;">$250B+</div>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
          Global institutional cafeteria and contract food services market across higher education, K-12 private schools, healthcare systems, and corporate tech campuses.
        </p>
      </div>

      <div class="card" style="border-left: 6px solid #38bdf8;">
        <div style="font-size: 15px; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">Serviceable Addressable Market (SAM)</div>
        <div style="font-size: 46px; font-weight: 900; color: #38bdf8; margin-bottom: 6px;">$14.2B</div>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
          Institutional food service spend across higher education universities, engineering/medical colleges, and IT business parks in our initial target geographic clusters.
        </p>
      </div>

      <div class="card" style="border-left: 6px solid #f97316;">
        <div style="font-size: 15px; font-weight: 700; color: #f97316; text-transform: uppercase; margin-bottom: 8px;">Serviceable Obtainable Market (SOM)</div>
        <div style="font-size: 46px; font-weight: 900; color: #f97316; margin-bottom: 6px;">$380M</div>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
          First 36-month target capturing 1,200 tier-1 universities, autonomous engineering colleges, and multi-tenant tech parks across top urban academic belts.
        </p>
      </div>
    </div>

    <!-- Macro Growth Tailwinds -->
    <div class="card" style="padding: 26px;">
      <h3 style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 16px;">Three Unstoppable Structural Tailwinds</h3>
      <div class="grid-3">
        <div>
          <h4 style="font-size: 17px; font-weight: 700; color: #f97316; margin-bottom: 8px;">1. Mandated Cashless Campuses</h4>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
            University chancellors and accreditation bodies (e.g. NAAC, UGC) actively demand digital auditability and cashless transactions to stamp out cash pilferage.
          </p>
        </div>
        <div>
          <h4 style="font-size: 17px; font-weight: 700; color: #38bdf8; margin-bottom: 8px;">2. AI Infrastructure Push</h4>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
            Institutions are already spending millions retrofitting campus CCTV networks. SnapIt leverages existing cameras to deliver immediate ROI through Computer Vision.
          </p>
        </div>
        <div>
          <h4 style="font-size: 17px; font-weight: 700; color: #10b981; margin-bottom: 8px;">3. Gen-Z Mobile Expectations</h4>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
            Today's university student expects instantaneous, digital-first experiences. Standing 30 minutes in a crowded line for a samosa is an unacceptable relic of the past.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 9: GO-TO-MARKET ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">Expansion Strategy</div>
          <h2>B2B2C Go-To-Market Playbook</h2>
        </div>
      </div>
      <div class="slide-number">09 / 13</div>
    </div>

    <div class="grid-4" style="height: calc(100% - 130px);">
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="pill pill-orange" style="margin-bottom: 12px;">Phase 1: Institutional Close</div>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 10px;">B2B Top-Down Sales</h3>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
            Targeting College Chairmen, Facility Deans, and Master Canteen Contractors. 
            We pitch a guaranteed <strong>25% increase in daily order throughput</strong> and 100% reconciliation transparency.
          </p>
        </div>
        <div style="background: rgba(249,115,22,0.1); border-left: 3px solid #f97316; padding: 10px; font-size: 13px; color: #fdba74;">
          🎯 Metric: 1 university deal instantly unlocks 5,000–12,000 active daily users.
        </div>
      </div>

      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="pill pill-blue" style="margin-bottom: 12px;">Phase 2: Frictionless Setup</div>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 10px;">Zero-Capex Onboarding</h3>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
            Canteen workers don't need expensive proprietary touchscreens. 
            They download our Staff Portal onto existing Android phones or basic ₹6,000 tablets. A new cafeteria is fully live in <strong>under 20 minutes</strong>.
          </p>
        </div>
        <div style="background: rgba(56,189,248,0.1); border-left: 3px solid #38bdf8; padding: 10px; font-size: 13px; color: #7dd3fc;">
          ⚡ Metric: Zero onboarding friction; immediate vendor delight.
        </div>
      </div>

      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="pill pill-emerald" style="margin-bottom: 12px;">Phase 3: Viral Adoption</div>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 10px;">Campus Ambassadors</h3>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
            Recruiting student club presidents and technical leads as SnapIt Campus Champions. 
            Run orientation-week activations giving ₹50 initial wallet bonus on student registrations.
          </p>
        </div>
        <div style="background: rgba(16,185,129,0.1); border-left: 3px solid #10b981; padding: 10px; font-size: 13px; color: #6ee7b7;">
          🔥 Metric: 80%+ student body app penetration within 14 days of launch.
        </div>
      </div>

      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="pill" style="background: rgba(168,85,247,0.15); color: #c084fc; margin-bottom: 12px;">Phase 4: Ecosystem Lock</div>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 10px;">Campus Wallet Moat</h3>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
            Once students hold prepaid balances in the SnapIt Valet Card, retention exceeds 94%. 
            SnapIt becomes the campus's universal daily utility for coffee, snacks, printouts, and stationery.
          </p>
        </div>
        <div style="background: rgba(168,85,247,0.1); border-left: 3px solid #c084fc; padding: 10px; font-size: 13px; color: #e9d5ff;">
          🔒 Metric: High switching barrier and negative customer churn.
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 10: COMPETITIVE ADVANTAGE ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">Defensive Moat</div>
          <h2>Competitive Matrix: Why SnapIt Stands Alone</h2>
        </div>
      </div>
      <div class="slide-number">10 / 13</div>
    </div>

    <div style="margin-bottom: 24px;">
      <table>
        <thead>
          <tr>
            <th>Feature / Capability</th>
            <th style="color: #f97316; font-weight: 800; background: rgba(249,115,22,0.15);">SnapIt Campus OS</th>
            <th>Delivery Apps (Zomato/Swiggy)</th>
            <th>Traditional POS (Petpooja/Toast)</th>
            <th>Manual Paper Tokens</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>YOLOv8 AI Crowd Heatmaps</strong></td>
            <td style="color: #10b981; font-weight: 800;">✓ Live Zone Tracking</td>
            <td style="color: #ef4444;">✗ None</td>
            <td style="color: #ef4444;">✗ None</td>
            <td style="color: #ef4444;">✗ None</td>
          </tr>
          <tr>
            <td><strong>Dual-Station Split QR Codes</strong></td>
            <td style="color: #10b981; font-weight: 800;">✓ Separate Tea & Food</td>
            <td style="color: #ef4444;">✗ Single Ticket</td>
            <td style="color: #ef4444;">✗ Single Token Slip</td>
            <td style="color: #ef4444;">✗ Lost Paper Slips</td>
          </tr>
          <tr>
            <td><strong>Zero-Latency Campus Valet Wallet</strong></td>
            <td style="color: #10b981; font-weight: 800;">✓ Sub-second Checkout</td>
            <td style="color: #ef4444;">✗ Bank Gateway Delays</td>
            <td style="color: #ef4444;">✗ Cash / Card Only</td>
            <td style="color: #ef4444;">✗ Exact Change Issues</td>
          </tr>
          <tr>
            <td><strong>Multi-Canteen Load Balancing</strong></td>
            <td style="color: #10b981; font-weight: 800;">✓ Dynamic Dispatch</td>
            <td style="color: #ef4444;">✗ Distance Only</td>
            <td style="color: #ef4444;">✗ Siloed to 1 Register</td>
            <td style="color: #ef4444;">✗ Complete Blindness</td>
          </tr>
          <tr>
            <td><strong>Integrated jsQR Camera Scanner</strong></td>
            <td style="color: #10b981; font-weight: 800;">✓ Phone/Tablet Native</td>
            <td style="color: #ef4444;">✗ OTP Verification</td>
            <td style="color: #eab308;">~ Expensive Hardware</td>
            <td style="color: #ef4444;">✗ Manual Visual Check</td>
          </tr>
          <tr>
            <td><strong>Vendor Take-Rate Commission</strong></td>
            <td style="color: #10b981; font-weight: 800;">1.8% – 2.2% (Fair)</td>
            <td style="color: #ef4444;">22% – 30% (Predatory)</td>
            <td style="color: #eab308;">Monthly + High Hardware</td>
            <td style="color: #ef4444;">10–15% Cash Pilferage</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Moat Summary -->
    <div class="grid-3">
      <div class="card card-gradient-orange" style="padding: 16px;">
        <h4 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px;">1. Physical Infrastructure Tie-in</h4>
        <p style="font-size: 13px; color: #cbd5e1;">By integrating directly with campus CCTV layouts and physical counter spaces, we build a defensive barrier no off-campus delivery app can duplicate.</p>
      </div>
      <div class="card card-gradient-blue" style="padding: 16px;">
        <h4 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px;">2. Student Wallet Liquidity</h4>
        <p style="font-size: 13px; color: #cbd5e1;">Prepaid campus valet balances ensure students transact daily through SnapIt rather than external apps, producing unbreakable customer stickiness.</p>
      </div>
      <div class="card card-gradient-emerald" style="padding: 16px;">
        <h4 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px;">3. AI Demand Dataset</h4>
        <p style="font-size: 13px; color: #cbd5e1;">Our accumulating historical data on class timetables vs. eating trends gives us an unbeatable predictive engine for future kitchen preparation.</p>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 11: FINANCIAL PROJECTIONS ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">Growth & Profitability</div>
          <h2>3-Year Financial Forecast & Unit Economics</h2>
        </div>
      </div>
      <div class="slide-number">11 / 13</div>
    </div>

    <div class="grid-2" style="height: calc(100% - 130px);">
      <!-- Table of 3-Year Projections -->
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <h3 style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 16px;">Consolidated Growth Model (INR)</h3>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Year 1 (Pilot)</th>
                <th>Year 2 (Scale)</th>
                <th style="color: #10b981;">Year 3 (Dominance)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Partner Campuses</strong></td>
                <td>18 Campuses</td>
                <td>95 Campuses</td>
                <td style="color: #10b981; font-weight: 700;">320 Campuses</td>
              </tr>
              <tr>
                <td><strong>Daily Active Buyers</strong></td>
                <td>54,000 / day</td>
                <td>320,000 / day</td>
                <td style="color: #10b981; font-weight: 700;">1,150,000 / day</td>
              </tr>
              <tr>
                <td><strong>Annual Platform GMV</strong></td>
                <td>₹75.6 Crore</td>
                <td>₹420 Crore</td>
                <td style="color: #10b981; font-weight: 700;">₹1,480 Crore</td>
              </tr>
              <tr>
                <td><strong>SaaS Counter Revenue</strong></td>
                <td>₹29.1 Lakhs</td>
                <td>₹1.53 Crore</td>
                <td style="color: #10b981; font-weight: 700;">₹5.18 Crore</td>
              </tr>
              <tr>
                <td><strong>Commission Take-Rate</strong></td>
                <td>₹1.36 Crore</td>
                <td>₹7.56 Crore</td>
                <td style="color: #10b981; font-weight: 700;">₹26.6 Crore</td>
              </tr>
              <tr>
                <td><strong>AI Vision Suite Fees</strong></td>
                <td>₹8.1 Lakhs</td>
                <td>₹42.7 Lakhs</td>
                <td style="color: #10b981; font-weight: 700;">₹1.44 Crore</td>
              </tr>
              <tr style="background: rgba(249,115,22,0.15);">
                <td style="font-weight: 800; color: #fff;">Gross Annual Revenue</td>
                <td style="font-weight: 800; color: #f97316;">₹1.73 Crore</td>
                <td style="font-weight: 800; color: #f97316;">₹9.51 Crore</td>
                <td style="font-weight: 800; color: #10b981;">₹33.22 Crore</td>
              </tr>
              <tr>
                <td><strong>EBITDA Margin (%)</strong></td>
                <td>24%</td>
                <td>38%</td>
                <td style="color: #10b981; font-weight: 700;">47%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="font-size: 13px; color: #94a3b8; margin-top: 10px;">
          * Assumptions: 3 outlets/campus, 3,000 daily orders @ ₹70 AOV, 240 operating academic days/year.
        </div>
      </div>

      <!-- Right Column: Visual Highlights & Use of Funds -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card card-gradient-emerald">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div class="stat-val text-emerald">82%</div>
            <span class="pill pill-emerald">Software Gross Margin</span>
          </div>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.5;">
            With zero delivery fleet overhead, zero hardware capex subsidies, and efficient cloud architecture, 
            SnapIt enjoys SaaS-like gross margins from day one.
          </p>
        </div>

        <div class="card card-gradient-orange">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div class="stat-val text-highlight">4.8 Months</div>
            <span class="pill pill-orange">CAC Payback Velocity</span>
          </div>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.5;">
            Our B2B campus sales model acquires an entire student cohort in one contract, yielding an ultra-low Blended Customer Acquisition Cost (CAC) of &lt;₹18 per student.
          </p>
        </div>

        <div class="card" style="flex: 1;">
          <h4 style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 12px;">Capital Allocation Priority</h4>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #94a3b8;">Institutional B2B Sales & Field Engineering</span>
                <strong style="color: #fff;">45%</strong>
              </div>
              <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                <div style="width: 45%; height: 100%; background: #f97316;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #94a3b8;">Computer Vision R&D & Edge Device Optimizations</span>
                <strong style="color: #fff;">30%</strong>
              </div>
              <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                <div style="width: 30%; height: 100%; background: #38bdf8;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #94a3b8;">Marketing, Student Onboarding & Wallet Incentives</span>
                <strong style="color: #fff;">25%</strong>
              </div>
              <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                <div style="width: 25%; height: 100%; background: #10b981;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 12: IMPLEMENTATION ROADMAP ==================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-area">
        {f'<img src="{logo_b64}" class="brand-logo" />' if logo_b64 else ''}
        <div>
          <div class="slide-category">Execution Blueprint</div>
          <h2>Product Milestones & Technical Roadmap</h2>
        </div>
      </div>
      <div class="slide-number">12 / 13</div>
    </div>

    <div class="grid-4" style="height: calc(100% - 130px);">
      <!-- Stage 1 -->
      <div class="card card-gradient-emerald" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <span class="pill pill-emerald" style="margin-bottom: 12px;">Phase 1: Completed</span>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 12px;">Core Platform & MVP</h3>
          <ul style="list-style: none; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            <li>✓ Full React 18 + Capacitor Android build</li>
            <li>✓ FastAPI async backend with MongoDB</li>
            <li>✓ YOLOv8 vision pipeline with zone mapping</li>
            <li>✓ Dual-station split QR generation & jsQR camera scanner</li>
            <li>✓ Real-time WebSockets status push</li>
            <li>✓ Razorpay payment & Valet Card system</li>
          </ul>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #10b981; border-top: 1px solid rgba(16,185,129,0.2); padding-top: 10px;">
          STATUS: Fully Built & Functional in Workspace
        </div>
      </div>

      <!-- Stage 2 -->
      <div class="card card-gradient-orange" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <span class="pill pill-orange" style="margin-bottom: 12px;">Phase 2: Months 1–4</span>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 12px;">Live Campus Pilots</h3>
          <ul style="list-style: none; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            <li>🚀 3 University campus commercial pilots</li>
            <li>🚀 Turnkey Edge AI CCTV inference box</li>
            <li>🚀 SMS & WhatsApp "Order Ready" alerts</li>
            <li>🚀 Kitchen sound chime integration</li>
            <li>🚀 Staff tablet hardware kits</li>
            <li>🚀 Automated supplier restock alerts</li>
          </ul>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #f97316; border-top: 1px solid rgba(249,115,22,0.2); padding-top: 10px;">
          GOAL: 25,000 Daily Orders Managed
        </div>
      </div>

      <!-- Stage 3 -->
      <div class="card card-gradient-blue" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <span class="pill pill-blue" style="margin-bottom: 12px;">Phase 3: Months 5–10</span>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 12px;">AI Demand Forecasting</h3>
          <ul style="list-style: none; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            <li>🧠 ML cooking forecasts from university schedules</li>
            <li>🧠 Automated meal batching recommendation</li>
            <li>🧠 Dynamic happy-hour discounts in off-peak hours</li>
            <li>🧠 Nutrition & allergen auto-filter engine</li>
            <li>🧠 Multi-vendor food court tenant billing</li>
          </ul>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #38bdf8; border-top: 1px solid rgba(56,189,248,0.2); padding-top: 10px;">
          GOAL: 50+ Live Institutional Campuses
        </div>
      </div>

      <!-- Stage 4 -->
      <div class="card" style="border: 1px solid rgba(168,85,247,0.3); background: rgba(168,85,247,0.08); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <span class="pill" style="background: rgba(168,85,247,0.15); color: #c084fc; margin-bottom: 12px;">Phase 4: Year 2+</span>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 12px;">Enterprise Campus Hub</h3>
          <ul style="list-style: none; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            <li>🌐 Student RFID identity card tap redemption</li>
            <li>🌐 Monthly hostel mess meal plan subscriptions</li>
            <li>🌐 Autonomous thermal pickup lockers</li>
            <li>🌐 Multi-city campus franchise management</li>
            <li>🌐 Hospital and corporate park expansion</li>
          </ul>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #c084fc; border-top: 1px solid rgba(168,85,247,0.2); padding-top: 10px;">
          VISION: The Global Standard in Institutional Food OS
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 13: THE VISION & ASK ==================== -->
  <div class="slide" style="justify-content: center; align-items: center; text-align: center; position: relative;">
    <div style="position: absolute; top: 60px; left: 80px; display: flex; align-items: center; gap: 15px;">
      {f'<img src="{logo_b64}" style="height: 50px;" />' if logo_b64 else '<span style="font-size: 28px; font-weight: 900; color: #f97316;">SNAPIT</span>'}
    </div>
    <div style="position: absolute; top: 60px; right: 80px;">
      <span class="pill pill-emerald">Ready for Deployment</span>
    </div>

    <div style="max-width: 1200px;">
      <span class="pill pill-orange" style="margin-bottom: 24px; font-size: 15px; padding: 8px 24px;">The Investment & Partnership Opportunity</span>
      <h2 style="font-size: 64px; font-weight: 900; color: #ffffff; letter-spacing: -1px; margin-bottom: 20px;">
        Join Us in Revolutionizing <span class="text-highlight">Campus Dining</span>
      </h2>
      <p style="font-size: 22px; color: #94a3b8; line-height: 1.6; margin-bottom: 45px;">
        Every single day, 200 million students and enterprise professionals lose 30 minutes standing in chaotic cafeteria queues. 
        SnapIt provides the software brain that makes institutional dining fast, profitable, and intelligent.
      </p>

      <div class="grid-2" style="text-align: left; margin-bottom: 45px;">
        <div class="card card-gradient-orange" style="padding: 26px;">
          <h3 style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 10px;">For University Deans & Campus Directors</h3>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.5; margin-bottom: 16px;">
            Deploy SnapIt on your campus with <strong>zero upfront hardware investment</strong>. 
            Drastically shorten queues, protect student safety with AI crowd monitoring, and gain full financial transparency.
          </p>
          <div style="font-weight: 700; color: #f97316; font-size: 14px;">👉 Contact our Campus Partnerships Team for an immediate 14-day on-site pilot.</div>
        </div>

        <div class="card card-gradient-emerald" style="padding: 26px;">
          <h3 style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 10px;">For Venture Capital & Angel Investors</h3>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.5; margin-bottom: 16px;">
            We are opening our <strong>Seed Funding Round</strong> to accelerate institution onboarding, expand edge AI camera deployments, 
            and capture 500+ premier campuses over the next 24 months.
          </p>
          <div style="font-weight: 700; color: #10b981; font-size: 14px;">👉 Full codebase, live mobile Android APK, and financial data room available on request.</div>
        </div>
      </div>

      <!-- Footer Contact Row -->
      <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px; padding: 14px 40px; display: inline-flex; align-items: center; gap: 40px; font-size: 15px;">
        <span style="color: #fff; font-weight: 700;">🌐 snapit.campus.ai</span>
        <span style="color: #64748b;">•</span>
        <span style="color: #fff; font-weight: 700;">✉️ founders@snapit.edu</span>
        <span style="color: #64748b;">•</span>
        <span style="color: #f97316; font-weight: 700;">📱 Native Android APK Ready</span>
        <span style="color: #64748b;">•</span>
        <span style="color: #fff; font-weight: 700;">📍 Bangalore / Global</span>
      </div>
    </div>
  </div>

</body>
</html>
"""

# Save HTML file
output_html = os.path.abspath(os.path.join(os.path.dirname(__file__), "SnapIt_Pitch_Deck.html"))
output_pdf = os.path.abspath(os.path.join(os.path.dirname(__file__), "SnapIt_Institutional_Pitch_Deck.pdf"))

print(f"Writing pitch deck HTML to {output_html}...")
with open(output_html, "w", encoding="utf-8") as f:
    f.write(html_template)

# Convert to PDF using Edge Headless
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
print(f"Converting HTML to PDF via Edge Headless...")

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={output_pdf}",
    output_html
]

result = subprocess.run(cmd, capture_output=True, text=True)

if os.path.exists(output_pdf):
    file_size_kb = os.path.getsize(output_pdf) / 1024
    with open(output_pdf, "rb") as f:
        matches = re.findall(rb'/Type\s*/Page\b', f.read())
    page_count = len(matches)
    print(f"SUCCESS: Generated {output_pdf}")
    print(f"Total Pages: {page_count}")
    print(f"File Size: {file_size_kb:.2f} KB")
else:
    print(f"ERROR: Failed to generate PDF. Exit code: {result.returncode}")
    print("Stderr:", result.stderr)
