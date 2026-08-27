import React from "react";
import { AlertTriangle, Check, RotateCcw, ShieldAlert } from "lucide-react";

const SOS_TYPES = [
  {
    id: "papel",
    title: "Sin Papel Higiénico 🧻",
    description: "Crisis nacional. Alguien está atrapado o el siguiente lo estará.",
    icon: "🧻",
    chatMessage: "🚨 URGENTE: ¡Falta papel higiénico en el baño! 🧻"
  },
  {
    id: "jabon",
    title: "Sin Jabón de Manos 🧼",
    description: "Higiene primero. Falta jabón en el dispensador.",
    icon: "🧼",
    chatMessage: "🧼 AVISO: El dispensador de jabón está vacío. 🧼"
  },
  {
    id: "limpieza",
    title: "Requiere Limpieza General 🧹",
    description: "El baño necesita atención de limpieza urgente.",
    icon: "🧹",
    chatMessage: "🧹 REPORTE: El baño requiere limpieza general urgente. 🧹"
  }
];

export default function SOSTab({ 
  maintenanceLogs, 
  activeUser, 
  onTriggerSOS, 
  onResolveSOS 
}) {
  const activeAlerts = maintenanceLogs.filter(log => log.status === "activo");
  const resolvedAlerts = maintenanceLogs.filter(log => log.status === "resuelto");

  return (
    <div className="sos-tab-container">
      <div className="glass-card">
        <h3 className="section-title" style={{ color: "var(--danger)" }}>
          <ShieldAlert size={18} /> Panel de Alertas SOS
        </h3>
        <p className="modal-subtitle" style={{ marginBottom: "20px" }}>
          ¿Encontraste algún problema en el baño? Presiona un botón para notificar inmediatamente en el canal de chat y alertar a la oficina.
        </p>

        <div className="sos-grid">
          {SOS_TYPES.map(type => {
            const isActive = activeAlerts.some(alert => alert.type === type.id);
            
            return (
              <button 
                key={type.id} 
                className="sos-button"
                onClick={() => !isActive && onTriggerSOS(type.id, type.title, type.chatMessage)}
                style={isActive ? { borderColor: "var(--danger)", background: "rgba(239, 68, 68, 0.08)", cursor: "default" } : {}}
              >
                <div className="sos-button-left">
                  <div className="sos-icon-wrapper" style={isActive ? { background: "var(--danger)", color: "white" } : {}}>
                    {type.icon}
                  </div>
                  <div className="sos-details">
                    <span className="sos-button-title">{type.title}</span>
                    <span className="sos-button-desc">{type.description}</span>
                  </div>
                </div>
                
                <span className={`sos-status-badge ${isActive ? "active" : ""}`} style={isActive ? { color: "var(--danger)", background: "rgba(239, 68, 68, 0.15)" } : {}}>
                  {isActive ? "ALERTA ACTIVA" : "REPORTAR"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Alerts List with Resolution Action */}
      {activeAlerts.length > 0 && (
        <div className="glass-card sos-active-log animate-fadeIn">
          <h4 className="section-title">
            <AlertTriangle size={18} style={{ color: "var(--warning)" }} /> Reportes Activos ({activeAlerts.length})
          </h4>
          
          <div className="maintenance-log-list">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="maintenance-log-item">
                <div className="maintenance-log-left">
                  <span className="maintenance-log-title">{alert.title}</span>
                  <span className="maintenance-log-time">
                    por {alert.reportedByName}
                  </span>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ width: "auto", padding: "6px 12px", fontSize: "0.75rem", borderRadius: "8px" }}
                  onClick={() => onResolveSOS(alert.id, alert.title)}
                >
                  <Check size={12} /> Resolver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Logs List */}
      {resolvedAlerts.length > 0 && (
        <div className="glass-card animate-fadeIn">
          <h4 className="section-title" style={{ color: "var(--text-muted)" }}>
            Historial de Soluciones ({resolvedAlerts.length})
          </h4>
          
          <div className="maintenance-log-list">
            {resolvedAlerts.map(alert => (
              <div 
                key={alert.id} 
                className="maintenance-log-item"
                style={{ background: "rgba(16, 185, 129, 0.03)", borderColor: "rgba(16, 185, 129, 0.1)" }}
              >
                <div className="maintenance-log-left" style={{ color: "var(--text-muted)" }}>
                  <span className="maintenance-log-title" style={{ textDecoration: "line-through" }}>{alert.title}</span>
                  <span className="maintenance-log-time">
                    Resuelto por {alert.resolvedByName}
                  </span>
                </div>
                <span className="queue-badge" style={{ background: "var(--success-glow)", color: "var(--success)" }}>
                  Solucionado
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
