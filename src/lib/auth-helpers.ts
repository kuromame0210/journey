import { supabase, isSupabaseConfigured } from './supabase'

export interface DemoUser {
  id: string
  phone: string
  email: string
}

export const checkAuthStatus = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return { 
    user: session?.user || null, 
    isAuthenticated: !!session 
  }
}

export const signOut = async () => {
  await supabase.auth.signOut()
}