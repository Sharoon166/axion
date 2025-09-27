'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const PasswordRequirement = ({ meets, label }: { meets: boolean; label: string }) => (
  <div className="flex items-center gap-2 text-sm">
    {meets ? (
      <Check className="w-4 h-4 text-green-500" />
    ) : (
      <X className="w-4 h-4 text-red-500" />
    )}
    <span className={meets ? 'text-gray-600' : 'text-gray-400'}>{label}</span>
  </div>
);

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        setIsValidToken(data.valid);
        
        if (!data.valid) {
          toast.error('Invalid or expired reset link');
          router.push('/forgot-password');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        setIsValidToken(false);
        toast.error('Error validating reset link');
        router.push('/forgot-password');
      }
    };

    validateToken();
  }, [token, router]);

  const passwordRequirements = useMemo(() => [
    { re: /.{8,}/, label: 'At least 8 characters long' },
    { re: /[A-Z]/, label: 'Contains uppercase letter' },
    { re: /[a-z]/, label: 'Contains lowercase letter' },
    { re: /[0-9]/, label: 'Contains number' },
  ], []);

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    return passwordRequirements.filter(({ re }) => re.test(password)).length;
  }, [password, passwordRequirements]);

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-yellow-500';
    if (strength <= 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    for (const { re, label } of passwordRequirements) {
      if (!re.test(password)) {
        return { valid: false, message: `Password ${label.toLowerCase()}` };
      }
    }
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password has been reset successfully');
        router.push('/login');
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Invalid or Expired Link</h2>
        <p className="text-gray-600 mb-4">The password reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            {password && (
              <div className="space-y-2 mt-2">
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getPasswordStrengthColor(passwordStrength)}`}
                    style={{
                      width: `${(passwordStrength / passwordRequirements.length) * 100}%`,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {passwordRequirements.map((requirement, index) => (
                    <PasswordRequirement
                      key={index}
                      meets={requirement.re.test(password)}
                      label={requirement.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </div>
      </form>
    </div>
  );
}
