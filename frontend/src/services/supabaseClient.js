import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yvpkwlhkvnazdcxvdxik.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cGt3bGhrdm5hemRjeHZkeGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIxODI2MTYsImV4cCI6MjA0Nzc1ODYxNn0.vbNpVuQfuR0Y2f-6FHdz6l0VfgZKLq-FV0wQNQD6-9I'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
