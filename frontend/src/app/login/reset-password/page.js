'use client';
import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useUserStore from '../../../store/auth';

const ResetPasswordPage = () => {
  const router = useRouter();
  const { 
    updatePasswordWithToken,
    isLoading, 
    error, 
    clearError 
  } = useUserStore();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [isExtractingToken, setIsExtractingToken] = useState(true);

  // Extract access token from URL hash on component mount
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    
    if (token) {
      setAccessToken(token);
      console.log('Access token extracted:', token.substring(0, 20) + '...');
    } else {
      console.error('No access token found in URL');
      setErrors({ general: 'Invalid or missing reset token. Please request a new password reset.' });
    }
    
    setIsExtractingToken(false);
    clearError();
  }, [clearError]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    clearError();
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (!accessToken) {
      setErrors({ general: 'No valid reset token found. Please request a new password reset.' });
      return;
    }

    try {
      const result = await updatePasswordWithToken(formData.password);
      if (result.success) {
        setIsSuccess(true);
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Password reset error:', err);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  // Show success message
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-from)] to-[var(--bg-to)]/60 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/1.png" alt="Farma Logo" className="w-auto h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
            <p className="text-gray-600">Your password has been updated successfully</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6 border border-[var(--border)] text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Updated!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </p>
            <button
              onClick={handleBackToLogin}
              className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2 px-4 rounded-lg font-medium hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while extracting token
  if (isExtractingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-from)] to-[var(--bg-to)]/60 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/1.png" alt="Farma Logo" className="w-auto h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset</h1>
            <p className="text-gray-600">Processing your reset request...</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6 border border-[var(--border)] text-center">
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-[var(--primary)]" />
            </div>
            <p className="text-gray-600 mt-4">Validating your reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no valid token
  if (!accessToken && errors.general) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-from)] to-[var(--bg-to)]/60 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/1.png" alt="Farma Logo" className="w-auto h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset</h1>
            <p className="text-gray-600">Reset your password to access your account</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6 border border-red-200">
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
            <button
              onClick={handleBackToLogin}
              className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2 px-4 rounded-lg font-medium hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-from)] to-[var(--bg-to)]/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/1.png" alt="Farma Logo" className="w-auto h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-white rounded-lg shadow-xl p-6 border border-[var(--border)]">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* New Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !accessToken}
              className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2 px-4 rounded-lg font-medium hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <button
                onClick={handleBackToLogin}
                className="text-sm text-green-600 hover:text-green-500 font-medium"
              >
                Back to Login
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Make sure your new password is secure and different from your previous password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
