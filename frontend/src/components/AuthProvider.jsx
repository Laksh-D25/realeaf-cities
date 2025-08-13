'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useUserStore from '@/store/userStore' // Updated import

export default function AuthListener({ children }) {
  const { 
    initialize, 
    isInitialized, 
    error, 
    setUser, 
    setProfile,
    fetchAddresses,
    profile
    /* fetchOrderHistory,
    fetchWishlist */
  } = useUserStore()
  
  const [supabase, setSupabase] = useState(null)
  const [initError, setInitError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Dynamic import to handle initialization errors
        const supabaseModule = await import('@/lib/supabase')
        setSupabase(supabaseModule.supabase)
        
        if (!isInitialized) {
          await initialize()
        }

        // Listen for auth changes
        const { data: { subscription } } = supabaseModule.supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth event:', event, session?.user?.id)
            
            try {
              if (event === 'SIGNED_IN' && session?.user) {
                console.log('✅ User signed in, loading profile and data...')
                
                setUser(session.user)
                
                // Fetch user profile
                const { data: profile, error: profileError } = await supabaseModule.supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single()
                
                if (profileError) {
                  console.error('❌ Profile fetch error:', profileError)
                  // Create profile if it doesn't exist
                  if (profileError.code === 'PGRST116') {
                    console.log('🔄 Creating profile for new user...')
                    const { data: newProfile, error: createError } = await supabaseModule.supabase
                      .from('profiles')
                      .insert({
                        id: session.user.id,
                        email: session.user.email,
                        full_name: session.user.user_metadata?.full_name || '',
                        phone: session.user.user_metadata?.phone || '',
                        avatar_url: session.user.user_metadata?.avatar_url || ''
                      })
                      .select()
                      .single()
                    
                    if (createError) {
                      console.error('❌ Profile creation error:', createError)
                    } else {
                      console.log('✅ Profile created:', newProfile)
                      setProfile(newProfile)
                    }
                  }
                } else {
                  console.log('✅ Profile loaded:', profile)
                  setProfile(profile)
                  
                  // Load user's e-commerce data in background
                  Promise.all([
                    fetchAddresses(),
                    /* fetchOrderHistory(),
                    fetchWishlist() */
                  ]).catch(error => {
                    console.error('❌ Failed to load user data:', error)
                  })
                }
                
              } else if (event === 'SIGNED_OUT') {
                console.log('🔄 User signed out, clearing data...')
                setUser(null)
                setProfile(null)
                
                // Redirect to home page after sign out
                router.push('/')
                
              } else if (event === 'TOKEN_REFRESHED') {
                console.log('🔄 Token refreshed')
                
              } else if (event === 'USER_UPDATED') {
                console.log('🔄 User updated:', session?.user)
                if (session?.user) {
                  setUser(session.user)
                }
              }
            } catch (error) {
              console.error('❌ Auth state change handler error:', error)
              setInitError(error.message)
            }
          }
        )

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('❌ AuthListener initialization error:', error)
        setInitError(error.message)
      }
    }

    initializeAuth()
  }, [initialize, isInitialized, setUser, setProfile, fetchAddresses, router])//fetchOrderHistory,fetchWishlist,

  // Show error if initialization failed
  if (initError || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-4">
            {initError || error}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please check your Supabase configuration and try again.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}