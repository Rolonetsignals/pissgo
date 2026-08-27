import React, { useState, useRef, useEffect } from "react";
import { Sparkles, UserPlus, ArrowRight, Camera } from "lucide-react";

const EMOJI_AVATARS_CONFIG = [
  { emoji: "🐼", colors: ["#6b7280", "#374151"] }, // Panda (Gris)
  { emoji: "🦊", colors: ["#f97316", "#c2410c"] }, // Zorro (Naranja)
  { emoji: "🐱", colors: ["#fcd34d", "#d97706"] }, // Gato (Amarillo)
  { emoji: "🐶", colors: ["#ffedd5", "#ea580c"] }, // Perro (Crema)
  { emoji: "🦁", colors: ["#fef08a", "#ca8a04"] }, // León (Dorado)
  { emoji: "🐨", colors: ["#cbd5e1", "#475569"] }, // Koala (Pizarra)
  { emoji: "🐵", colors: ["#d97706", "#78350f"] }, // Mono (Marrón)
  { emoji: "🐸", colors: ["#4ade80", "#16a34a"] }, // Rana (Verde)
  { emoji: "🦄", colors: ["#fbcfe8", "#db2777"] }, // Unicornio (Rosa)
  { emoji: "🐧", colors: ["#38bdf8", "#0369a1"] }  // Pingüino (Azul)
];

// Helper to generate a styled base64 image from an emoji
const generateEmojiAvatarUrl = (emoji, colors) => {
  const canvas = document.createElement("canvas");
  canvas.width = 150;
  canvas.height = 150;
  const ctx = canvas.getContext("2d");

  // Create radial gradient background
  const grad = ctx.createLinearGradient(0, 0, 150, 150);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  ctx.fillStyle = grad;
  
  ctx.beginPath();
  ctx.arc(75, 75, 75, 0, Math.PI * 2);
  ctx.fill();

  // Draw centered emoji
  ctx.font = "80px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 75, 82);

  return canvas.toDataURL("image/png");
};

