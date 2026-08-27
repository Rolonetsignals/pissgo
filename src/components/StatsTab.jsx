import React, { useState } from "react";
import { BarChart3, Award, History, Clock, Printer, QrCode } from "lucide-react";
import { ALL_BADGES } from "../utils";

export default function StatsTab({ statsHistory, users }) {
  const [metricTab, setMetricTab] = useState("visits"); // "visits" | "duration"
  const [appUrl, setAppUrl] = useState(() => {
    // Default to the current URL of the page
    return window.location.href;
  });

  const handlePrintDoorSign = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Cartel de Puerta - Pissgo</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              text-align: center;
              padding: 50px;
              color: #121422;
              background: #fafafa;
            }
            .card {
              border: 6px solid #8b5cf6;
              border-radius: 30px;
              padding: 50px 40px;
              max-width: 550px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 20px 40px rgba(139, 92, 246, 0.1);
            }
            h1 {
              font-size: 3.5rem;
              margin: 0 0 10px 0;
              color: #8b5cf6;
              font-weight: 800;
            }
            .badge {
              display: inline-block;
              background: #8b5cf6;
              color: white;
              padding: 6px 16px;
              font-size: 0.95rem;
              font-weight: 700;
              border-radius: 30px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 25px;
            }
            p {
              font-size: 1.25rem;
              color: #4b5563;
              margin: 0 auto 35px auto;
              line-height: 1.6;
              max-width: 450px;
            }
            .qr-container {
              background: white;
              display: inline-block;
              padding: 15px;
              border-radius: 20px;
              box-shadow: 0 8px 24px rgba(0,0,0,0.06);
              border: 2px solid #f3f4f6;
              margin-bottom: 35px;
            }
            .footer {
              font-weight: 700;
              font-size: 1.35rem;
              color: #06b6d4;
              margin-top: 10px;
            }
            .sub-footer {
              font-size: 0.9rem;
              color: #9ca3af;
              margin-top: 25px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Pissgo 🚽✨</h1>
            <div class="badge">Zona del Trono</div>
            <p><strong>¿Vas a entrar o salir?</strong><br>Escanea este código QR con la app web para actualizar tu estado en tiempo real y coordinar con la oficina.</p>
            <div class="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=pissgo-bathroom-door" width="280" height="280" alt="QR Baño" />
            </div>
            <div class="footer">¡Respeta el turno y gana medallas! ⚡👑</div>
            <div class="sub-footer">Desarrollado para romper el aburrimiento con estilo.</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAppSign = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Instalar Pissgo</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              text-align: center;
              padding: 50px;
              color: #121422;
              background: #fafafa;
            }
            .card {
              border: 6px solid #06b6d4;
              border-radius: 30px;
              padding: 50px 40px;
              max-width: 550px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 20px 40px rgba(6, 182, 212, 0.1);
            }
            h1 {
              font-size: 3rem;
              margin: 0 0 10px 0;
              color: #06b6d4;
              font-weight: 800;
            }
            .badge {
              display: inline-block;
              background: #06b6d4;
              color: white;
              padding: 6px 16px;
              font-size: 0.95rem;
              font-weight: 700;
              border-radius: 30px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 25px;
            }
            p {
              font-size: 1.25rem;
              color: #4b5563;
              margin: 0 auto 35px auto;
              line-height: 1.6;
              max-width: 450px;
            }
            .qr-container {
              background: white;
              display: inline-block;
              padding: 15px;
              border-radius: 20px;
              box-shadow: 0 8px 24px rgba(0,0,0,0.06);
              border: 2px solid #f3f4f6;
              margin-bottom: 20px;
            }
            .url-text {
              font-family: monospace;
              background: #f3f4f6;
              color: #374151;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 700;
              display: inline-block;
              word-break: break-all;
              max-width: 400px;
              margin-bottom: 30px;
              border: 1px dashed #d1d5db;
            }
            .footer {
              font-weight: 700;
              font-size: 1.35rem;
              color: #8b5cf6;
              margin-top: 10px;
            }
            .sub-footer {
              font-size: 0.9rem;
              color: #9ca3af;
              margin-top: 25px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>¡Pissgo está Online! 📱✨</h1>
            <div class="badge">App de la Oficina</div>
            <p>Escanea este código QR con la cámara de tu celular para abrir la aplicación web, registrar tu perfil y chatear con la fila.</p>
            <div class="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl)}" width="280" height="280" alt="QR App" />
            </div>
            <div>
              <span class="url-text">${appUrl}</span>
            </div>
            <div class="footer">¡Únete al Social Lounge del Trono! 💬👑</div>
            <div class="sub-footer">Reporta SOS, publica memes y haz fila virtual.</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 1. Calculate General Stats
  const totalVisitsCount = statsHistory.length;
  
  const avgDurationSeconds = totalVisitsCount > 0 
    ? Math.round(statsHistory.reduce((sum, h) => sum + h.durationSeconds, 0) / totalVisitsCount)
    : 0;
  
  const formatDuration = (secs) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  // Find Peak Hour
  const getPeakHour = () => {
    if (statsHistory.length === 0) return "N/A";
    const hours = statsHistory.map(h => {
      const enter = new Date(h.enterTime);
      return enter.getHours();
    });
    const counts = {};
    let maxHour = 8;
    let maxCount = 0;
    hours.forEach(hr => {
      counts[hr] = (counts[hr] || 0) + 1;
      if (counts[hr] > maxCount) {
        maxCount = counts[hr];
        maxHour = hr;
      }
    });
    return `${maxHour}:00 - ${maxHour + 1}:00`;
  };

  // 2. Compile Peak Hours Data for SVG Chart
  // We'll group visits by hours: 8, 9, 10, 11, 12, 13, 14, 15, 16
  const hoursList = [8, 9, 10, 11, 12, 13, 14, 15, 16];
  const chartData = hoursList.map(h => {
    const count = statsHistory.filter(log => {
      const logHr = new Date(log.enterTime).getHours();
      return logHr === h;
    }).length;
    return { hour: `${h}h`, count };
  });

  const maxChartCount = Math.max(...chartData.map(d => d.count), 1);

  // 3. Compile Leaderboard
  // Sort users based on visits or total minutes
  const leaderboardUsers = [...users].map(user => {
    // calculate actual stats from history
    const userHistory = statsHistory.filter(h => h.userId === user.id);
    const visits = userHistory.length;
    const duration = userHistory.reduce((sum, h) => sum + h.durationSeconds, 0);
    return {
      ...user,
      visitsCount: visits,
      durationSeconds: duration
    };
  }).sort((a, b) => {
    if (metricTab === "visits") {
      return b.visitsCount - a.visitsCount;
    } else {
      return b.durationSeconds - a.durationSeconds;
    }
  });

  return (
    <div className="stats-tab-container animate-fadeIn">
      {/* Overview Cards */}
      <div className="stats-summary-grid">
        <div className="stat-summary-card">
          <span className="stat-summary-value">{totalVisitsCount}</span>
          <span className="stat-summary-label">Visitas Totales</span>
        </div>
        <div className="stat-summary-card">
          <span className="stat-summary-value">{formatDuration(avgDurationSeconds)}</span>
          <span className="stat-summary-label">Tiempo Promedio</span>
        </div>
        <div className="stat-summary-card" style={{ gridColumn: "span 2" }}>
          <span className="stat-summary-value" style={{ fontSize: "1.25rem" }}>{getPeakHour()}</span>
          <span className="stat-summary-label">Hora Pico en la Oficina</span>
        </div>
      </div>

      {/* Peak Hours SVG Chart Card */}
      <div className="glass-card">
        <h4 className="section-title">
          <BarChart3 size={18} className="logo-icon" /> Tránsito por Hora (Visitas)
        </h4>
        <p className="modal-subtitle">Monitoreo de horas de mayor congestión en el sanitario.</p>
        
        {/* Custom SVG Bar Chart */}
        <div className="chart-container-custom">
          <svg width="100%" height="220" viewBox="0 0 400 220" style={{ background: "transparent" }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--secondary)" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const yVal = 20 + ratio * 150;
              return (
                <g key={index}>
                  <line x1="30" y1={yVal} x2="380" y2={yVal} className="svg-chart-grid-line" />
                </g>
              );
            })}

            {/* Render Bars */}
            {chartData.map((d, idx) => {
              const barWidth = 24;
              const gap = 12;
              const xPos = 40 + idx * (barWidth + gap);
              
              // Calculate scaled height
              const barHeight = (d.count / maxChartCount) * 140;
              const yPos = 170 - barHeight;

              return (
                <g key={idx}>
                  {/* Tooltip text on top of bar */}
                  {d.count > 0 && (
                    <text x={xPos + barWidth / 2} y={yPos - 6} className="svg-chart-text" style={{ fill: "var(--text-main)", fontSize: "9px" }}>
                      {d.count}
                    </text>
                  )}
                  {/* The bar */}
                  <rect 
                    x={xPos} 
                    y={yPos} 
                    width={barWidth} 
                    height={barHeight} 
                    className="svg-chart-bar" 
                  />
                  {/* Hour Label */}
                  <text x={xPos + barWidth / 2} y="192" className="svg-chart-text">
                    {d.hour}
                  </text>
                </g>
              );
            })}

            {/* Base axis line */}
            <line x1="30" y1="170" x2="380" y2="170" className="svg-chart-axis" />
          </svg>
        </div>
      </div>

      {/* Leaderboard Card */}
      <div className="glass-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h4 className="section-title" style={{ marginBottom: 0 }}>
            <Award size={18} className="logo-icon" /> Tabla de Líderes
          </h4>
          <div style={{ display: "flex", gap: "6px" }}>
            <button 
              className={`toggle-tab-btn ${metricTab === "visits" ? "active" : ""}`}
              onClick={() => setMetricTab("visits")}
              style={{ padding: "4px 8px", fontSize: "0.65rem", borderRadius: "6px" }}
            >
              Visitas
            </button>
            <button 
              className={`toggle-tab-btn ${metricTab === "duration" ? "active" : ""}`}
              onClick={() => setMetricTab("duration")}
              style={{ padding: "4px 8px", fontSize: "0.65rem", borderRadius: "6px" }}
            >
              Tiempo
            </button>
          </div>
        </div>

        <div className="leaderboard-list">
          {leaderboardUsers.map((user, idx) => (
            <div key={user.id} className="leaderboard-item">
              <div className="leaderboard-left">
                <span className={`leaderboard-rank rank-${idx + 1}`}>{idx + 1}</span>
                <img src={user.avatar} alt={user.name} className="leaderboard-avatar" />
                <div className="leaderboard-info">
                  <span className="leaderboard-name">{user.name}</span>
                  <span className="leaderboard-title">{user.role}</span>
                </div>
              </div>

              <div className="leaderboard-right">
                <span className="leaderboard-score">
                  {metricTab === "visits" ? `${user.visitsCount} veces` : formatDuration(user.durationSeconds)}
                </span>
                <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
                  {user.badges.slice(0, 3).map(bid => (
                    <span key={bid} style={{ fontSize: "0.75rem" }} title={ALL_BADGES[bid]?.title}>
                      {ALL_BADGES[bid]?.icon}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visit Logs History */}
      <div className="glass-card">
        <h4 className="section-title">
          <History size={18} className="logo-icon" /> Registro Reciente
        </h4>
        <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[...statsHistory].reverse().map((log) => {
            const user = users.find(u => u.id === log.userId);
            if (!user) return null;

            return (
              <div key={log.id} className="queue-item" style={{ fontSize: "0.8rem", padding: "8px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src={user.avatar} alt={user.name} style={{ width: "22px", height: "22px", borderRadius: "50%" }} />
                  <span>{user.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-muted)" }}>
                  <span>{new Date(log.enterTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ color: "var(--secondary)", fontWeight: "bold" }}>{formatDuration(log.durationSeconds)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kit de Impresión Admin Card */}
      <div className="glass-card animate-fadeIn">
        <h4 className="section-title" style={{ color: "var(--secondary)" }}>
          <Printer size={18} className="logo-icon" /> Kit de Impresión para la Oficina
        </h4>
        <p className="modal-subtitle">Genera e imprime los carteles físicos para colgar en el baño y en la oficina.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "15px" }}>
          
          {/* Card 1: QR de la Puerta */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)", padding: "16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ background: "white", padding: "6px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=pissgo-bathroom-door" width="50" height="50" alt="QR Baño" />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontWeight: "700", fontSize: "0.85rem" }}>Cartel de Puerta (QR de Entrada)</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pégalo afuera del baño para que la gente escanee e ingrese.</span>
            </div>
            <button className="btn-primary" onClick={handlePrintDoorSign} style={{ width: "auto", padding: "6px 12px", fontSize: "0.75rem", borderRadius: "8px" }}>
              <Printer size={12} /> Imprimir
            </button>
          </div>

          {/* Card 2: QR de Acceso a la App */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ background: "white", padding: "6px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(appUrl)}`} width="50" height="50" alt="QR App" />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontWeight: "700", fontSize: "0.85rem" }}>Cartel de Acceso a la App</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Folleto informativo con el QR para abrir la app en los celulares.</span>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Enlace donde se hospedará la App (URL):</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  className="form-input" 
                  value={appUrl} 
                  onChange={(e) => setAppUrl(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", borderRadius: "8px" }}
                />
                <button className="btn-secondary" onClick={handlePrintAppSign} style={{ width: "auto", padding: "8px 12px", fontSize: "0.75rem", borderRadius: "8px", flexShrink: 0 }}>
                  <Printer size={12} style={{ marginRight: "4px" }} /> Imprimir
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
