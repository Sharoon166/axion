'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '@/components/PageHeader';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
  isOrderAdmin?: boolean;
  image?: string;
  address?: string | null;
  phone?: string | null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    isAdmin: false,
    avatar: null as File | null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [, setIsSubmitting] = useState(false);

  // Load user data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error('Failed to parse user data', e);
        }
      }
      setIsLoading(false);
    }
  }, []);

  // Redirect if user is not a dev admin
  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== 'user') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

 

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    try {

      await toast.promise(
        (async () => {
          let avatarUrl = '';

          // Upload image if exists
          if (formData.avatar) {
            const formDataToSend = new FormData();
            formDataToSend.append('file', formData.avatar);

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formDataToSend,
            });

            if (!uploadResponse.ok) {
              const error = await uploadResponse.json();
              throw new Error(error.error || 'Failed to upload image');
            }

            const uploadResult = await uploadResponse.json();
            avatarUrl = uploadResult.url; // Use 'url' instead of 'fileUrl'
          }

          // Create user in the database
          const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              password: formData.password,
              isAdmin: formData.isAdmin,
              ...(avatarUrl && { avatar: avatarUrl }),
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to register user');
          }

          // Return data for success handler
          return data;
        })(),
        {
          loading: 'Creating your account...',
          success: () => {
            // Redirect after successful registration
            setTimeout(() => {
              router.push(formData.isAdmin ? '/' : '/');
            }, 1000);
            return 'Registration successful! Redirecting...';
          },
          error: (err) => {
            console.error('Registration error:', err);
            return err.message || 'Failed to register. Please try again.';
          },
        },
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // This check is now handled in the useEffect above
    
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Register"
        titleHighlight="User"
        subtitle="Create a new user account (temporary admin registration)"
      />

      <div className="max-w-md mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Register New User
            </CardTitle>
            <CardDescription>
              Create a new user account. Check the admin box to create an admin user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">          

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                    className={
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdmin"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isAdmin: Boolean(checked) }))
                  }
                />
                <label
                  htmlFor="isAdmin"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Register as Admin (This will create an admin account with full access)
                </label>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={
                  isLoading || 
                  !formData.name || 
                  !formData.email || 
                  !formData.password || 
                  !formData.confirmPassword ||
                  formData.password !== formData.confirmPassword ||
                  formData.password.length < 6
                }
              >
                {isLoading ? 'Creating User...' : 'Register User'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Temporary Registration</h4>
              <p className="text-sm text-blue-700">
                This is a temporary registration page for testing. Users are stored in localStorage.
                In production, you should implement proper backend registration with password
                hashing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