export default function LoginScreen({ users, onLogin, onRegister }) {
  const [mode, setMode] = useState("select"); // "select" | "create"
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("hombre"); // "hombre" | "mujer" | "otro"
  
  // Pre-generate standard animal avatar URLs
  const [avatarUrls] = useState(() => 
    EMOJI_AVATARS_CONFIG.map(cfg => ({
      emoji: cfg.emoji,
      url: generateEmojiAvatarUrl(cfg.emoji, cfg.colors)
    }))
  );

  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [customAvatar, setCustomAvatar] = useState(null);
  
  const fileInputRef = useRef(null);

  // Set default selected avatar once URLs are generated
  useEffect(() => {
    if (avatarUrls.length > 0) {
      setSelectedAvatar(avatarUrls[0].url);
    }
  }, [avatarUrls]);

  const handleCreateProfile = (e) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    // Create unique id
    const newUserId = name.toLowerCase().trim().replace(/[^a-z0-9]/g, "_") + "_" + Math.floor(Math.random() * 1000);
    const newUser = {
      id: newUserId,
      name: name.trim(),
      role: role.trim(),
      gender: gender,
      avatar: customAvatar || selectedAvatar,
      badges: [],
      stats: { visits: 0, totalMinutes: 0 }
    };

    onRegister(newUser);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setCustomAvatar(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="login-screen-container animate-fadeIn">
      <div className="login-card glass-card">
        <div className="login-header">
          <span className="login-logo">Pissgo 🚽✨</span>
          <p className="login-subtitle">Control de Acceso y Red Social del Sanitario</p>
        </div>

        {mode === "select" ? (
          <div className="login-body">
            <h4 className="login-section-title">Elige tu Perfil para Entrar</h4>
            <p className="login-desc" style={{ marginBottom: "16px" }}>
              Selecciona uno de los perfiles de la oficina para ingresar:
            </p>

            <div className="login-profiles-grid">
              {users.map(u => (
                <div 
                  key={u.id}
                  className="login-profile-item"
                  onClick={() => onLogin(u.id)}
                >
                  <img src={u.avatar} alt={u.name} className="login-profile-avatar" />
                  <div className="login-profile-info">
                    <span className="login-profile-name">
                      {u.name} {u.gender === "hombre" ? "♂️" : u.gender === "mujer" ? "♀️" : u.gender === "otro" ? "❓" : ""}
                    </span>
                    <span className="login-profile-role">{u.role}</span>
                  </div>
                  <ArrowRight size={14} className="login-arrow" />
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
              <button 
                className="btn-secondary" 
                onClick={() => setMode("create")}
                style={{ fontSize: "0.85rem" }}
              >
                <UserPlus size={16} /> Crear Nuevo Perfil Personalizado
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateProfile} className="login-body">
            <h4 className="login-section-title">Crear Nuevo Perfil</h4>
            <p className="login-desc" style={{ marginBottom: "16px" }}>
              Regístrate en la app web de tu oficina para empezar a usar Pissgo:
            </p>

            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: "12px" }}>
              <label className="form-label">Puesto / Cargo de Trabajo</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. Soporte Técnico"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>

            {/* Sexo / Género Selector */}
            <div className="form-group" style={{ marginTop: "14px" }}>
              <label className="form-label">¿Cuál es tu Sexo / Género?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "6px" }}>
                <button
                  type="button"
                  className={`btn-secondary ${gender === "hombre" ? "selected" : ""}`}
                  onClick={() => setGender("hombre")}
                  style={{
                    padding: "10px 6px",
                    fontSize: "0.82rem",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    borderColor: gender === "hombre" ? "var(--primary)" : "var(--border-glass)",
                    background: gender === "hombre" ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.04)",
                    color: gender === "hombre" ? "#60a5fa" : "var(--text-secondary)"
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>♂️</span> Hombre
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${gender === "mujer" ? "selected" : ""}`}
                  onClick={() => setGender("mujer")}
                  style={{
                    padding: "10px 6px",
                    fontSize: "0.82rem",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    borderColor: gender === "mujer" ? "var(--primary)" : "var(--border-glass)",
                    background: gender === "mujer" ? "rgba(236, 72, 153, 0.2)" : "rgba(255,255,255,0.04)",
                    color: gender === "mujer" ? "#f472b6" : "var(--text-secondary)"
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>♀️</span> Mujer
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${gender === "otro" ? "selected" : ""}`}
                  onClick={() => setGender("otro")}
                  style={{
                    padding: "10px 6px",
                    fontSize: "0.82rem",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    borderColor: gender === "otro" ? "var(--primary)" : "var(--border-glass)",
                    background: gender === "otro" ? "rgba(168, 85, 247, 0.2)" : "rgba(255,255,255,0.04)",
                    color: gender === "otro" ? "#c084fc" : "var(--text-secondary)"
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>❓</span> Tercer Sexo
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label className="form-label">Elige tu Avatar (Animales)</label>
              <div className="avatar-picker-grid" style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "12px" }}>
                {avatarUrls.map((av, idx) => (
                  <img 
                    key={idx} 
                    src={av.url} 
                    alt={`Animal ${av.emoji}`} 
                    className={`avatar-picker-item ${!customAvatar && selectedAvatar === av.url ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedAvatar(av.url);
                      setCustomAvatar(null);
                    }}
                    style={{ width: "42px", height: "42px" }}
                  />
                ))}
              </div>

              {/* Upload Custom Image Option */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: "none" }} 
              />
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  type="button" 
                  className={`btn-secondary ${customAvatar ? "selected" : ""}`}
                  onClick={() => fileInputRef.current.click()}
                  style={{ flex: 1, padding: "8px 12px", fontSize: "0.75rem", borderRadius: "8px", gap: "6px", borderColor: customAvatar ? "var(--primary)" : "var(--border-glass)" }}
                >
                  <Camera size={14} /> {customAvatar ? "Cambiar Foto 📷" : "Subir mi Foto 📷"}
                </button>
                {customAvatar && (
                  <img 
                    src={customAvatar} 
                    alt="Custom Upload" 
                    className="avatar-picker-item selected" 
                    style={{ margin: 0, width: "42px", height: "42px" }}
                  />
                )}
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setMode("select")}
                style={{ flex: 1, fontSize: "0.85rem" }}
              >
                Atrás
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                style={{ flex: 1, fontSize: "0.85rem" }}
              >
                <Sparkles size={16} /> Registrar y Entrar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
