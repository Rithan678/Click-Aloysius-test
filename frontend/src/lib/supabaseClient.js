import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yvpkwlhkvnazdcxvdxik.supabase.co'
const supabaseAnonKey = 'sb_publishable_ayLRBA-RT_TK717QI903xQ_bMAXHoFn'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
