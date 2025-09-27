'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Upload, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/loading';

export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    id: '1',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    console.log(setUserData);
    const storedUserData = localStorage.getItem('userData');

    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        const uploadedAvatarUrl = localStorage.getItem(`uploadedAvatarUrl_${parsedUserData.id}`);

        // Map the data properly
        const fullName = parsedUserData.name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const mappedData = {
          id: parsedUserData.id || '1',
          firstName: firstName,
          lastName: lastName,
          email: parsedUserData.email || '',
          phone: parsedUserData.phone || '',
          address: parsedUserData.address || '',
          avatar: uploadedAvatarUrl || parsedUserData.image || parsedUserData.avatar || '',
        };

        setFormData(mappedData);
        // Ensure userData state is set so we can persist id and other fields back to localStorage
        setUserData({
          id: parsedUserData.id || '1',
          name: fullName,
          email: parsedUserData.email || '',
          role: parsedUserData.role || 'user',
          isAdmin: !!parsedUserData.isAdmin,
          image: uploadedAvatarUrl || parsedUserData.image || parsedUserData.avatar || '',
        } as unknown as User);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }

    setIsLoading(false);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData?.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('An error occurred while changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const promise = async () => {
      // Send PATCH request to backend
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id || user?.id,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          avatar: formData.avatar,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }
      // Update localStorage and context
      const updatedUserData = {
        id: user?.id || userData?.id || formData.id,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        role: (user as User)?.role || (userData as User)?.role || 'user',
        isAdmin: Boolean((user as User)?.isAdmin ?? (userData as User)?.isAdmin),
        phone: formData.phone,
        address: formData.address,
        image: formData.avatar,
        updatedAt: new Date().toISOString(),
      } as unknown as User;
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      return updatedUserData;
    };

    toast.promise(promise(), {
      loading: 'Updating profile...',
      success: () => {
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
        return 'Profile updated successfully!';
      },
      error: (error) => 'Error updating profile. Please try again.' + error,
      finally: () => {
        setIsSaving(false);
      },
    });

    try {
      await promise();
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className='flex items-center justify-center min-h-screen'><Loading/></div>;
  }

  return (
    <div className="min-h-screen ">
      <PageHeader
        title="Edit"
        titleHighlight="Profile"
        subtitle="Update your Details, Preferences and Password"
      />

      <form onSubmit={handleSubmit}>
        <div className="max-w-[70rem] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile */}
            <div className="lg:col-span-3 space-y-8">
              {/* Profile Section */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {formData.avatar ? (
                        formData.avatar.startsWith('data:') ? (
                          <Image
                            src={formData.avatar}
                            alt="Profile"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={formData.avatar}
                            alt="Profile"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                          <Upload className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file size (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('Image size should be less than 5MB');
                              return;
                            }
                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              toast.error('Please select a valid image file');
                              return;
                            }

                            // Upload to /api/upload
                            const formData = new FormData();
                            formData.append('file', file);
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              body: formData,
                            });
                            const data = await res.json();
                            if (data.success && data.url) {
                              handleInputChange('avatar', data.url); // Save Cloudinary URL
                              // Store uploaded image URL in user-specific localStorage key
                              const currentUser = JSON.parse(
                                localStorage.getItem('userData') || '{}',
                              );
                              if (currentUser.id) {
                                localStorage.setItem(
                                  `uploadedAvatarUrl_${currentUser.id}`,
                                  data.url,
                                );
                              }
                              toast.success('Image uploaded successfully!');
                            } else {
                              toast.error(data.error || 'Failed to upload image');
                            }
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2 cursor-pointer bg-(--color-logo) text-white hover:bg-(--color-logo)/90"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">JPG, PNG, or GIF (MAX. 800x400px)</span>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email">Email</Label>
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        disabled
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="flex items-center gap-2 bg-(--color-logo) text-white hover:bg-(--color-logo)/90"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
              {/* Toggle Password Section */}
              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 bg-(--color-logo) text-white hover:bg-(--color-logo)/90"
                  onClick={() => setShowPasswordSection((prev) => !prev)}
                >
                  {showPasswordSection ? 'Hide Password Change' : 'Change Password'}
                </Button>
              </div>
            </div>

            {/* Right Column - Password Change (collapsible) */}
            {/* Right Column - Password Change (collapsible) */}
            {showPasswordSection && (
              <div className="lg:col-span-3">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          // 🔧 removed required
                        />
                        <div
                           className="absolute right-2 top-2 text-gray-500 hover:cursor-pointer p-0 h-auto"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          // 🔧 removed required
                        />
                        <div
                         className="absolute right-2 top-2 hover:cursor-pointer text-gray-500  p-0 h-auto"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          // 🔧 removed required
                        />
                        <div
                          className="absolute right-2 top-2 hover:cursor-pointer text-gray-500 p-0 h-auto"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end md:col-span-2">
                      <Button
                        type="button"
                        className="flex items-center gap-2 bg-(--color-logo) text-white hover:bg-(--color-logo)/90"
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            
                            Changing...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
