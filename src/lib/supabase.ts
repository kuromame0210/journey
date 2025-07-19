import { createClient } from '@supabase/supabase-js'

// Default values for demo purposes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo_key'

// Check if we have real Supabase credentials
export const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://demo.supabase.co' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'demo_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          gender: 'male' | 'female' | 'other' | null
          age: number | null
          partner_gender: 'male' | 'female' | 'either' | null
          must_condition: string | null
          mbti: string | null
          budget_pref: number[] | null
          purpose_tags: number[] | null
          demand_tags: number[] | null
          phone: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          gender?: 'male' | 'female' | 'other' | null
          age?: number | null
          partner_gender?: 'male' | 'female' | 'either' | null
          must_condition?: string | null
          mbti?: string | null
          budget_pref?: number[] | null
          purpose_tags?: number[] | null
          demand_tags?: number[] | null
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          gender?: 'male' | 'female' | 'other' | null
          age?: number | null
          partner_gender?: 'male' | 'female' | 'either' | null
          must_condition?: string | null
          mbti?: string | null
          budget_pref?: number[] | null
          purpose_tags?: number[] | null
          demand_tags?: number[] | null
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      places: {
        Row: {
          id: string
          owner: string
          genre: string | null
          title: string | null
          images: string[] | null
          budget_option: number | null
          purpose_tags: number[] | null
          demand_tags: number[] | null
          purpose_text: string | null
          budget_min: number | null
          budget_max: number | null
          date_start: string | null
          date_end: string | null
          recruit_num: number | null
          first_choice: string | null
          second_choice: string | null
          gmap_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner: string
          genre?: string | null
          title?: string | null
          images?: string[] | null
          budget_option?: number | null
          purpose_tags?: number[] | null
          demand_tags?: number[] | null
          purpose_text?: string | null
          budget_min?: number | null
          budget_max?: number | null
          date_start?: string | null
          date_end?: string | null
          recruit_num?: number | null
          first_choice?: string | null
          second_choice?: string | null
          gmap_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner?: string
          genre?: string | null
          title?: string | null
          images?: string[] | null
          budget_option?: number | null
          purpose_tags?: number[] | null
          demand_tags?: number[] | null
          purpose_text?: string | null
          budget_min?: number | null
          budget_max?: number | null
          date_start?: string | null
          date_end?: string | null
          recruit_num?: number | null
          first_choice?: string | null
          second_choice?: string | null
          gmap_url?: string | null
          created_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          place_id: string
          from_uid: string
          type: 'like' | 'keep' | 'pass'
          created_at: string
        }
        Insert: {
          id?: string
          place_id: string
          from_uid: string
          type: 'like' | 'keep' | 'pass'
          created_at?: string
        }
        Update: {
          id?: string
          place_id?: string
          from_uid?: string
          type?: 'like' | 'keep' | 'pass'
          created_at?: string
        }
      }
      budget_options: {
        Row: {
          id: number
          label: string
        }
        Insert: {
          id?: number
          label: string
        }
        Update: {
          id?: number
          label?: string
        }
      }
      purpose_tags: {
        Row: {
          id: number
          label: string
        }
        Insert: {
          id?: number
          label: string
        }
        Update: {
          id?: number
          label?: string
        }
      }
      demand_tags: {
        Row: {
          id: number
          label: string
        }
        Insert: {
          id?: number
          label: string
        }
        Update: {
          id?: number
          label?: string
        }
      }
    }
  }
}