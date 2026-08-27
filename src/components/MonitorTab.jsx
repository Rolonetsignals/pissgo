import React, { useState, useEffect } from "react";
import { QrCode, Clock, LogIn, LogOut, Users, CheckCircle2, AlertCircle, Share2, Download, Smartphone } from "lucide-react";

export default function MonitorTab({ 
  bathroomState, 
  queue, 
  users, 
  activeUser, 
  elapsedSeconds, 
  onCheckIn, 
  onCheckOut, 
  onJoinQueue, 
  onLeaveQueue,
  onForceRelease
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanMessage, setScanMessage] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [customIpUrl, setCustomIpUrl] = useState("");

  useEffect(() => {
    // Detect current window URL or local IP for QR generation
    const currentOrigin = window.location.origin;
    setCustomIpUrl(`${currentOrigin}/?door=1`);
  }, []);

  const occupant = bathroomState.status === "ocupado" 
    ? users.find(u => u.id === bathroomState.occupiedBy) 
    : null;

  const isUserInside = bathroomState.occupiedBy === activeUser.id;
  const isInQueue = queue.includes(activeUser.id);
  const queueIndex = queue.indexOf(activeUser.id);

  // Format elapsed time (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Start simulated QR scanner
  const handleScanClick = () => {
    setIsScanning(true);
    setScanStep(0);
    setScanMessage("Inicializando cámara de seguridad...");
  };

  useEffect(() => {
    if (!isScanning) return;

    const timers = [
      setTimeout(() => {
        setScanStep(1);
        setScanMessage("Escaneando entorno en busca de código QR...");
      }, 1000),
      setTimeout(() => {
        setScanStep(2);
        setScanMessage("¡Código QR de la puerta del baño detectado!");
      }, 2500),
      setTimeout(() => {
        setScanStep(3);
        setScanMessage("Procesando acceso en la red Pissgo...");
      }, 3500),
      setTimeout(() => {
        setIsScanning(false);
        if (bathroomState.status === "libre") {
          onCheckIn(activeUser.id);
        } else if (isUserInside) {
          onCheckOut(activeUser.id);
        } else {
          // If another user forgot to exit and a new user scans at door
          onForceRelease(activeUser.id, "olvido");
          setTimeout(() => onCheckIn(activeUser.id), 300);
        }
      }, 4500)
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [isScanning]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(customIpUrl)}&color=0f172a&bcolor=ffffff`;

  return (
    <div className="monitor-container">
      {/* Bathroom Status Display Card */}
      <div className="glass-card status-display">
        <div className="status-circle-container">
          <div className={`status-circle-pulse ${bathroomState.status}`}></div>
          <div className={`status-circle ${bathroomState.status}`}>
            <span className="status-label">Servicio</span>
            <span className={`status-text ${bathroomState.status}`}>
              {bathroomState.status === "libre" ? "Libre" : "Ocupado"}
            </span>
            {bathroomState.status === "ocupado" && (
              <span className="bathroom-timer">{formatTime(elapsedSeconds)}</span>
            )}
          </div>
        </div>

        {bathroomState.status === "libre" ? (
          <div style={{ width: "100%" }}>
            <p className="modal-subtitle" style={{ marginBottom: "16px" }}>
              El baño está disponible. Escanea el código de la puerta al ingresar.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button className="btn-primary" onClick={handleScanClick}>
                <QrCode size={18} /> Escanear para Entrar
              </button>
              <button className="btn-secondary" onClick={() => setShowQrModal(true)} style={{ fontSize: "0.8rem", padding: "8px 12px" }}>
                <Smartphone size={15} /> Ver / Imprimir QR de la Puerta
              </button>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%" }}>
            <div className="occupant-info">
              {occupant && (
                <>
                  <img src={occupant.avatar} alt={occupant.name} className="occupant-avatar" />
                  <span className="occupant-name">{occupant.name}</span>
                  <span className="post-author-role" style={{ marginTop: "-4px" }}>
                    {occupant.role}
                  </span>
                </>
              )}
            </div>

            {/* Overtime Warning Banner if > 5 minutes */}
            {elapsedSeconds >= 300 && !isUserInside && (
              <div style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                fontSize: "0.78rem",
                padding: "10px 12px",
                borderRadius: "10px",
                margin: "14px 0 6px 0",
                textAlign: "left",
                lineHeight: "1.4"
              }}>
                🚨 <strong>¿El baño ya está desocupado?</strong><br />
                {occupant?.name} lleva más de {Math.floor(elapsedSeconds / 60)} min. Si ya salió y olvidó presionar "Salir", puedes liberar el baño ahora.
              </div>
            )}

            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {isUserInside ? (
                <button className="btn-danger" onClick={handleScanClick}>
                  <LogOut size={18} /> Escanear para Salir
                </button>
              ) : (
                <>
                  <button className="btn-primary" onClick={handleScanClick}>
                    <QrCode size={18} /> Escanear QR en la Puerta (Entrar Yo)
                  </button>

                  {isInQueue ? (
                    <button className="btn-secondary" onClick={() => onLeaveQueue(activeUser.id)}>
                      Salir de la Fila (Posición #{queueIndex + 1})
                    </button>
                  ) : (
                    <button className="btn-secondary" onClick={() => onJoinQueue(activeUser.id)}>
                      <Users size={18} /> Hacer Fila Virtual desde escritorio
                    </button>
                  )}

                  {elapsedSeconds >= 300 && (
                    <button 
                      className="btn-danger" 
                      onClick={() => onForceRelease(activeUser.id, "olvido")}
                      style={{ fontSize: "0.78rem", padding: "8px 12px", background: "rgba(239, 68, 68, 0.2)", borderColor: "rgba(239, 68, 68, 0.4)" }}
                    >
                      <AlertCircle size={14} /> Liberar Baño (El anterior olvidó salir)
                    </button>
                  )}
                </>
              )}
              <button className="btn-secondary" onClick={() => setShowQrModal(true)} style={{ fontSize: "0.8rem", padding: "8px 12px", marginTop: "4px" }}>
                <Smartphone size={15} /> Ver / Imprimir QR de la Puerta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fila Virtual Section */}
      <div className="glass-card queue-section">
        <h3 className="section-title">
          <Users size={18} className="logo-icon" /> Fila de Espera ({queue.length})
        </h3>
        
        {queue.length === 0 ? (
          <div className="queue-empty">
            No hay nadie en espera. ¡Puedes entrar sin hacer fila!
          </div>
        ) : (
          <div className="queue-list">
            {queue.map((userId, idx) => {
              const userInQueue = users.find(u => u.id === userId);
              const isCurrent = userId === activeUser.id;
              
              if (!userInQueue) return null;

              return (
                <div 
                  key={userId} 
                  className="queue-item"
                  style={isCurrent ? { borderColor: "rgba(139, 92, 246, 0.4)", background: "rgba(139, 92, 246, 0.05)" } : {}}
                >
                  <div className="queue-item-info">
                    <span className="queue-index">{idx + 1}</span>
                    <img src={userInQueue.avatar} alt={userInQueue.name} className="queue-avatar" />
                    <span className="queue-name" style={isCurrent ? { fontWeight: "bold" } : {}}>
                      {userInQueue.name} {isCurrent && "(Tú)"}
                    </span>
                  </div>
                  {idx === 0 && <span className="queue-badge">Siguiente turno</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Door QR Code Display Modal */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "380px" }}>
            <h3 className="modal-title">Código QR para la Puerta del Baño 🚪✨</h3>
            <p className="modal-subtitle">
              Pega este código QR en la entrada física del sanitario para que los usuarios escaneen desde su celular.
            </p>

            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "16px", margin: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
              <img src={qrImageUrl} alt="QR Puerta Pissgo" style={{ width: "200px", height: "200px" }} />
              <span style={{ color: "#0f172a", fontSize: "0.75rem", fontWeight: 600, marginTop: "8px", wordBreak: "break-all", textAlign: "center" }}>
                {customIpUrl}
              </span>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "10px", textAlign: "left", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              💡 <strong>¿Cómo funciona?</strong><br />
              1. El usuario escanea con la cámara de su celular.<br />
              2. <strong>Primera vez:</strong> Crea su perfil (se guarda solo una vez).<br />
              3. <strong>Siguientes veces:</strong> Su celular lo reconoce automáticamente y le permite entrar/salir sin volver a registrarse.
            </div>

            <button className="btn-secondary" onClick={() => setShowQrModal(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Simulated QR Scanner Overlay */}
      {isScanning && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {bathroomState.status === "libre" ? "Registrando Entrada" : "Registrando Salida"}
            </h3>
            <p className="modal-subtitle">Apunta la cámara al código QR de la puerta</p>
            
            <div className="qr-scanner-screen">
              <div className="qr-frame">
                <svg className="qr-code-dummy" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M3,3H9V9H3V3M5,5V7H7V5H5M15,3H21V9H15V3M17,5V7H19V5H17M3,15H9V21H3V15M5,17V19H7V17H5M15,15H17V17H15V15M17,17H19V19H17V17M19,19H21V21H19V19M17,19H19V21H17V19M19,15H21V17H19V15M15,19H17V21H15V19Z" />
                </svg>
              </div>
              <div className="qr-laser-line"></div>
            </div>

            <div className="scan-status-message">
              {scanMessage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

