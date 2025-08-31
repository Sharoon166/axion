'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ArrowLeft,
    Upload,
    X,
    FileText,
    Save,
    Loader2
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface Blog {
    _id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    author?: string;
    image?: string;
    tags: string[];
    published: boolean;
}

export default function EditBlogPage() {
    const router = useRouter();
    const params = useParams();
    const blogSlug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [blog, setBlog] = useState<Blog | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        author: '',
        tags: '',
        published: false
    });
    const [image, setImage] = useState<string>('');
    const [newImageFile, setNewImageFile] = useState<File | null>(null);

    useEffect(() => {
        if (blogSlug) {
            fetchBlog();
        }
    }, [blogSlug]);

    const fetchBlog = async () => {
        try {
            const response = await fetch(`/api/admin/blogs/${blogSlug}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    const blogData = result.data;
                    setBlog(blogData);
                    setFormData({
                        title: blogData.title || '',
                        slug: blogData.slug || '',
                        content: blogData.content || '',
                        excerpt: blogData.excerpt || '',
                        author: blogData.author || '',
                        tags: blogData.tags?.join(', ') || '',
                        published: blogData.published || false
                    });
                    setImage(blogData.image || '');
                }
            }
        } catch (error) {
            console.error('Error fetching blog:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setImage(previewUrl);
        setNewImageFile(file);
    };

    const removeImage = () => {
        if (image && image.startsWith('blob:')) {
            URL.revokeObjectURL(image);
        }
        setImage('');
        setNewImageFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const formDataToSend = new FormData();

            // Add form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'tags') {
                    // Split tags by comma and add each one
                    const tags = String(value).split(',').map(tag => tag.trim()).filter(tag => tag);
                    tags.forEach(tag => formDataToSend.append('tags', tag));
                } else {
                    formDataToSend.append(key, String(value));
                }
            });

            // Handle image
            if (newImageFile) {
                // Upload new image
                const uploadFormData = new FormData();
                uploadFormData.append('file', newImageFile);

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    formDataToSend.append('image', uploadResult.url);
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
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading blog post...</span>
                </div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Blog post not found</h2>
                    <Button onClick={() => router.push('/admin/blogs')}>
                        Back to Blog Posts
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
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
                                            <Image
                                                src={getImageUrl(image)}
                                                alt="Featured image"
                                                fill
                                                className="object-cover"
                                            />
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

                                    <div className="space-y-2">
                                        <Label htmlFor="excerpt">Excerpt</Label>
                                        <Textarea
                                            id="excerpt"
                                            placeholder="Brief summary of your blog post..."
                                            rows={3}
                                            value={formData.excerpt}
                                            onChange={(e) => handleInputChange('excerpt', e.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="published"
                                            checked={formData.published}
                                            onCheckedChange={(checked) => handleInputChange('published', checked as boolean)}
                                        />
                                        <Label htmlFor="published">Published</Label>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Content */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Content</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Label htmlFor="content">Blog Content *</Label>
                                        <Textarea
                                            id="content"
                                            required
                                            placeholder="Write your blog content here..."
                                            rows={12}
                                            value={formData.content}
                                            onChange={(e) => handleInputChange('content', e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
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