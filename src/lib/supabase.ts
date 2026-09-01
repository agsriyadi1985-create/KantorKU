import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://ydgutkztwvawwqskodlx.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZ3V0a3p0d3Zhd3dxc2tvZGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzE1NTgsImV4cCI6MjEwMzg0NzU1OH0.KyDecBfht4KHFr8h5Vk9dXKm18vFk7pRkc4BbsU7Pos';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
