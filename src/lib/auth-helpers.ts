import { supabase, isSupabaseConfigured } from './supabase'

export interface DemoUser {
  id: string
  phone: string
  email: string
}

export const checkAuthStatus = async () => {
  if (!isSupabaseConfigured) {
    // Demo mode - check localStorage
    const demoUserData = localStorage.getItem('demo_user')
    if (demoUserData) {
      return { user: JSON.parse(demoUserData) as DemoUser, isAuthenticated: true }
    }
    return { user: null, isAuthenticated: false }
  }

  // Real Supabase mode
  const { data: { session } } = await supabase.auth.getSession()
  return { 
    user: session?.user || null, 
    isAuthenticated: !!session 
  }
}

export const signOut = async () => {
  if (!isSupabaseConfigured) {
    // Demo mode - clear localStorage
    localStorage.removeItem('demo_user')
    return
  }

  // Real Supabase mode
  await supabase.auth.signOut()
}