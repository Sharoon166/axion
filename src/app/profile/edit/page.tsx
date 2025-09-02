'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import {
  Upload,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: '1',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarahwilliams@example.com',
    phone: '+1 234 567 8900',
    company: 'Design Studio',
    addressLine1: '123 Main Street',
    addressLine2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    avatar: '/about-image.jpg',
    timezone: 'EST',
    language: 'English',
    preferences: {
      phone: false,
      email: true,
      message: false,
      whatsapp: true,
      updates: true,
    }
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    
    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
        
        // Map localStorage data to form structure
        const mappedData = {
          id: parsedUserData.id || '1',
          firstName: parsedUserData.name?.split(' ')[0] || 'Sarah',
          lastName: parsedUserData.name?.split(' ').slice(1).join(' ') || 'Williams',
          email: parsedUserData.email || 'sarahwilliams@example.com',
          phone: parsedUserData.phone || '+1 234 567 8900',
          company: parsedUserData.company || 'Design Studio',
          addressLine1: parsedUserData.address?.split(',')[0] || '123 Main Street',
          addressLine2: parsedUserData.address?.split(',')[1] || 'Apt 4B',
          city: parsedUserData.address?.split(',')[2] || 'New York',
          state: parsedUserData.address?.split(',')[3] || 'NY',
          country: parsedUserData.address?.split(',')[4] || 'United States',
          avatar: parsedUserData.avatar || '/about-image.jpg',
          timezone: parsedUserData.timezone || 'EST',
          language: parsedUserData.language || 'English',
          preferences: parsedUserData.preferences || {
            phone: false,
            email: true,
            message: false,
            whatsapp: true,
            updates: true,
          }
        };
        
        setFormData(mappedData);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const promise = (async () => {
      // Convert form data back to localStorage format
      const updatedUserData = {
        ...userData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        address: [formData.addressLine1, formData.addressLine2, formData.city, formData.state, formData.country].filter(Boolean).join(', '),
        avatar: formData.avatar,
        timezone: formData.timezone,
        language: formData.language,
        preferences: formData.preferences,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return updatedUserData;
    })();

    toast.promise(promise, {
      loading: 'Updating profile...',
      success: () => {
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
        return 'Profile updated successfully!';
      },
      error: 'Error updating profile. Please try again.',
    });

    try {
      await promise;
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Edit"
        titleHighlight="Profile"
        subtitle="Update your Details, Preferences and Password"
      />



      <form onSubmit={handleSubmit}>
        <div className="max-w-[85rem] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile */}
            <div className="lg:col-span-2 space-y-8">
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
                        <Image
                          src={formData.avatar}
                          alt="Profile"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
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
                        onChange={(e) => {
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

                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const result = e.target?.result as string;
                              handleInputChange('avatar', result);
                              toast.success('Image uploaded successfully!');
                            };
                            reader.onerror = () => {
                              toast.error('Failed to read image file');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="avatar-upload">
                        <Button type="button" variant="outline" className="flex items-center gap-2 cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Upload Image
                        </Button>
                      </label>
                    </div>
                    <span className="text-sm text-gray-500">JPG, PNG, or GIF (MAX. 800x400px)</span>
                  </div>

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
                        <Link href="#" className="text-sm text-blue-600 hover:underline">
                          Change Email
                        </Link>
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Section */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        value={formData.addressLine1}
                        onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input
                        id="addressLine2"
                        value={formData.addressLine2}
                        onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="Pakistan">Pakistan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences Section */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="phone"
                        name="contact"
                        checked={formData.preferences.phone}
                        onChange={(e) => handlePreferenceChange('phone', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="phone">Phone</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="email-pref"
                        name="contact"
                        checked={formData.preferences.email}
                        onChange={(e) => handlePreferenceChange('email', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="email-pref">Email</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="message"
                        name="contact"
                        checked={formData.preferences.message}
                        onChange={(e) => handlePreferenceChange('message', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="message">Message</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="whatsapp"
                        name="contact"
                        checked={formData.preferences.whatsapp}
                        onChange={(e) => handlePreferenceChange('whatsapp', e.target.checked)}
                        className="w-4 h-4 text-green-600"
                      />
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Time Zone</Label>
                      <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EST">EST (UTC-5)</SelectItem>
                          <SelectItem value="PST">PST (UTC-8)</SelectItem>
                          <SelectItem value="GMT">GMT (UTC+0)</SelectItem>
                          <SelectItem value="PKT">PKT (UTC+5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="Urdu">Urdu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="updates"
                      checked={formData.preferences.updates}
                      onChange={(e) => handlePreferenceChange('updates', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="updates">Send me updates & offers</Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Security & Sessions */}
            <div className="space-y-8">
              {/* Security Section */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Change Password</h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="border-red-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">
                          Use atleast 8 characters with a mix of upper, lower, numbers, and symbols
                        </p>
                      </div>

                      <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700">
                        Update Password
                      </Button>
                      
                      <Link href="#" className="block text-center text-sm text-blue-600 hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline" className="w-full mb-4">
                    Sign out of all devices
                  </Button>
                  
                  <div className="pt-4 border-t">
                    <Button type="button" variant="destructive" className="w-full">
                      Delete Account
                    </Button>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      This action cannot be undone
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
