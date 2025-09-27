'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import Image from 'next/image';
import { Upload, X, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function NewProjectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    overview: '',
    content: '',
    keyFeatures: '',
    technicalSpecs: {
      projectType: '',
      location: '',
      completion: '',
      duration: '',
      team: '',
    },
    clientTestimonial: {
      text: '',
      author: '',
    },
    category: '',
    style: '',
    location: '',
    date: new Date().toISOString().split('T')[0], // Set today's date automatically
    images: [],
  });

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCategories(result.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Check admin access after initial render
  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.replace('/');
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [loading, user, router]);

  const handleMultipleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;

      const files = Array.from(e.target.files);
      const validFiles: File[] = [];
      const newPreviewUrls: string[] = [];
      const maxSize = 5 * 1024 * 1024; // 5MB

      files.forEach((file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.error(`Skipped ${file.name}: Not an image file`);
          return;
        }

        // Validate file size
        if (file.size > maxSize) {
          console.error(`Skipped ${file.name}: File is too large (max 5MB)`);
          return;
        }

        validFiles.push(file);
        newPreviewUrls.push(URL.createObjectURL(file));
      });

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
        setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
      }

      // Reset input to allow selecting the same file again
      e.target.value = '';
    } catch (error) {
      console.error('Error handling image upload:', error);
      toast.error('An error occurred while processing the images');
    }
  };

  const removeImage = (index: number) => {
    try {
      // Revoke object URL to prevent memory leaks
      if (previewUrls[index]) {
        URL.revokeObjectURL(previewUrls[index]);
      }

      // Create new arrays without the removed item
      const newFiles = [...selectedFiles];
      const newPreviews = [...previewUrls];
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);

      // Update state
      setSelectedFiles(newFiles);
      setPreviewUrls(newPreviews);
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const clearAllImages = () => {
    try {
      // Revoke all object URLs to prevent memory leaks
      previewUrls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
    } catch (error) {
      console.error('Error clearing images:', error);
      toast.error('Failed to clear images');
    }
  };

  // Clean up object URLs when component unmounts or previewUrls changes
  useEffect(() => {
    const currentPreviewUrls = [...previewUrls];
    return () => {
      currentPreviewUrls.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        if (!file) continue;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
            errorData.error ||
            `Failed to upload ${file.name}: ${response.statusText}`
          );
        }

        const data = await response.json();
        if (!data.url) {
          throw new Error(`No URL returned for ${file.name}`);
        }

        uploadedUrls.push(data.url);
      } catch (error) {
        console.error(`Error uploading ${file?.name || 'file'}:`, error);
        throw new Error(
          `Failed to upload ${file?.name || 'file'}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const promise = async () => {
      let uploadedImageUrls: string[] = [];

      if (selectedFiles.length > 0) {
        uploadedImageUrls = await uploadImages(selectedFiles);
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          images: uploadedImageUrls,
          date: formData.date, // Explicitly send today's date
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      // Cleanup object URLs
      previewUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });

      return response.json();
    };

    toast.promise(promise(), {
      loading: 'Creating project...',
      success: () => {
        router.push(`/projects`);
        return 'Project created successfully!';
      },
      error: (error) => {
        return error.message || 'Failed to create project';
      },
      finally: () => {
        setIsLoading(false);
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (loading || !isAuthorized) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[85rem] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-2">Add a new project to your portfolio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Project Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Multiple Image Upload */}
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> multiple images
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB each</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Action Buttons */}
                  {selectedFiles.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearAllImages}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>

                {/* Image Previews */}
                {previewUrls.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Image Previews</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden">
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {selectedFiles[index]?.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Column - Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="">
                <div>
                  <Label htmlFor="title" className="py-2">
                    Project Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter project title"
                  />
                </div>

                <div>
                  <Label htmlFor="overview" className="py-2">
                    Overview
                  </Label>
                  <Textarea
                    id="overview"
                    name="overview"
                    value={formData.overview}
                    onChange={handleChange}
                    required
                    placeholder="Project overview (required)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="content" className="py-2">
                    Content
                  </Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Detailed project content"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="keyFeatures" className="py-2">
                    Key Features
                  </Label>
                  <Textarea
                    id="keyFeatures"
                    name="keyFeatures"
                    value={formData.keyFeatures}
                    onChange={handleChange}
                    placeholder="List the key features of this project, type a new line for new bullet point"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="py-2">
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category (required)" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="style" className="py-2">
                    Style
                  </Label>
                  <Input
                    id="style"
                    name="style"
                    value={formData.style}
                    onChange={handleChange}
                    required
                    placeholder="Modern, Classic, etc."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technical Specifications Section */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectType" className="py-2">
                    Project Type
                  </Label>
                  <Input
                    id="projectType"
                    name="projectType"
                    value={formData.technicalSpecs.projectType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        technicalSpecs: { ...prev.technicalSpecs, projectType: e.target.value },
                      }))
                    }
                    placeholder="Residential - Luxury Villa"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="py-2">
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Islamabad, Pakistan"
                  />
                </div>
                <div>
                  <Label htmlFor="completion" className="py-2">
                    Completion Date
                  </Label>
                  <Input
                    id="completion"
                    name="completion"
                    value={formData.technicalSpecs.completion}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        technicalSpecs: { ...prev.technicalSpecs, completion: e.target.value },
                      }))
                    }
                    placeholder="July 2025"
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className="py-2">
                    Duration
                  </Label>
                  <Input
                    id="duration"
                    name="duration"
                    value={formData.technicalSpecs.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        technicalSpecs: { ...prev.technicalSpecs, duration: e.target.value },
                      }))
                    }
                    placeholder="6 Months"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="team" className="py-2">
                    Team
                  </Label>
                  <Input
                    id="team"
                    name="team"
                    value={formData.technicalSpecs.team}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        technicalSpecs: { ...prev.technicalSpecs, team: e.target.value },
                      }))
                    }
                    placeholder="5 Lighting Designers, 3 Engineers"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Testimonial Section */}
          <Card>
            <CardHeader>
              <CardTitle>What Our Client Says</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testimonialText" className="py-2">
                  Testimonial
                </Label>
                <Textarea
                  id="testimonialText"
                  name="testimonialText"
                  value={formData.clientTestimonial.text}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clientTestimonial: { ...prev.clientTestimonial, text: e.target.value },
                    }))
                  }
                  placeholder="Enter client testimonial..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="testimonialAuthor" className="py-2">
                  Client Name & Title
                </Label>
                <Input
                  id="testimonialAuthor"
                  name="testimonialAuthor"
                  value={formData.clientTestimonial.author}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clientTestimonial: { ...prev.clientTestimonial, author: e.target.value },
                    }))
                  }
                  placeholder="Mr. Ahmed Khan, Villa Owner"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              className="bg-[var(--color-logo)] text-white hover:bg-[var(--color-logo)]/90"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
