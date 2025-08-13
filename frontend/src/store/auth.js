import { create } from 'zustand'
import { persist } from 'zustand/middleware'

let supabase = null

const initializeSupabase = async () => {
  if (!supabase) {
    try {
      const supabaseModule = await import('@/lib/supabase')
      supabase = supabaseModule.supabase
      console.log('Supabase initialized in user store')
      return supabase
    } catch (error) {
      console.error('Failed to initialize Supabase in user store:', error)
      throw error
    }
  }
  return supabase
}

const defaultPreferences = {
  newsletter_subscribed: false,
  order_notifications: true,
  theme: 'auto',
  currency: 'INR',
  language: 'en'
};

const useUserStore = create(
  persist(
    (set, get) => ({
      // Internal helper to keep old UI fields working while migrating to user_profiles/complete_users
      _normalizeProfile: (raw) => {
        if (!raw) return raw;
        return {
          ...raw,
          full_name: raw.full_name || raw.name || '',
          avatar_url: raw.avatar_url || raw.avatar || null,
        };
      },
      // Initial State
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      preferences: defaultPreferences,
      orderHistory: [],
      wishlist: [],
      recentlyViewed: [],

      // Basic Setters
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Fetch or create profile for current user
      loadProfile: async (overrideUserId) => {
        try {
          const supabaseClient = await initializeSupabase();
          const currentUser = get().user;
          const userId = overrideUserId || currentUser?.id;
          if (!userId) return { success: false, error: 'No user id' };

          // Read from view for complete profile info
          const { data: profile, error: profileError } = await supabaseClient
            .from('complete_users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          let effectiveProfile = profile || null;

          if (profileError || !effectiveProfile) {
            // If the view doesn't return a row, ensure a base row exists in user_profiles
            const { data: authUserData } = await supabaseClient.auth.getUser();
            const authUser = authUserData?.user;
            const fallbackName =
              authUser?.user_metadata?.name ||
              authUser?.user_metadata?.full_name ||
              authUser?.email ||
              'Unknown User';
            const fallbackUserId = `user_${String(userId).slice(0, 8)}`;

            // Try to upsert into user_profiles (aligns with README schema)
            const { error: upsertErr } = await supabaseClient
              .from('user_profiles')
              .upsert(
                {
                  id: userId,
                  user_id: authUser?.user_metadata?.user_id || fallbackUserId,
                  name: fallbackName,
                  avatar: authUser?.user_metadata?.avatar || authUser?.user_metadata?.avatar_url || null,
                },
                { onConflict: 'id' }
              );
            if (upsertErr) throw upsertErr;

            // Re-read from the view; if view still fails, fall back to user_profiles
            const { data: createdProfile, error: rereadErr } = await supabaseClient
              .from('complete_users')
              .select('*')
              .eq('id', userId)
              .maybeSingle();

            if (!rereadErr && createdProfile) {
              effectiveProfile = createdProfile;
            } else {
              const { data: rawProfile, error: rawErr } = await supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
              if (rawErr) throw rawErr;
              effectiveProfile = rawProfile || null;
            }
          }

          const normalized = get()._normalizeProfile(effectiveProfile);
          set({ profile: normalized });
          return { success: true, data: normalized };
        } catch (e) {
          console.error('loadProfile error:', e);
          set({ error: e.message });
          return { success: false, error: e.message };
        }
      },

      // Initialize auth state and user data
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const supabaseClient = await initializeSupabase();
          const { data: { session }, error } = await supabaseClient.auth.getSession();
          
          if (error) {
            console.error('Session error:', error);
            set({ error: error.message });
            return;
          }
          
          if (session?.user) {
            set({ user: session.user });
            await get().loadProfile(session.user.id);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      // Create user profile (used during signup or if profile missing)
      createUserProfile: async (user, additionalData = {}) => {
        try {
          const supabaseClient = await initializeSupabase();

          const name =
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            additionalData.fullName ||
            user.email ||
            '';

          const userIdText =
            user.user_metadata?.user_id || `user_${String(user.id).slice(0, 8)}`;

          const profileData = {
            id: user.id,
            user_id: userIdText,
            name,
            interests: additionalData.interests || null,
            avatar: user.user_metadata?.avatar || user.user_metadata?.avatar_url || null,
          };

          const { error } = await supabaseClient
            .from('user_profiles')
            .upsert(profileData, { onConflict: 'id' });

          if (error) throw error;

          // Read back from the view to get the normalized shape
          const { data: profile, error: readErr } = await supabaseClient
            .from('complete_users')
            .select('*')
            .eq('id', user.id)
            .single();
          if (readErr) throw readErr;

          const normalized = get()._normalizeProfile(profile);
          set({ profile: normalized });
          return { success: true, data: normalized };
        } catch (error) {
          console.error('Create profile error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        }
      },

      // Sign up with email
      signUp: async (email, password, userData = {}) => {
        try {
          set({ isLoading: true, error: null });
          
          const supabaseClient = await initializeSupabase();

          const userMetaData = {
            name: userData.fullName || '',
            full_name: userData.fullName || '',
            phone: userData.phone || '',
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            agreement_to_terms_and_policies: userData.agreeToTerms || false,
            subscribed_to_newsletters: userData.subscribeNewsletter || false,
          }

          console.log('Signup metadata:', userMetaData);

          const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              data: userMetaData,
            }
          });

          if (error) throw error;

          console.log('Sign up successful:', data);
          
          // Create profile if user was created successfully
          if (data.user && !data.user.email_confirmed_at) {
            // For unconfirmed users, we'll create profile when they confirm email
            console.log('User needs to confirm email before profile creation');
          }
          if (data.user) {
            set({ user: data.user });
            await get().loadProfile(data.user.id);
          }
          
          return { success: true, data };
        } catch (error) {
          console.error('Sign up error:', error);
          const errorMessage = error.message || 'Failed to create account';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      // Sign in with email
      signIn: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          
          const supabaseClient = await initializeSupabase();
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          console.log('Sign in successful:', data);
          if (data.user) {
            set({ user: data.user });
            await get().loadProfile(data.user.id);
          }
          return { success: true, data };
        } catch (error) {
          console.error('Sign in error:', error);
          const errorMessage = error.message || 'Failed to sign in';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      // Sign in with OAuth
      signInWithOAuth: async (provider) => {
        try {
          set({ isLoading: true, error: null });
          
          const supabaseClient = await initializeSupabase();
          const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${process.env.NEXT_MAIN_ROUTE}/`
            }
          });

          if (error) throw error;

          console.log(`${provider} OAuth initiated:`, data);
          return { success: true, data };
        } catch (error) {
          console.error(`${provider} OAuth error:`, error);
          const errorMessage = error.message || `Failed to sign in with ${provider}`;
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      // Sign out
      signOut: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const supabaseClient = await initializeSupabase();
          const { error } = await supabaseClient.auth.signOut();
          
          if (error) throw error;

          // Clear all user data
          set({ 
            user: null, 
            profile: null,
            orderHistory: [],
            wishlist: [],
            recentlyViewed: []
          });
          
          console.log('Sign out successful');
          return { success: true };
        } catch (error) {
          console.error('Sign out error:', error);
          const errorMessage = error.message || 'Failed to sign out';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      // Update user profile
      updateProfile: async (updates) => {
        try {
          set({ isLoading: true, error: null });
          
          const supabaseClient = await initializeSupabase();
          const user = get().user;

          if (!user) {
            throw new Error('User not authenticated');
          }

          console.log('Updating profile with data:', updates);

          // Align fields with README schema (user_profiles)
          const allowedFields = ['name', 'interests', 'avatar', 'user_id'];

          // Map legacy fields used by UI to new schema
          const mapped = { ...updates };
          if (Object.prototype.hasOwnProperty.call(updates, 'full_name')) {
            mapped.name = updates.full_name;
          }
          if (Object.prototype.hasOwnProperty.call(updates, 'avatar_url')) {
            mapped.avatar = updates.avatar_url;
          }

          // Filter updates to only include allowed fields
          const filteredUpdates = {};
          Object.keys(mapped).forEach(key => {
            if (allowedFields.includes(key) && mapped[key] !== undefined) {
              filteredUpdates[key] = mapped[key];
            }
          });

          // Add updated_at timestamp
          filteredUpdates.updated_at = new Date().toISOString();

          console.log('Filtered updates:', filteredUpdates);

          const { data, error } = await supabaseClient
            .from('user_profiles')
            .update(filteredUpdates)
            .eq('id', user.id)
            .select()
            .single();

          if (error) throw error;

          // Read from view to maintain consistent shape
          const { data: profileFromView, error: viewErr } = await supabaseClient
            .from('complete_users')
            .select('*')
            .eq('id', user.id)
            .single();
          if (viewErr) throw viewErr;

          const normalized = get()._normalizeProfile(profileFromView);
          console.log('Profile updated successfully:', normalized);
          set({ profile: normalized });
          return { success: true, data: normalized };
        } catch (error) {
          console.error('Profile update error:', error);
          const errorMessage = error.message || 'Failed to update profile';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh profile data
      refreshProfile: async () => {
        try {
          const supabaseClient = await initializeSupabase();
          const user = get().user;

          if (!user) return { success: false, error: 'No user logged in' };

          const { data: profile, error } = await supabaseClient
            .from('complete_users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            // Try fallback to base table if the view errors
            const { data: rawProfile, error: rawErr } = await supabaseClient
              .from('user_profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            if (rawErr) throw rawErr;
            const normalizedFallback = get()._normalizeProfile(rawProfile);
            set({ profile: normalizedFallback });
            return { success: true, data: normalizedFallback };
          }

          const normalized = get()._normalizeProfile(profile);
          set({ profile: normalized });
          
          return { success: true, data: normalized };
        } catch (error) {
          console.error('Profile refresh error:', error);
          return { success: false, error: error.message };
        }
      },

      // Check if user is admin
      isAdmin: () => {
        const profile = get().profile;
        return profile?.is_admin || false;
      },

// ============= SECURITY FEATURES =============

      //Request password reset
      requestPasswordReset: async (email) => {
        try {
          set({ isLoading: true, error: null });
          
          const supabaseClient = await initializeSupabase();
          console.log('Requesting password reset for:', email);

          const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_MAIN_ROUTE || window.location.origin}/login/reset-password`
          });

          if (error) throw error;

          console.log('Password reset requested successfully');
          return { 
            success: true, 
            message: 'Password reset email sent. Please check your inbox.' 
          };
        } catch (error) {
          console.error('Password reset request error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },
      // Verify recovery session
      // Add this function to your user store
      exchangeRecoveryToken: async () => {
        try {
          const supabaseClient = await initializeSupabase();
          
          /* Supabase automatically handles the recovery token from the URL hash
          when the page loads, but we need to verify if it has created a session */
          const { data: { session }, error } = await supabaseClient.auth.getSession();
          
          if (error) {
            console.error('❌ Failed to get session:', error);
            return { success: false, error: error.message };
          }
          
          // Check if we have a valid session
          if (!session) {
            // If no session, try to handle the hash manually
            const hash = window.location.hash.substring(1);
            const [access_token, queryString] = hash.split('?');
            
            if (!access_token) {
              console.error('❌ No recovery token found');
              return { success: false, error: 'No recovery token found' };
            }
            try {
              // Extract refresh token if available
              const params = new URLSearchParams(queryString);
              const type = params.get('type');
              
              if (type !== 'recovery') {
                return { success: false, error: 'Invalid recovery type' };
              }
              
              // Try to refresh the session using the recovery token
              const { data, error: sessionError } = await supabaseClient.auth.setSession({
                access_token: access_token,
                refresh_token: access_token // In recovery flows, sometimes the same token works
              });
              
              if (sessionError) {
                console.error('❌ Session creation error:', sessionError);
                await supabaseClient.auth.refreshSession();
                
                const { data: { session: newSession } } = await supabaseClient.auth.getSession();
                if (newSession) {
                  console.log('✅ Recovery session established after refresh');
                  return { success: true, session: newSession };
                }
                
                return { success: false, error: 'Failed to establish recovery session' };
              }
              
              console.log('✅ Recovery session established');
              return { success: true, session: data.session };
            } catch (err) {
              console.error('❌ Token exchange error:', err);
              return { success: false, error: 'Invalid or expired recovery token' };
            }
          }
          
          console.log('✅ Existing recovery session found');
          return { success: true, session };
          
        } catch (error) {
          console.error('❌ Recovery token error:', error);
          return { success: false, error: error.message };
        }
      },

      updatePasswordWithToken: async (newPassword) => {
        try {
          set({ isLoading: true, error: null });
          
          const supabaseClient = await initializeSupabase();
          
          const { data: { session } } = await supabaseClient.auth.getSession();
          
          if (!session) {
            throw new Error('No active session. Please request a new password reset.');
          }
          
          console.log('🔄 Updating password...');
          
          // Update the user's password
          const { data, error } = await supabaseClient.auth.updateUser({
            password: newPassword
          });

          if (error) {
            console.error('❌ Password update error:', error);
            throw error;
          }

          console.log('✅ Password updated successfully');
          
          // Update the password_changed_at field in the profile
          const user = data.user;
          if (user) {
            const { error: profileError } = await supabaseClient
              .from('complete_users')
              .update({ 
                password_changed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
            
            if (profileError) {
              console.warn('⚠️ Could not update profile password_changed_at:', profileError);
            }
          }
          
          // Sign out the user after password reset for security
          console.log('🔄 Signing out user after password reset...');
          await supabaseClient.auth.signOut();
          
          // Clear local state
          set({ 
            user: null, 
            profile: null,
          });
          
          return { 
            success: true, 
            message: 'Password has been reset successfully. Please log in with your new password.' 
          };
          
        } catch (error) {
          console.error('❌ Password update error:', error);
          const errorMessage = error.message || 'Failed to update password';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      completePasswordReset: async (token, newPassword) => {
        try {
          set({ isLoading: true, error: null });
          
          const supabaseClient = await initializeSupabase();
          
          // Exchange the recovery token for a session
          const { error: sessionError } = await supabaseClient.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });
          
          if (sessionError) {
            console.error('❌ Token verification error:', sessionError);
            throw new Error('Invalid or expired reset token');
          }
          
          // Now update the password
          const result = await get().updatePasswordWithToken(newPassword);
          
          return result;
          
        } catch (error) {
          console.error('❌ Complete password reset error:', error);
          const errorMessage = error.message || 'Failed to reset password';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false })
        }
      },
        //For Forget Password Page
        // Parse recovery token from URL
        parseRecoveryToken: () => {
          if (typeof window === 'undefined') return null;
          
          const hash = window.location.hash.substring(1);
          console.log('🔍 Parsing recovery token from hash:', hash);
          
          if (!hash) return null;
          
          // For your format: "token?type=recovery"
          if (hash.includes('?type=recovery')) {
            const [token] = hash.split('?');
            console.log('🔍 Extracted token:', token.substring(0, 20) + '...');
            return token;
          }
          
          // Fallback: check if hash contains recovery type anywhere
          if (hash.includes('type=recovery')) {
            // Try parsing as URL params
            try {
              const params = new URLSearchParams(hash);
              const token = params.get('access_token') || params.get('token');
              if (token) {
                console.log('🔍 Extracted token from params:', token.substring(0, 20) + '...');
                return token;
              }
            } catch (e) {
              console.log('Hash not in URL params format', e);
            }
          }
          
          return null;
        },

        hasRecoveryToken: () => {
          const token = get().parseRecoveryToken();
          const hasToken = !!token;
          console.log('🔍 hasRecoveryToken result:', hasToken);
          return hasToken;
        },

        // Use Supabase's verifyOtp method for recovery tokens
        completeForgotPasswordReset: async (newPassword) => {
          try {
            set({ isLoading: true, error: null });
            
            console.log('🔄 Starting complete forgot password reset process...');
            
            const supabaseClient = await initializeSupabase();
            
            // Get the recovery token from URL
            const token = get().parseRecoveryToken();
            
            if (!token) {
              throw new Error('No recovery token found in URL');
            }
            
            console.log('🔄 Verifying recovery token with Supabase...');
            
            // Use verifyOtp to exchange the recovery token for a session
            const { data, error } = await supabaseClient.auth.verifyOtp({
              token_hash: token,
              type: 'recovery'
            });
            
            if (error) {
              console.error('❌ Token verification failed:', error);
              throw new Error(`Invalid or expired recovery token: ${error.message}`);
            }
            
            if (!data.session) {
              throw new Error('Failed to establish recovery session');
            }
            
            console.log('✅ Recovery token verified, session established');
            console.log('🔄 Updating password...');
            
            // Now update the password using the established session
            const { data: updateData, error: updateError } = await supabaseClient.auth.updateUser({
              password: newPassword
            });

            if (updateError) {
              console.error('❌ Password update error:', updateError);
              throw new Error(`Failed to update password: ${updateError.message}`);
            }

            console.log('✅ Password updated successfully');
            
            // Update the password_changed_at field in the profile
            if (updateData.user) {
              try {
                const { error: profileError } = await supabaseClient
                  .from('complete_users')
                  .update({ 
                    password_changed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', updateData.user.id);
                
                if (profileError) {
                  console.warn('⚠️ Could not update profile password_changed_at:', profileError);
                } else {
                  console.log('✅ Profile updated with password change timestamp');
                }
              } catch (profileErr) {
                console.warn('⚠️ Profile update failed:', profileErr);
              }
            }
            
            // Sign out after successful password reset for security
            console.log('🔄 Signing out user after password reset...');
            await supabaseClient.auth.signOut();
            
            // Clear local state
            set({ 
              user: null, 
              profile: null,
            });
            
            // Clear URL hash for security
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', window.location.pathname);
            }
            
            console.log('✅ Complete forgot password reset finished successfully');
            
            return { 
              success: true, 
              message: 'Password has been reset successfully. You can now log in with your new password.' 
            };
            
          } catch (error) {
            console.error('❌ Complete forgot password reset error:', error);
            const errorMessage = error.message || 'Failed to complete password reset';
            set({ error: errorMessage });
            return { success: false, error: errorMessage };
          } finally {
            set({ isLoading: false });
          }
        },

      uploadAvatar: async (file) => {
        try {
          const supabaseClient = await initializeSupabase();
          const user = get().user;

          if (!user) {
            throw new Error('User not authenticated');
          }

          console.log('Uploading avatar for user:', user.id);

          // Validate file
          if (!file.type.startsWith('image/')) {
            throw new Error('Please upload an image file');
          }

          if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image must be less than 5MB');
          }

          // Simple filename: just user ID + extension
          const fileExt = file.name.split('.').pop().toLowerCase();
          const fileName = `${user.id}.${fileExt}`;

          console.log('Uploading avatar:', fileName);

          // Upload to Supabase Storage (upsert: true will overwrite existing)
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('avatars')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          console.log('Upload successful:', uploadData);

          // Get public URL
          const { data: { publicUrl } } = supabaseClient.storage
            .from('avatars')
            .getPublicUrl(fileName);

          // Add cache buster to force refresh
          const avatarUrl = `${publicUrl}?t=${Date.now()}`;

          console.log('Public URL:', avatarUrl);

          // Update profile with new avatar URL (store in user_profiles.avatar)
          const { data: updatedProfileRow, error: updateError } = await supabaseClient
            .from('user_profiles')
            .update({
              avatar: avatarUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();

          if (updateError) {
            console.error('Profile update error:', updateError);
            throw updateError;
          }

          // Read back from view to keep state consistent with reads
          const { data: updatedProfile, error: viewErr } = await supabaseClient
            .from('complete_users')
            .select('*')
            .eq('id', user.id)
            .single();
          if (viewErr) throw viewErr;

          console.log('Profile updated with new avatar:', updatedProfile);

          // Update local state
          const normalized = get()._normalizeProfile(updatedProfile);
          set({ profile: normalized });
          
          return { success: true, data: { url: avatarUrl } };
        } catch (error) {
          console.error('Avatar upload error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        }
      },

    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        preferences: state.preferences,
        recentlyViewed: state.recentlyViewed
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('✅ User state rehydrated from storage');
        }
      }
    }
  )
);

export default useUserStore;