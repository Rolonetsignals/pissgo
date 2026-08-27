import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  QrCode, 
  MessageSquare, 
  ShieldAlert, 
  BarChart3, 
  User, 
  Sparkles,
  WifiOff,
  Cloud
} from "lucide-react";

import { 
  supabase, 
  ALL_BADGES, 
  INITIAL_DEMO_USERS,
  getLocalDb,
  saveLocalDb,
  getActiveUserId, 
  setActiveUserId,
  checkAndUnlockAchievements,
  unlockSpecificBadge
} from "./utils";

import MonitorTab from "./components/MonitorTab";
import SocialTab from "./components/SocialTab";
import SOSTab from "./components/SOSTab";
import StatsTab from "./components/StatsTab";
import ProfileTab from "./components/ProfileTab";
import LoginScreen from "./components/LoginScreen";

export default function App() {
  // Database States
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserIdState] = useState(() => getActiveUserId());
  const [bathroomState, setBathroomState] = useState({ status: "libre", occupiedBy: null, startTime: null });
  const [queue, setQueue] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [statsHistory, setStatsHistory] = useState([]);
  
  // App UI & Offline States
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState("monitor");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [toast, setToast] = useState({ visible: false, badge: null, userName: "" });

  const activeUser = users.find(u => u.id === activeUserId) || null;

  // Sync Local DB Helper
  const syncOfflineState = (updatedState) => {
    setIsOfflineMode(true);
    const currentLocal = getLocalDb();
    const newLocal = {
      users: updatedState.users !== undefined ? updatedState.users : users,
      bathroomState: updatedState.bathroomState !== undefined ? updatedState.bathroomState : bathroomState,
      queue: updatedState.queue !== undefined ? updatedState.queue : queue,
      feedPosts: updatedState.feedPosts !== undefined ? updatedState.feedPosts : feedPosts,
      chatMessages: updatedState.chatMessages !== undefined ? updatedState.chatMessages : chatMessages,
      maintenanceLogs: updatedState.maintenanceLogs !== undefined ? updatedState.maintenanceLogs : maintenanceLogs,
      statsHistory: updatedState.statsHistory !== undefined ? updatedState.statsHistory : statsHistory
    };
    saveLocalDb(newLocal);
  };

  // 1. Fetch Initial Data (Cloud Supabase with automatic Local DB Fallback)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Timeout to fallback gracefully if Supabase URL is unreachable
        const fetchPromise = Promise.all([
          supabase.from("pissgo_users").select("*"),
          supabase.from("pissgo_bathroom_state").select("*").eq("id", 1).single(),
          supabase.from("pissgo_queue").select("*").order("created_at", { ascending: true }),
          supabase.from("pissgo_feed_posts").select("*").order("id", { ascending: false }),
          supabase.from("pissgo_chat_messages").select("*").order("id", { ascending: true }),
          supabase.from("pissgo_maintenance_logs").select("*").order("id", { ascending: false }),
          supabase.from("pissgo_stats_history").select("*").order("id", { ascending: true })
        ]);

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Supabase connection timeout")), 2500)
        );

        const [usersRes, bStateRes, qRes, postsRes, chatRes, logsRes, histRes] = await Promise.race([fetchPromise, timeoutPromise]);

        if (usersRes.error) throw usersRes.error;

        let fetchedUsers = (usersRes.data || []).map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          avatar: u.avatar,
          badges: u.badges || [],
          stats: { visits: u.visits, totalMinutes: u.total_minutes }
        }));

        if (fetchedUsers.length === 0) {
          fetchedUsers = INITIAL_DEMO_USERS;
        }

        setUsers(fetchedUsers);
        setIsOfflineMode(false);

        if (bStateRes.data) {
          setBathroomState({
            status: bStateRes.data.status,
            occupiedBy: bStateRes.data.occupied_by,
            startTime: bStateRes.data.start_time,
            isFirstOfDay: bStateRes.data.is_first_of_day
          });
        }

        setQueue((qRes.data || []).map(q => q.user_id));

        setFeedPosts((postsRes.data || []).map(p => ({
          id: p.id,
          userId: p.user_id,
          content: p.content,
          image: p.image,
          likes: p.likes,
          likedBy: p.liked_by || [],
          comments: p.comments || [],
          timestamp: p.created_at
        })));

        setChatMessages((chatRes.data || []).map(c => ({
          id: c.id,
          userId: c.user_id,
          text: c.text,
          system: c.system,
          status: c.status,
          timestamp: c.created_at
        })));

        setMaintenanceLogs((logsRes.data || []).map(l => ({
          id: l.id,
          type: l.type,
          title: l.title,
          status: l.status,
          reportedBy: l.reported_by,
          reportedByName: l.reported_by_name,
          resolvedBy: l.resolved_by,
          resolvedByName: l.resolved_by_name,
          timestamp: l.created_at
        })));

        setStatsHistory((histRes.data || []).map(h => ({
          id: h.id,
          userId: h.user_id,
          enterTime: h.enter_time,
          exitTime: h.exit_time,
          durationSeconds: h.duration_seconds
        })));

      } catch (err) {
        console.warn("Supabase no disponible o error de red. Usando Modo Local (Offline):", err.message);
        setIsOfflineMode(true);
        const local = getLocalDb();
        setUsers(local.users);
        setBathroomState(local.bathroomState);
        setQueue(local.queue);
        setFeedPosts(local.feedPosts);
        setChatMessages(local.chatMessages);
        setMaintenanceLogs(local.maintenanceLogs);
        setStatsHistory(local.statsHistory);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // 2. Realtime Subscriptions (Only active when online)
  useEffect(() => {
    if (isOfflineMode) return;

    let channel;
    try {
      channel = supabase
        .channel("pissgo-realtime-sync")
        .on("postgres_changes", { event: "*", schema: "public", table: "pissgo_bathroom_state" }, payload => {
          const data = payload.new;
          if (data) {
            setBathroomState({
              status: data.status,
              occupiedBy: data.occupied_by,
              startTime: data.start_time,
              isFirstOfDay: data.is_first_of_day
            });
          }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "pissgo_queue" }, async () => {
          try {
            const { data } = await supabase.from("pissgo_queue").select("user_id").order("created_at", { ascending: true });
            setQueue((data || []).map(q => q.user_id));
          } catch(e) {}
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "pissgo_users" }, payload => {
          const u = payload.new;
          if (payload.eventType === "INSERT") {
            setUsers(prev => [...prev, {
              id: u.id,
              name: u.name,
              role: u.role,
              avatar: u.avatar,
              badges: u.badges || [],
              stats: { visits: u.visits, totalMinutes: u.total_minutes }
            }]);
          } else if (payload.eventType === "UPDATE") {
            setUsers(prev => prev.map(usr => usr.id === u.id ? {
              id: u.id,
              name: u.name,
              role: u.role,
              avatar: u.avatar,
              badges: u.badges || [],
              stats: { visits: u.visits, totalMinutes: u.total_minutes }
            } : usr));
          }
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "pissgo_chat_messages" }, payload => {
          const c = payload.new;
          setChatMessages(prev => [...prev, {
            id: c.id,
            userId: c.user_id,
            text: c.text,
            system: c.system,
            status: c.status,
            timestamp: c.created_at
          }]);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "pissgo_feed_posts" }, payload => {
          const p = payload.new;
          if (payload.eventType === "INSERT") {
            setFeedPosts(prev => [{
              id: p.id,
              userId: p.user_id,
              content: p.content,
              image: p.image,
              likes: p.likes,
              likedBy: p.liked_by || [],
              comments: p.comments || [],
              timestamp: p.created_at
            }, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setFeedPosts(prev => prev.map(post => post.id === p.id ? {
              id: p.id,
              userId: p.user_id,
              content: p.content,
              image: p.image,
              likes: p.likes,
              likedBy: p.liked_by || [],
              comments: p.comments || [],
              timestamp: p.created_at
            } : post));
          }
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "pissgo_maintenance_logs" }, payload => {
          const l = payload.new;
          if (payload.eventType === "INSERT") {
            setMaintenanceLogs(prev => [{
              id: l.id,
              type: l.type,
              title: l.title,
              status: l.status,
              reportedBy: l.reported_by,
              reportedByName: l.reported_by_name,
              resolvedBy: l.resolved_by,
              resolvedByName: l.resolved_by_name,
              timestamp: l.created_at
            }, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setMaintenanceLogs(prev => prev.map(log => log.id === l.id ? {
              id: l.id,
              type: l.type,
              title: l.title,
              status: l.status,
              reportedBy: l.reported_by,
              reportedByName: l.reported_by_name,
              resolvedBy: l.resolved_by,
              resolvedByName: l.resolved_by_name,
              timestamp: l.created_at
            } : log));
          }
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "pissgo_stats_history" }, payload => {
          const h = payload.new;
          setStatsHistory(prev => [...prev, {
            id: h.id,
            userId: h.user_id,
            enterTime: h.enter_time,
            exitTime: h.exit_time,
            durationSeconds: h.duration_seconds
          }]);
        })
        .subscribe();
    } catch(e) {}

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [isOfflineMode]);

  // 3. Tick active bathroom timer
  useEffect(() => {
    let interval = null;
    if (bathroomState.status === "ocupado" && bathroomState.startTime) {
      const calculateElapsed = () => {
        const start = new Date(bathroomState.startTime).getTime();
        const diff = Math.floor((Date.now() - start) / 1000);
        setElapsedSeconds(diff >= 0 ? diff : 0);
      };

      calculateElapsed();
      interval = setInterval(calculateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bathroomState]);

  // Switch Active User / Login
  const handleUserChange = (userId) => {
    setActiveUserIdState(userId);
    setActiveUserId(userId);
  };

  // Register new custom profile
  const handleRegisterUser = async (newUser) => {
    const userToSave = {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      gender: newUser.gender || "hombre",
      avatar: newUser.avatar,
      badges: [],
      stats: { visits: 0, totalMinutes: 0 }
    };

    const nextUsers = [...users, userToSave];
    setUsers(nextUsers);

    if (isOfflineMode) {
      syncOfflineState({ users: nextUsers });
    } else {
      try {
        const { error } = await supabase.from("pissgo_users").insert({
          id: newUser.id,
          name: newUser.name,
          role: newUser.role,
          gender: newUser.gender || "hombre",
          avatar: newUser.avatar,
          badges: [],
          visits: 0,
          total_minutes: 0
        });
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase error, saving locally:", err.message);
        syncOfflineState({ users: nextUsers });
      }
    }

    handleUserChange(newUser.id);
  };

  // Logout active profile
  const handleLogout = () => {
    setActiveUserIdState(null);
    setActiveUserId(null);
  };

  // Helper: Format elapsed time text
  const formatTimeText = (secs) => {
    if (secs < 60) return `${secs} segundos`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  // Action: Check-In
  const handleCheckIn = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const today = new Date().toDateString();
    const hasVisitsToday = statsHistory.some(log => new Date(log.enterTime).toDateString() === today);
    const isFirstOfDay = !hasVisitsToday;

    const newBathroomState = {
      status: "ocupado",
      occupiedBy: userId,
      startTime: new Date().toISOString(),
      isFirstOfDay: isFirstOfDay
    };

    const newQueue = queue.filter(qId => qId !== userId);
    const newChatMsg = {
      id: Date.now(),
      userId: null,
      text: `🚪 ${user.name} ha ingresado al sanitario.`,
      system: true,
      timestamp: new Date().toISOString()
    };
    const nextChat = [...chatMessages, newChatMsg];

    setBathroomState(newBathroomState);
    setQueue(newQueue);
    setChatMessages(nextChat);

    if (isOfflineMode) {
      syncOfflineState({
        bathroomState: newBathroomState,
        queue: newQueue,
        chatMessages: nextChat
      });
    } else {
      try {
        await supabase.from("pissgo_bathroom_state").update({
          status: "ocupado",
          occupied_by: userId,
          start_time: newBathroomState.startTime,
          is_first_of_day: isFirstOfDay
        }).eq("id", 1);
        await supabase.from("pissgo_queue").delete().eq("user_id", userId);
        await supabase.from("pissgo_chat_messages").insert({
          user_id: null,
          text: newChatMsg.text,
          system: true
        });
      } catch (err) {
        syncOfflineState({
          bathroomState: newBathroomState,
          queue: newQueue,
          chatMessages: nextChat
        });
      }
    }
  };

  // Action: Check-Out
  const handleCheckOut = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const duration = elapsedSeconds;
    const isFirstOfDay = bathroomState.isFirstOfDay || false;

    const newHistLog = {
      id: Date.now(),
      userId: userId,
      enterTime: bathroomState.startTime || new Date().toISOString(),
      exitTime: new Date().toISOString(),
      durationSeconds: duration
    };
    const nextHist = [...statsHistory, newHistLog];

    const newBathroomState = {
      status: "libre",
      occupiedBy: null,
      startTime: null,
      isFirstOfDay: false
    };

    const checkoutMsg = {
      id: Date.now(),
      userId: null,
      text: `🚪 ${user.name} salió del baño después de ${formatTimeText(duration)}.`,
      system: true,
      timestamp: new Date().toISOString()
    };
    let nextChat = [...chatMessages, checkoutMsg];

    let nextQueue = [...queue];
    if (queue.length > 0) {
      const nextUserId = queue[0] === userId ? queue[1] : queue[0];
      if (nextUserId) {
        const nextUser = users.find(u => u.id === nextUserId);
        if (nextUser) {
          nextChat.push({
            id: Date.now() + 1,
            userId: null,
            text: `🔔 ¡El baño está libre! Turno de ${nextUser.name}. ¡Es tu momento! 🏃‍♂️💨`,
            system: true,
            status: "success",
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    setBathroomState(newBathroomState);
    setStatsHistory(nextHist);
    setChatMessages(nextChat);

    // Evaluate Achievements
    const userHistoryCount = nextHist.filter(h => h.userId === userId).length;
    const unlockedBadges = await checkAndUnlockAchievements(userId, duration, isFirstOfDay, user, userHistoryCount);

    if (unlockedBadges.length > 0) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setToast({ visible: true, badge: unlockedBadges[0], userName: user.name });
      setTimeout(() => {
        setToast({ visible: false, badge: null, userName: "" });
      }, 5000);

      // Update local badges if unlocked
      const newBadgeIds = unlockedBadges.map(b => b.id);
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        badges: Array.from(new Set([...u.badges, ...newBadgeIds])),
        stats: { visits: userHistoryCount, totalMinutes: u.stats.totalMinutes + Math.round(duration / 60) }
      } : u));
    }

    if (isOfflineMode) {
      syncOfflineState({
        bathroomState: newBathroomState,
        statsHistory: nextHist,
        chatMessages: nextChat
      });
    } else {
      try {
        await supabase.from("pissgo_stats_history").insert({
          user_id: userId,
          enter_time: newHistLog.enterTime,
          exit_time: newHistLog.exitTime,
          duration_seconds: duration
        });
        await supabase.from("pissgo_bathroom_state").update({
          status: "libre",
          occupied_by: null,
          start_time: null,
          is_first_of_day: false
        }).eq("id", 1);
        await supabase.from("pissgo_chat_messages").insert({
          user_id: null,
          text: checkoutMsg.text,
          system: true
        });
      } catch (err) {
        syncOfflineState({
          bathroomState: newBathroomState,
          statsHistory: nextHist,
          chatMessages: nextChat
        });
      }
    }
  };

  // Action: Join Queue
  const handleJoinQueue = async (userId) => {
    if (queue.includes(userId)) return;

    const user = users.find(u => u.id === userId);
    const newQueue = [...queue, userId];
    const newChatMsg = {
      id: Date.now(),
      userId: null,
      text: `👥 ${user?.name || userId} se unió a la fila de espera (Posición #${newQueue.length}).`,
      system: true,
      timestamp: new Date().toISOString()
    };
    const nextChat = [...chatMessages, newChatMsg];

    setQueue(newQueue);
    setChatMessages(nextChat);

    if (isOfflineMode) {
      syncOfflineState({ queue: newQueue, chatMessages: nextChat });
    } else {
      try {
        await supabase.from("pissgo_queue").insert({ user_id: userId });
        await supabase.from("pissgo_chat_messages").insert({
          user_id: null,
          text: newChatMsg.text,
          system: true
        });
      } catch (err) {
        syncOfflineState({ queue: newQueue, chatMessages: nextChat });
      }
    }
  };

  // Action: Leave Queue
  const handleLeaveQueue = async (userId) => {
    const user = users.find(u => u.id === userId);
    const newQueue = queue.filter(qId => qId !== userId);
    const newChatMsg = {
      id: Date.now(),
      userId: null,
      text: `👥 ${user?.name || userId} abandonó la fila de espera.`,
      system: true,
      timestamp: new Date().toISOString()
    };
    const nextChat = [...chatMessages, newChatMsg];

    setQueue(newQueue);
    setChatMessages(nextChat);

    if (isOfflineMode) {
      syncOfflineState({ queue: newQueue, chatMessages: nextChat });
    } else {
      try {
        await supabase.from("pissgo_queue").delete().eq("user_id", userId);
        await supabase.from("pissgo_chat_messages").insert({
          user_id: null,
          text: newChatMsg.text,
          system: true
        });
      } catch (err) {
        syncOfflineState({ queue: newQueue, chatMessages: nextChat });
      }
    }
  };

  // Action: Add Social Post
  const handleAddPost = async (text, imageUrl) => {
    const newPost = {
      id: Date.now(),
      userId: activeUserId,
      content: text,
      image: imageUrl,
      likes: 0,
      likedBy: [],
      comments: [],
      timestamp: new Date().toISOString()
    };
    const nextPosts = [newPost, ...feedPosts];
    setFeedPosts(nextPosts);

    if (isOfflineMode) {
      syncOfflineState({ feedPosts: nextPosts });
    } else {
      try {
        await supabase.from("pissgo_feed_posts").insert({
          user_id: activeUserId,
          content: text,
          image: imageUrl,
          likes: 0,
          liked_by: [],
          comments: []
        });
      } catch (err) {
        syncOfflineState({ feedPosts: nextPosts });
      }
    }
  };

  // Action: Like Post
  const handleLikePost = async (postId, userId) => {
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;

    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(userId);
    const newLikedBy = isLiked 
      ? likedBy.filter(id => id !== userId)
      : [...likedBy, userId];

    const nextPosts = feedPosts.map(p => p.id === postId ? {
      ...p,
      likedBy: newLikedBy,
      likes: newLikedBy.length
    } : p);

    setFeedPosts(nextPosts);

    if (isOfflineMode) {
      syncOfflineState({ feedPosts: nextPosts });
    } else {
      try {
        await supabase.from("pissgo_feed_posts").update({
          liked_by: newLikedBy,
          likes: newLikedBy.length
        }).eq("id", postId);
      } catch (err) {
        syncOfflineState({ feedPosts: nextPosts });
      }
    }
  };

  // Action: Add Comment to Post
  const handleAddComment = async (postId, text) => {
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;

    const newComments = [...(post.comments || []), { userId: activeUserId, text }];
    const nextPosts = feedPosts.map(p => p.id === postId ? {
      ...p,
      comments: newComments
    } : p);

    setFeedPosts(nextPosts);

    if (isOfflineMode) {
      syncOfflineState({ feedPosts: nextPosts });
    } else {
      try {
        await supabase.from("pissgo_feed_posts").update({
          comments: newComments
        }).eq("id", postId);
      } catch (err) {
        syncOfflineState({ feedPosts: nextPosts });
      }
    }
  };

  // Action: Send Chat Message
  const handleSendChatMessage = async (text) => {
    const newMsg = {
      id: Date.now(),
      userId: activeUserId,
      text: text,
      system: false,
      timestamp: new Date().toISOString()
    };
    const nextChat = [...chatMessages, newMsg];
    setChatMessages(nextChat);

    if (isOfflineMode) {
      syncOfflineState({ chatMessages: nextChat });
    } else {
      try {
        await supabase.from("pissgo_chat_messages").insert({
          user_id: activeUserId,
          text: text,
          system: false
        });
      } catch (err) {
        syncOfflineState({ chatMessages: nextChat });
      }
    }
  };

  // Action: Trigger SOS Maintenance
  const handleTriggerSOS = async (typeId, title, chatText) => {
    const newLog = {
      id: Date.now(),
      type: typeId,
      title: title,
      status: "activo",
      reportedBy: activeUserId,
      reportedByName: activeUser?.name || "Anónimo",
      timestamp: new Date().toISOString()
    };
    const nextLogs = [newLog, ...maintenanceLogs];

    const sosMsg = {
      id: Date.now() + 1,
      userId: null,
      text: chatText,
      system: true,
      status: "danger",
      timestamp: new Date().toISOString()
    };
    const nextChat = [...chatMessages, sosMsg];

    setMaintenanceLogs(nextLogs);
    setChatMessages(nextChat);

    const unlockedBadge = await unlockSpecificBadge(activeUserId, "sanitario", activeUser);
    if (unlockedBadge) {
      confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
      setToast({ visible: true, badge: unlockedBadge, userName: activeUser?.name || "" });
      setTimeout(() => {
        setToast({ visible: false, badge: null, userName: "" });
      }, 5000);

      setUsers(prev => prev.map(u => u.id === activeUserId ? {
        ...u,
        badges: Array.from(new Set([...u.badges, "sanitario"]))
      } : u));
    }

    if (isOfflineMode) {
      syncOfflineState({ maintenanceLogs: nextLogs, chatMessages: nextChat });
    } else {
      try {
        await supabase.from("pissgo_maintenance_logs").insert({
          type: typeId,
          title: title,
          status: "activo",
          reported_by: activeUserId,
          reported_by_name: activeUser?.name || "Anónimo"
        });
        await supabase.from("pissgo_chat_messages").insert({
          user_id: null,
          text: chatText,
          system: true,
          status: "danger"
        });
      } catch (err) {
        syncOfflineState({ maintenanceLogs: nextLogs, chatMessages: nextChat });
      }
    }
  };

  // Action: Resolve SOS Maintenance
  const handleResolveSOS = async (alertId, title) => {
    const nextLogs = maintenanceLogs.map(log => log.id === alertId ? {
      ...log,
      status: "resuelto",
      resolvedBy: activeUserId,
      resolvedByName: activeUser?.name || "Anónimo"
    } : log);

    const resolveMsg = {
      id: Date.now(),
      userId: null,
      text: `✅ SOS RESUELTO: Los suministros de "${title}" han sido restaurados por ${activeUser?.name || "Anónimo"}.`,
      system: true,
      status: "success",
      timestamp: new Date().toISOString()
    };
    const nextChat = [...chatMessages, resolveMsg];

    setMaintenanceLogs(nextLogs);
    setChatMessages(nextChat);

    if (isOfflineMode) {
      syncOfflineState({ maintenanceLogs: nextLogs, chatMessages: nextChat });
    } else {
      try {
        await supabase.from("pissgo_maintenance_logs").update({
          status: "resuelto",
          resolved_by: activeUserId,
          resolved_by_name: activeUser?.name || "Anónimo"
        }).eq("id", alertId);
        await supabase.from("pissgo_chat_messages").insert({
          user_id: null,
          text: resolveMsg.text,
          system: true,
          status: "success"
        });
      } catch (err) {
        syncOfflineState({ maintenanceLogs: nextLogs, chatMessages: nextChat });
      }
    }
  };

  // Render Loading Screen
  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div className="login-card glass-card animate-fadeIn">
          <span className="login-logo">Pissgo 🚽✨</span>
          <p className="login-subtitle">Cargando aplicación...</p>
          <div style={{ marginTop: "24px", display: "flex", justifyContent: "center" }}>
            <div className="status-circle-pulse libre" style={{ position: "relative", width: "40px", height: "40px", animation: "pulseGreen 1.5s infinite" }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Render Login Screen if no active profile
  if (!activeUserId || !activeUser) {
    return (
      <div className="app-container">
        {isOfflineMode && (
          <div style={{
            background: "rgba(245, 158, 11, 0.15)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
            color: "#fbbf24",
            fontSize: "0.78rem",
            padding: "8px 16px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontWeight: 500
          }}>
            <WifiOff size={14} /> Modo Demo Local Activo (Todos los datos se guardan en tu navegador)
          </div>
        )}
        <LoginScreen 
          users={users} 
          onLogin={handleUserChange} 
          onRegister={handleRegisterUser} 
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="logo-container" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="logo-text">Pissgo 🚽</span>
          {isOfflineMode && (
            <span title="Modo Local Activo" style={{
              background: "rgba(245, 158, 11, 0.18)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              color: "#fbbf24",
              fontSize: "0.68rem",
              padding: "2px 8px",
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 600
            }}>
              <WifiOff size={10} /> Local
            </span>
          )}
        </div>

        {/* Active User Badge */}
        <div className="active-user-badge" style={{ cursor: "default" }}>
          <img src={activeUser.avatar} alt={activeUser.name} className="active-user-avatar" />
          <span className="active-user-name">{activeUser.name}</span>
        </div>
      </header>

      {/* Main Tab Render */}
      <main className="tab-content">
        {activeTab === "monitor" && (
          <MonitorTab 
            bathroomState={bathroomState}
            queue={queue}
            users={users}
            activeUser={activeUser}
            elapsedSeconds={elapsedSeconds}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onJoinQueue={handleJoinQueue}
            onLeaveQueue={handleLeaveQueue}
          />
        )}

        {activeTab === "social" && (
          <SocialTab 
            feedPosts={feedPosts}
            chatMessages={chatMessages}
            users={users}
            activeUser={activeUser}
            onAddPost={handleAddPost}
            onLikePost={handleLikePost}
            onAddComment={handleAddComment}
            onSendChatMessage={handleSendChatMessage}
          />
        )}

        {activeTab === "sos" && (
          <SOSTab 
            maintenanceLogs={maintenanceLogs}
            activeUser={activeUser}
            onTriggerSOS={handleTriggerSOS}
            onResolveSOS={handleResolveSOS}
          />
        )}

        {activeTab === "stats" && (
          <StatsTab 
            statsHistory={statsHistory}
            users={users}
          />
        )}

        {activeTab === "profile" && (
          <ProfileTab 
            activeUser={activeUser}
            statsHistory={statsHistory}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === "monitor" ? "active" : ""}`}
          onClick={() => setActiveTab("monitor")}
        >
          <QrCode />
          <span>Monitor</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === "social" ? "active" : ""}`}
          onClick={() => setActiveTab("social")}
        >
          <MessageSquare />
          <span>Social</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === "sos" ? "active" : ""}`}
          onClick={() => setActiveTab("sos")}
        >
          <ShieldAlert />
          <span>SOS</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <BarChart3 />
          <span>Estadísticas</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <User />
          <span>Perfil</span>
        </button>
      </nav>

      {/* Achievement Toast Popup */}
      {toast.visible && toast.badge && (
        <div className="pissgo-toast">
          <div className="pissgo-toast-icon">{toast.badge.icon}</div>
          <div className="pissgo-toast-content">
            <span className="pissgo-toast-title">¡Logro Desbloqueado! 🏆</span>
            <span className="pissgo-toast-message">
              {toast.userName} obtuvo la medalla <strong>{toast.badge.title}</strong>: {toast.badge.description}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
