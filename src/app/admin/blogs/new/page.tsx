'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TiptapEditor } from '@/components/ui/tiptap-editor';
import { X, CloudUpload, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function NewBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    description: '',
    category: '',
    tags: '',
    published: false,
  });
  const [markdownContent, setMarkdownContent] = useState('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const tiptapRef = useRef<{ processContentOnSubmit?: () => Promise<string> }>(null);

  // Dialog states
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  // 1) Auth check — keep above any early returns
  useEffect(() => {
    if (loading) return;
    if (user?.role === 'admin') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      router.replace('/');
    }
  }, [loading, user, router]);

  // 2) Clean up object URLs — also above any early returns
  useEffect(() => {
    const currentCoverImage = coverImage;
    return () => {
      if (currentCoverImage && currentCoverImage.startsWith('blob:')) {
        URL.revokeObjectURL(currentCoverImage);
      }
    };
  }, [coverImage]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from title
      if (field === 'title' && typeof value === 'string') {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      return next;
    });
  };

  const showDialog = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string,
    onConfirm?: () => void,
  ) => {
    setDialogState({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showDialog('error', 'Invalid File', 'Please select a valid image file (JPEG, PNG, WebP, etc.)');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showDialog('error', 'File Too Large', 'Image size should be less than 5MB');
        return;
      }

      // Revoke previous object URL if exists
      if (coverImage && coverImage.startsWith('blob:')) {
        URL.revokeObjectURL(coverImage);
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setCoverImage(previewUrl);
      setCoverImageFile(file);

      showDialog('success', 'Upload Successful', 'Cover image uploaded successfully!');
      e.target.value = '';
    } catch (error) {
      console.error('Error handling cover image upload:', error);
      showDialog('error', 'Upload Error', 'An error occurred while processing the image');
    }
  };

  const removeCoverImage = () => {
    try {
      if (coverImage && coverImage.startsWith('blob:')) {
        URL.revokeObjectURL(coverImage);
      }
      setCoverImage('');
      setCoverImageFile(null);
    } catch (error) {
      console.error('Error removing cover image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingState(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'tags') {
          const tags = String(value)
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag);
          tags.forEach((tag) => formDataToSend.append('tags', tag));
        } else {
          formDataToSend.append(key, String(value));
        }
      });

      if (markdownContent) {
        formDataToSend.append('markdown', markdownContent);
      }

      // Add author from localStorage
      let authorName = '';
      if (typeof window !== 'undefined') {
        const userDataRaw = localStorage.getItem('userdata');
        if (userDataRaw) {
          try {
            const userData = JSON.parse(userDataRaw);
            authorName = userData?.name || '';
          } catch { }
        }
      }
      formDataToSend.append('author', authorName);

      // Upload cover image if exists
      if (coverImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', coverImageFile);
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: uploadFormData });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          formDataToSend.append('image', uploadResult.url);
        } else {
          const errorResult = await uploadResponse.json();
          throw new Error(`Image upload failed: ${errorResult.error || 'Unknown error'}`);
        }
      }

      // Process editor content and upload images
      let processedContent = formData.content;
      if (tiptapRef.current?.processContentOnSubmit) {
        processedContent = await tiptapRef.current.processContentOnSubmit();
        formDataToSend.set('content', processedContent);
      }

      const result = await api.blogs.create(formDataToSend);

      if (result.success) {
        if (coverImage && coverImage.startsWith('blob:')) {
          URL.revokeObjectURL(coverImage);
        }

        showDialog(
          'success',
          'Blog Published Successfully',
          'Your blog post has been created and published successfully!',
          () => router.push('/admin/blogs'),
        );
      }
    } catch (error) {
      console.error('Error creating blog post:', error);
      showDialog(
        'error',
        'Publication Failed',
        'There was an error creating your blog post. Please try again.',
      );
    } finally {
      setLoadingState(false);
    }
  };

  // Early return comes AFTER all hooks
  if (loading || !isAuthorized) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Blog</h1>
          <p className="text-gray-600">Create and publish a new blog post easily</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Blog Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Blog Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Blog Title
                </Label>
                <Input
                  id="title"
                  required
                  placeholder="Enter blog title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium text-gray-700">
                  Slug (optional)
                </Label>
                <Input
                  id="slug"
                  placeholder="blog-post-slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description (Max 300 characters)
              </Label>
              <Input
                id="description"
                placeholder="Brief description of the blog post"
                value={formData.description}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 300) {
                    handleInputChange('description', value);
                  }
                }}
                className="w-full"
                maxLength={300}
              />
              <p className="text-xs text-gray-500">{formData.description.length}/300 characters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
                  Tags
                </Label>
                <Input
                  id="tags"
                  placeholder="technology, design, business"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Blog Content Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Blog Content</h2>
            <div className="border border-gray-200 rounded-lg">
              <TiptapEditor
                ref={tiptapRef}
                content={formData.content}
                onChange={(content) => handleInputChange('content', content)}
                onMarkdownChange={setMarkdownContent}
                placeholder="Write your blog content here..."
              />
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Cover Image</h3>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                {coverImage ? (
                  <div className="relative">
                    <Image
                      src={coverImage}
                      alt="Cover image"
                      width={300}
                      height={200}
                      className="mx-auto rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeCoverImage}
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Drag or drop a cover image</p>
                    <p className="text-gray-500 text-sm mb-4">or click to upload</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <p className="text-xs text-gray-500">Recommended Size: 1200 × 600 Pixels</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-8">
            <Button
              type="submit"
              disabled={loadingState || !formData.title || !formData.content}
              onClick={() => handleInputChange('published', true)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
            >
              {loadingState ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              ) : null}
              Publish Blog
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="px-8 py-2"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Dialog Component */}
      <Dialog open={dialogState.isOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogState.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {dialogState.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {dialogState.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
              {dialogState.title}
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {dialogState.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {dialogState.onConfirm ? (
              <>
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    dialogState.onConfirm?.();
                    closeDialog();
                  }}
                  className={dialogState.type === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  Continue
                </Button>
              </>
            ) : (
              <Button onClick={closeDialog}>OK</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}