'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, Check, X } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn, user } = useAuth();
  useEffect(() => {
    if (user) {
      router.replace('/'); // prevent going back to login page
    }
  }, [user, router]);
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: null as File | null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Password validation state
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Password validation handler
  const handlePasswordChange = (password: string) => {
    setSignupData((prev) => ({ ...prev, password }));

    // Check password requirements
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    setPasswordChecks(checks);

    // Calculate password strength (0-5)
    const strength = Object.values(checks).filter(Boolean).length;
    setPasswordStrength(strength);

    // Set error if password exists but doesn't meet minimum requirements
    if (password && !checks.minLength) {
      setPasswordError('Password must be at least 8 characters long');
    } else {
      setPasswordError('');
    }
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-yellow-500';
    if (passwordStrength <= 3) return 'bg-blue-500';
    if (passwordStrength === 4) return 'bg-green-400';
    return 'bg-green-500';
  };

  // Get password strength text
  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Very Weak';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Moderate';
    if (passwordStrength === 4) return 'Strong';
    return 'Very Strong';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Clear any previous errors
    setLoginData((prev) => ({ ...prev, error: '' }));

    // Basic validation
    if (!loginData.email || !loginData.password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Signing in...');

    try {
      const result = await signIn(loginData.email.toLowerCase(), loginData.password);

      if (result?.success) {
        toast.success('Login successful! Redirecting...', { id: toastId });
        // Use replace instead of push to prevent going back to login page
        router.replace('/');
        router.refresh();
      } else {
        // Show the specific error message from the signIn function
        const errorMessage =
          result?.error || 'Login failed. Please check your credentials and try again.';
        toast.error(errorMessage, { id: toastId });
        setLoginData((prev) => ({ ...prev, error: errorMessage }));
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during login';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!signupData.name || !signupData.email || !signupData.password || !signupData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (signupData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    await toast.promise(
      (async () => {
        let avatarUrl = '';

        // Upload image if exists
        if (signupData.avatar) {
          const formDataToSend = new FormData();
          formDataToSend.append('file', signupData.avatar);

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formDataToSend,
          });

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || 'Failed to upload image');
          }

          const uploadResult = await uploadResponse.json();
          avatarUrl = uploadResult.url;
        }

        // Create user in the database
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: signupData.name,
            email: signupData.email,
            password: signupData.password,
            isAdmin: false,
            ...(avatarUrl && { avatar: avatarUrl }),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create account');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to create account');
        }

        // Auto sign in after successful signup
        const signInResult = await signIn(signupData.email, signupData.password);
        if (signInResult.success) {
          router.push('/');
          router.refresh();
        }
      })(),
      {
        loading: 'Creating your account...',
        success: 'Account created successfully! Welcome to Axion!',
        error: (error) => error.message || 'Failed to create account',
        finally: () => {
          setIsLoading(false);
        },
      },
    );
  };

  const switchToSignUp = () => {
    setIsSignUp(true);
    setLoginData({ email: '', password: '' });
  };

  const switchToLogin = () => {
    setIsSignUp(false);
    setSignupData({ name: '', email: '', password: '', confirmPassword: '', avatar: null });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {isSignUp ? 'Create your account' : 'Sign in with email'}
            </h1>
            <p className="text-sm text-gray-500">
              {isSignUp
                ? 'Join Axion to get started with smart lighting solutions.'
                : 'Make a new doc to bring your words, data, and teams together. For free'}
            </p>
          </div>

          {/* Tab Switcher */}
          {!isSignUp && (
            <div className="flex mb-6 bg-gray-50 rounded-lg p-1">
              <button
                onClick={switchToLogin}
                className="flex-1 py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-md shadow-sm"
              >
                Sign In
              </button>
              <button
                onClick={switchToSignUp}
                className="flex-1 py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Sign Up
              </button>
            </div>
          )}

          {isSignUp && (
            <div className="flex mb-6 bg-gray-50 rounded-lg p-1">
              <button
                onClick={switchToLogin}
                className="flex-1 py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Sign In
              </button>
              <button
                onClick={switchToSignUp}
                className="flex-1 py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-md shadow-sm"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Form Content */}
          <div className="relative">
            {/* Login Form */}
            <div
              className={`transition-all duration-300 ease-out ${isSignUp ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'
                }`}
            >
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Email"
                    value={loginData.email}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-end w-full">
                  <a
                    href="/forgot-password"
                    className="text-xs text-gray-500 hover:text-blue-600 hover:underline mb-4"
                  >
                    Forgot Password?
                  </a>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--color-logo)] text-white py-3 px-4 rounded-lg font-medium hover:bg-[var(--color-logo)]/90 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Signing in...' : 'Get Started'}
                </button>
              </form>

              {/* Social Login */}
              <div className="mt-6">
                <div className="text-center text-sm text-gray-500 mb-4">Or sign in with</div>
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={() => nextAuthSignIn('google', { callbackUrl: '/' })}
                    className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Signup Form */}
            <div
              className={`transition-all duration-300 ease-out ${!isSignUp ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'
                }`}
            >
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Full name"
                    value={signupData.name}
                    onChange={(e) => setSignupData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Email"
                    value={signupData.email}
                    onChange={(e) => setSignupData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="relative">
                  {/* Icon locked in center */}
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`w-full pl-12 pr-12 py-3 bg-gray-50 border ${signupData.password
                        ? passwordError
                          ? 'border-red-500'
                          : 'border-green-500'
                        : 'border-gray-200'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                    placeholder="Password"
                    value={signupData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onFocus={() => setShowPasswordRequirements(true)}
                  />

                  {/* Show/hide button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Requirements go outside the relative container so icon doesn’t shift */}
                <div className="mt-2">
                  {passwordError && (
                    <div className="text-red-500 text-xs mb-2">{passwordError}</div>
                  )}

                  {signupData.password && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Password Strength:</span>
                        <span className="text-xs font-medium">
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          className={`h-1.5 rounded-full ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                    </>
                  )}

                  {(showPasswordRequirements || signupData.password) && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500 mb-1">Password must contain:</p>
                      <ul className="text-xs space-y-1">
                        <li className={`flex items-center ${passwordChecks.minLength ? 'text-green-500' : 'text-gray-400'}`}>
                          {passwordChecks.minLength ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                          <span>At least 8 characters</span>
                        </li>
                        <li className={`flex items-center ${passwordChecks.hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
                          {passwordChecks.hasUppercase ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                          <span>At least one uppercase letter</span>
                        </li>
                        <li className={`flex items-center ${passwordChecks.hasLowercase ? 'text-green-500' : 'text-gray-400'}`}>
                          {passwordChecks.hasLowercase ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                          <span>At least one lowercase letter</span>
                        </li>
                        <li className={`flex items-center ${passwordChecks.hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
                          {passwordChecks.hasNumber ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                          <span>At least one number</span>
                        </li>
                        <li className={`flex items-center ${passwordChecks.hasSpecialChar ? 'text-green-500' : 'text-gray-400'}`}>
                          {passwordChecks.hasSpecialChar ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                          <span>At least one special character (!@#$%^&*)</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Confirm Password"
                    value={signupData.confirmPassword}
                    onChange={(e) =>
                      setSignupData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--color-logo)] text-white py-3 px-4 rounded-lg font-medium hover:bg-[var(--color-logo)]/90 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating account...' : 'Get Started'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}