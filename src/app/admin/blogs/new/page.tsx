'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    Save
} from 'lucide-react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

export default function NewBlogPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Auto-generate slug from title
        if (field === 'title' && typeof value === 'string') {
            const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            setFormData(prev => ({
                ...prev,
                slug
            }));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setImage(previewUrl);
        setImageFile(file);
    };

    const removeImage = () => {
        if (image && image.startsWith('blob:')) {
            URL.revokeObjectURL(image);
        }
        setImage('');
        setImageFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

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

            // Upload image if exists
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', imageFile);

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    formDataToSend.append('image', uploadResult.url);
                }
            }

            const result = await api.blogs.create(formDataToSend);

            if (result.success) {
                // Cleanup object URL

                if (image && image.startsWith('blob:')) {
                    URL.revokeObjectURL(image);
                }

                router.push('/admin/blogs');
            }
        } catch (error) {
            console.error('Error creating blog post:', error);
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-3xl font-bold text-gray-900">Create New Blog Post</h1>
                    <p className="text-gray-600 mt-2">Share your insights and knowledge</p>
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
                                                src={image}
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
                                        <Label htmlFor="published">Publish immediately</Label>
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
                            disabled={loading || !formData.title || !formData.content}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {formData.published ? 'Publish Post' : 'Save Draft'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}