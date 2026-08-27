import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const ALL_BADGES = {
  relampago: {
    id: "relampago",
    title: "El Relámpago",
    description: "Visita el baño y sal en menos de 2 minutos (120 segundos). ¡Rápido y eficiente!",
    icon: "⚡",
    color: "from-amber-400 to-yellow-600"
  },
  filosofo: {
    id: "filosofo",
    title: "El Filósofo",
    description: "Pasa más de 5 minutos (300 segundos) meditando. ¡Toda una sesión de reflexión!",
    icon: "🧠",
    color: "from-purple-400 to-indigo-600"
  },
  madrugador: {
    id: "madrugador",
    title: "El Madrugador",
    description: "Sé el primero en inaugurar el baño en el día de hoy.",
    icon: "🌅",
    color: "from-orange-400 to-pink-600"
  },
  frecuente: {
    id: "frecuente",
    title: "El Frecuente",
    description: "Realiza 3 o más visitas registradas.",
    icon: "👑",
    color: "from-cyan-400 to-blue-600"
  },
  sanitario: {
    id: "sanitario",
    title: "El Sanitario",
    description: "Envía un reporte SOS de mantenimiento para salvar el día.",
    icon: "🔧",
    color: "from-emerald-400 to-teal-600"
  }
};

// Default Demo Users for Offline / Fallback mode
export const INITIAL_DEMO_USERS = [
  {
    id: "goku_dev",
    name: "Goku",
    role: "Desarrollador Lead",
    gender: "hombre",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Goku",
    badges: ["relampago", "frecuente"],
    stats: { visits: 5, totalMinutes: 18 }
  },
  {
    id: "vegeta_des",
    name: "Vegeta",
    role: "Diseñador UI/UX",
    gender: "hombre",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Vegeta",
    badges: ["filosofo"],
    stats: { visits: 3, totalMinutes: 25 }
  },
  {
    id: "bulma_pm",
    name: "Bulma",
    role: "Product Manager",
    gender: "mujer",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Bulma",
    badges: ["madrugador", "sanitario"],
    stats: { visits: 4, totalMinutes: 12 }
  }
];

const LOCAL_STORAGE_KEY = "pissgo_local_db_v2";

export const getLocalDb = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error parsing local storage db:", e);
  }
  const defaultData = {
    users: INITIAL_DEMO_USERS,
    bathroomState: { status: "libre", occupiedBy: null, startTime: null, isFirstOfDay: false },
    queue: [],
    feedPosts: [
      {
        id: 1,
        userId: "goku_dev",
        content: "¡El baño está impecable hoy! 🧼✨ Mantengámoslo así.",
        image: null,
        likes: 2,
        likedBy: ["vegeta_des", "bulma_pm"],
        comments: [
          { userId: "vegeta_des", text: "Insektos, no olviden lavarse las manos." }
        ],
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    chatMessages: [
      {
        id: 1,
        userId: null,
        text: "👋 ¡Bienvenidos a Pissgo! Control de acceso y red social del sanitario.",
        system: true,
        timestamp: new Date().toISOString()
      }
    ],
    maintenanceLogs: [],
    statsHistory: []
  };
  saveLocalDb(defaultData);
  return defaultData;
};

export const saveLocalDb = (data) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving local storage db:", e);
  }
};

// Local Session Helpers
export const getActiveUserId = () => {
  return localStorage.getItem("pissgo_activeUserId") || null;
};

export const setActiveUserId = (userId) => {
  if (userId) {
    localStorage.setItem("pissgo_activeUserId", userId);
  } else {
    localStorage.removeItem("pissgo_activeUserId");
  }
};

// Achievement Evaluator
export const checkAndUnlockAchievements = async (userId, durationSeconds, isFirstOfDay, userObj, userHistoryCount) => {
  try {
    const newlyUnlocked = [];
    const currentBadges = userObj?.badges || [];
    const visitsCount = (userHistoryCount || 0) + 1;

    if (durationSeconds > 0 && durationSeconds < 120 && !currentBadges.includes("relampago")) {
      newlyUnlocked.push("relampago");
    }
    if (durationSeconds >= 300 && !currentBadges.includes("filosofo")) {
      newlyUnlocked.push("filosofo");
    }
    if (isFirstOfDay && !currentBadges.includes("madrugador")) {
      newlyUnlocked.push("madrugador");
    }
    if (visitsCount >= 3 && !currentBadges.includes("frecuente")) {
      newlyUnlocked.push("frecuente");
    }

    try {
      const { data: user } = await supabase.from("pissgo_users").select("*").eq("id", userId).single();
      if (user) {
        const updatedBadges = Array.from(new Set([...(user.badges || []), ...newlyUnlocked]));
        const newTotalMinutes = Math.round(((user.total_minutes || 0) * 60 + durationSeconds) / 60);
        await supabase.from("pissgo_users").update({
          badges: updatedBadges,
          visits: visitsCount,
          total_minutes: newTotalMinutes
        }).eq("id", userId);
      }
    } catch (e) {
      // Ignore Supabase error in offline mode
    }

    return newlyUnlocked.map(badgeId => ALL_BADGES[badgeId]);
  } catch (err) {
    console.error("Error evaluating achievements:", err);
    return [];
  }
};

export const unlockSpecificBadge = async (userId, badgeId, userObj) => {
  try {
    const currentBadges = userObj?.badges || [];
    if (!currentBadges.includes(badgeId)) {
      try {
        const { data: user } = await supabase.from("pissgo_users").select("badges").eq("id", userId).single();
        if (user && !user.badges.includes(badgeId)) {
          await supabase.from("pissgo_users").update({
            badges: [...user.badges, badgeId]
          }).eq("id", userId);
        }
      } catch (e) {}
      return ALL_BADGES[badgeId];
    }
    return null;
  } catch (err) {
    return null;
  }
};

