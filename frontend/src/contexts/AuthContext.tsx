import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

interface SignUpData {
  firstName: string
  lastName: string
  phone: string
  cin: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we're in demo mode
    const isDemoMode = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co'
    
    if (isDemoMode) {
      // In demo mode, just set loading to false
      setIsLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    }).catch(() => {
      // Handle connection errors gracefully
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    // Check if we're in demo mode
    const isDemoMode = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co'
    
    if (isDemoMode) {
      toast.success('🎭 Demo Mode: Registration UI works! Set up Supabase for full functionality.')
      return
    }

    try {
      // Validate CIN format
      if (!/^\d{8}$/.test(userData.cin)) {
        throw new Error('CIN must be exactly 8 digits')
      }

      // First check if CIN is already restricted
      const { data: restrictedCheck, error: checkError } = await supabase
        .rpc('is_cin_restricted', { cin_number: userData.cin })

      if (checkError) {
        console.warn('Could not check CIN restriction:', checkError)
        // Continue with registration if we can't check (database might not be fully set up)
      } else if (restrictedCheck) {
        throw new Error('This CIN is restricted and cannot create new accounts. Please contact support.')
      }

      // Check if CIN is already in use by another user
      const { data: existingUser, error: existingError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('cin', userData.cin)
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        console.warn('Could not check existing CIN:', existingError)
      } else if (existingUser) {
        throw new Error('This CIN is already registered with another account')
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            cin: userData.cin,
            is_admin: false,
            is_restricted: false,
          },
        },
      })

      if (error) throw error

      toast.success('Account created! Please check your email to confirm.')
    } catch (error) {
      const authError = error as AuthError
      if (authError.message?.includes('fetch')) {
        toast.error('🎭 Demo Mode: Set up Supabase credentials for full functionality')
      } else if (authError.message?.includes('CIN is restricted')) {
        toast.error('This national ID is restricted from creating accounts. Please contact support.')
      } else if (authError.message?.includes('CIN is already registered')) {
        toast.error('This national ID is already registered with another account.')
      } else if (authError.message?.includes('CIN must be exactly 8 digits')) {
        toast.error('National ID must be exactly 8 digits.')
      } else {
        toast.error(authError.message || 'Failed to create account')
      }
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    // Check if we're in demo mode
    const isDemoMode = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co'
    
    if (isDemoMode) {
      toast.success('🎭 Demo Mode: Login UI works! Set up Supabase for full functionality.')
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Welcome back!')
    } catch (error) {
      const authError = error as AuthError
      if (authError.message?.includes('fetch')) {
        toast.error('🎭 Demo Mode: Set up Supabase credentials for full functionality')
      } else {
        toast.error(authError.message || 'Failed to sign in')
      }
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast.success('Signed out successfully')
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Failed to sign out')
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message || 'Failed to send reset email')
      throw error
    }
  }

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
