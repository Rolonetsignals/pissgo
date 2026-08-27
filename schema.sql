-- ==========================================
-- SCRIPT DE BASE DE DATOS PISSGO 🚽✨
-- Copia y pega este script en el "SQL Editor" de tu proyecto Supabase y dale a "Run".
-- ==========================================

-- 1. Crear Tabla de Usuarios
CREATE TABLE IF NOT EXISTS pissgo_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  gender TEXT DEFAULT 'hombre',
  avatar TEXT NOT NULL,
  badges TEXT[] DEFAULT '{}',
  visits INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0
);

-- 2. Crear Tabla de Estado del Baño
CREATE TABLE IF NOT EXISTS pissgo_bathroom_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  status TEXT DEFAULT 'libre',
  occupied_by TEXT REFERENCES pissgo_users(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ,
  is_first_of_day BOOLEAN DEFAULT FALSE,
  CONSTRAINT single_row CHECK (id = 1)
);

-- 3. Crear Tabla de Fila Virtual
CREATE TABLE IF NOT EXISTS pissgo_queue (
  user_id TEXT PRIMARY KEY REFERENCES pissgo_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear Tabla de Feed Social (Muro)
CREATE TABLE IF NOT EXISTS pissgo_feed_posts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id TEXT REFERENCES pissgo_users(id) ON DELETE CASCADE,
  content TEXT,
  image TEXT,
  likes INTEGER DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}',
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear Tabla de Chat Lounge
CREATE TABLE IF NOT EXISTS pissgo_chat_messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id TEXT REFERENCES pissgo_users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  system BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Crear Tabla de Reportes SOS (Mantenimiento)
CREATE TABLE IF NOT EXISTS pissgo_maintenance_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'activo',
  reported_by TEXT REFERENCES pissgo_users(id) ON DELETE SET NULL,
  reported_by_name TEXT NOT NULL,
  resolved_by TEXT REFERENCES pissgo_users(id) ON DELETE SET NULL,
  resolved_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Crear Tabla de Historial de Visitas (Estadísticas)
CREATE TABLE IF NOT EXISTS pissgo_stats_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id TEXT REFERENCES pissgo_users(id) ON DELETE CASCADE,
  enter_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL
);

-- ==========================================
-- PRECARGAR DATOS INICIALES (DEMO)
-- ==========================================

-- Insertar Usuarios de Prueba
INSERT INTO pissgo_users (id, name, role, avatar, badges, visits, total_minutes) VALUES
('juan', 'Juan Pérez', 'Backend Engineer', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', ARRAY['filosofo', 'frecuente'], 15, 124),
('maria', 'María López', 'Product Designer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', ARRAY['relampago'], 8, 14),
('carlos', 'Carlos Ramírez', 'QA Tester', 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150', ARRAY['madrugador'], 12, 45),
('ana', 'Ana Gómez', 'HR Specialist', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', ARRAY['sanitario'], 5, 18)
ON CONFLICT (id) DO NOTHING;

-- Insertar Estado del Baño inicial (Libre)
INSERT INTO pissgo_bathroom_state (id, status, occupied_by, start_time, is_first_of_day) VALUES
(1, 'libre', NULL, NULL, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Insertar Posts Iniciales
INSERT INTO pissgo_feed_posts (user_id, content, image, likes, liked_by, comments, created_at) VALUES
('juan', '¡Al fin libre! Después de una sesión intensa de debugging... y otras cosas. 🧠💻', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600', 8, '{}', '[{"userId": "carlos", "text": "¡Oye, duraste un siglo ahí adentro!"}, {"userId": "maria", "text": "Con razón había fila jajaja"}]'::jsonb, NOW() - INTERVAL '2 hours'),
('maria', 'Cuando entras al baño y notas que huele a lavanda fresca. ¡Excelente servicio! ⭐⭐⭐⭐⭐', 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=600', 12, '{}', '[{"userId": "ana", "text": "¡De nada! Acabo de mandar a mantenimiento"}]'::jsonb, NOW() - INTERVAL '5 hours'),
('carlos', 'Mi cara cuando veo que el baño está libre pero alguien viene corriendo en el pasillo... 🏃‍♂️💨', 'https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=600', 15, '{}', '[]'::jsonb, NOW() - INTERVAL '8 hours');

-- Insertar Mensajes de Chat Iniciales
INSERT INTO pissgo_chat_messages (user_id, text, system, status, created_at) VALUES
('ana', 'Hola a todos, recuerden cuidar el baño y reportar si falta papel. ¡Pissgo está online!', FALSE, NULL, NOW() - INTERVAL '4 hours'),
('juan', 'Pissgo es la mejor app de la empresa sin duda. Se acabó el ir a dar la vuelta en vano.', FALSE, NULL, NOW() - INTERVAL '3.8 hours'),
('maria', 'Totalmente de acuerdo. ¡Especialmente para los que diseñamos sentados todo el día!', FALSE, NULL, NOW() - INTERVAL '3.5 hours');

-- Insertar Historial de Visitas de Prueba
INSERT INTO pissgo_stats_history (user_id, enter_time, exit_time, duration_seconds) VALUES
('juan', NOW() - INTERVAL '6 hours 16 minutes', NOW() - INTERVAL '6 hours', 960),
('carlos', NOW() - INTERVAL '5 hours 4 minutes', NOW() - INTERVAL '5 hours', 240),
('maria', NOW() - INTERVAL '4 hours 2 minutes', NOW() - INTERVAL '4 hours 30 seconds', 90),
('ana', NOW() - INTERVAL '3 hours 4 minutes', NOW() - INTERVAL '3 hours', 240);

-- ==========================================
-- HABILITAR REALTIME EN SUPABASE
-- ==========================================
-- Habilita la publicación en tiempo real de cambios para que las apps reaccionen al instante.

BEGIN;
  -- Remover publicación si ya existe (para evitar errores en ejecuciones limpias)
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Crear la publicación para las tablas necesarias
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    pissgo_users, 
    pissgo_bathroom_state, 
    pissgo_queue, 
    pissgo_feed_posts, 
    pissgo_chat_messages, 
    pissgo_maintenance_logs, 
    pissgo_stats_history;
COMMIT;
