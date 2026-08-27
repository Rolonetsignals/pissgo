import React from "react";
import { ALL_BADGES } from "../utils";
import { User, Award, Flame, Calendar, Activity } from "lucide-react";

export default function ProfileTab({ activeUser, statsHistory, onLogout }) {
  // Calculate specific user stats based on recent history logs
  const userLogs = statsHistory.filter(log => log.userId === activeUser.id);
  const visitsCount = userLogs.length;
  
  const totalDurationSeconds = userLogs.reduce((sum, log) => sum + log.durationSeconds, 0);
  
  const formatDuration = (secs) => {
    if (secs === 0) return "0m";
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  return (
    <div className="profile-tab-container animate-fadeIn">
      {/* Profile Header card */}
      <div className="glass-card profile-overview">
        <div className="profile-avatar-wrapper">
          <img src={activeUser.avatar} alt={activeUser.name} className="profile-avatar" />
        </div>
        <h3 className="profile-name">{activeUser.name}</h3>
        <span className="profile-role">{activeUser.role}</span>

        <div className="profile-stats-mini">
          <div className="profile-stat-item">
            <span className="profile-stat-val">{visitsCount}</span>
            <span className="profile-stat-lbl">Visitas</span>
          </div>
          <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }}></div>
          <div className="profile-stat-item">
            <span className="profile-stat-val">{formatDuration(totalDurationSeconds)}</span>
            <span className="profile-stat-lbl">Permanencia</span>
          </div>
        </div>
      </div>

      {/* Badges / Achievements section */}
      <div className="glass-card">
        <h4 className="section-title">
          <Award size={18} className="logo-icon" /> Vitrina de Logros ({activeUser.badges.length}/5)
        </h4>
        <p className="modal-subtitle" style={{ marginBottom: "18px" }}>
          Desbloquea medallas usando la app e interactuando en la oficina.
        </p>

        <div className="badge-grid">
          {Object.keys(ALL_BADGES).map(badgeKey => {
            const badge = ALL_BADGES[badgeKey];
            const isUnlocked = activeUser.badges.includes(badgeKey);

            return (
              <div 
                key={badgeKey} 
                className={`badge-card ${isUnlocked ? "unlocked" : "locked"}`}
              >
                <span className="badge-card-status">
                  {isUnlocked ? "Obtenido" : "Bloqueado"}
                </span>
                
                <div className="badge-card-icon-wrapper">
                  {badge.icon}
                </div>
                
                <span className="badge-card-title">{badge.title}</span>
                <span className="badge-card-desc">{badge.description}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: "10px", marginBottom: "20px" }}>
        <button className="btn-secondary" onClick={onLogout} style={{ gap: "8px", borderColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
          Cerrar Sesión 🚪
        </button>
      </div>
    </div>
  );
}

