'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, X, FileText, Save, Loader2 } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { TiptapEditor } from '@/components/ui/tiptap-editor';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/loading';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  description?: string;
  excerpt?: string;
  author?: string;
  image?: string;
  tags: string[];
  published: boolean;
}

export default function EditBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const blogSlug = params.slug as string;

  const [saving, setSaving] = useState(false);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    description: '',
    excerpt: '',
    author: '',
    tags: '',
    published: false,
  });
  const [image, setImage] = useState<string>('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const tiptapRef = useRef<{ processContentOnSubmit?: () => Promise<string> }>(null);
  const fetchBlog = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/blogs/${blogSlug}`);
      if (!response.ok) return;

      const result = await response.json();
      if (result.success && result.data) {
        const blogData = result.data;
        setBlog(blogData);
        setFormData({
          title: blogData.title || '',
          slug: blogData.slug || '',
          content: blogData.content || '',
          description: blogData.description || '',
          excerpt: blogData.excerpt || '',
          author: blogData.author || '',
          tags: blogData.tags?.join(', ') || '',
          published: blogData.published || false,
        });
        setImage(blogData.image || '');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
    }
  }, [blogSlug]); // ✅ stable function when blogSlug changes

  useEffect(() => {
    if (blogSlug) {
      fetchBlog();
    }
  }, [blogSlug, fetchBlog]); // ✅ no warning, safe

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type. Please select an image file.');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        console.error('Image size should be less than 5MB');
        return;
      }

      // Revoke previous object URL if exists
      if (image && image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImage(previewUrl);
      setNewImageFile(file);

      // Reset input to allow selecting the same file again
      e.target.value = '';
    } catch (error) {
      console.error('Error handling image upload:', error);
    }
  };

  const removeImage = () => {
    try {
      // Revoke object URL to prevent memory leaks
      if (image) {
        if (image.startsWith('blob:')) {
          URL.revokeObjectURL(image);
        }
        setImage('');
      }
      setNewImageFile(null);
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (image && image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'tags') {
          // Split tags by comma and add each one
          const tags = String(value)
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag);
          tags.forEach((tag) => formDataToSend.append('tags', tag));
        } else {
          formDataToSend.append(key, String(value));
        }
      });

      // Process editor content and upload images
      let processedContent = formData.content;
      if (tiptapRef.current?.processContentOnSubmit) {
        processedContent = await tiptapRef.current.processContentOnSubmit();
        formDataToSend.set('content', processedContent);
      }

      // Handle cover image upload
      if (newImageFile) {
        // Upload new image first
        const uploadFormData = new FormData();
        uploadFormData.append('file', newImageFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          formDataToSend.append('image', uploadResult.url);
        } else {
          const errorResult = await uploadResponse.json();
          throw new Error(`Cover image upload failed: ${errorResult.error || 'Unknown error'}`);
        }
      } else if (image && !image.startsWith('blob:')) {
        // Keep existing image
        formDataToSend.append('image', image);
      }

      const response = await fetch(`/api/admin/blogs/${blogSlug}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (response.ok) {
        // Cleanup object URL
        if (image && image.startsWith('blob:')) {
          URL.revokeObjectURL(image);
        }

        router.push('/admin/blogs');
      }
    } catch (error) {
      console.error('Error updating blog post:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return <div className="p-8 text-center text-red-500">Not authorized</div>;
  }

  if (!blog) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-[85rem]  mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog Posts
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
          <p className="text-gray-600 mt-2">Update your blog post content</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Featured Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                  {image ? (
                    <div className="relative w-full h-full">
                      {image.startsWith('blob:') ? (
                        <Image
                          src={image}
                          alt="Featured image"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={getImageUrl(image)}
                          alt="Featured image"
                          fill
                          className="object-cover"
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload Featured Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Blog Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Blog Post Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      required
                      placeholder="Enter blog post title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      placeholder="blog-post-slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Max 300 characters)</Label>
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
                      maxLength={300}
                    />
                    <p className="text-xs text-gray-500">
                      {formData.description.length}/300 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        placeholder="Author name"
                        value={formData.author}
                        onChange={(e) => handleInputChange('author', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        placeholder="technology, design, business"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="published"
                      checked={formData.published}
                      onCheckedChange={(checked) =>
                        handleInputChange('published', checked as boolean)
                      }
                    />
                    <Label htmlFor="published">Published</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
            </div>
          </div>
          <Card className="row-span-2">
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="content">Blog Content *</Label>
                <TiptapEditor
                  ref={tiptapRef}
                  content={formData.content}
                  onChange={(html) => handleInputChange('content', html)}
                  placeholder="Write your blog content here..."
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
              type="submit"
              disabled={saving || !formData.title || !formData.content}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
