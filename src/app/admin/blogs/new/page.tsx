'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Upload,
    X,
    CloudUpload,
    CheckCircle,
    AlertCircle
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
        category: '',
        tags: '',
        published: false
    });
    const [markdownContent, setMarkdownContent] = useState('');
    const [coverImage, setCoverImage] = useState<string>('');
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [additionalImages, setAdditionalImages] = useState<string[]>([]);
    const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
    
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
        message: ''
    });

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

    const showDialog = (type: 'success' | 'error' | 'info', title: string, message: string, onConfirm?: () => void) => {
        setDialogState({
            isOpen: true,
            type,
            title,
            message,
            onConfirm
        });
    };

    const closeDialog = () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
    };

    const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showDialog('error', 'Upload Error', 'Image size should be less than 5MB');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showDialog('error', 'Invalid File', 'Please select a valid image file');
            return;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setCoverImage(previewUrl);
        setCoverImageFile(file);
        showDialog('success', 'Upload Successful', 'Cover image uploaded successfully!');
    };

    const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const validFiles: File[] = [];
        const previewUrls: string[] = [];
        const errors: string[] = [];

        files.forEach(file => {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                errors.push(`${file.name}: Image size should be less than 5MB`);
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                errors.push(`${file.name}: Please select a valid image file`);
                return;
            }

            validFiles.push(file);
            previewUrls.push(URL.createObjectURL(file));
        });

        if (errors.length > 0) {
            showDialog('error', 'Upload Errors', errors.join('\n'));
        }

        if (validFiles.length > 0) {
            setAdditionalImages(prev => [...prev, ...previewUrls]);
            setAdditionalImageFiles(prev => [...prev, ...validFiles]);
            showDialog('success', 'Upload Successful', `${validFiles.length} image(s) uploaded successfully!`);
        }
    };

    const removeCoverImage = () => {
        if (coverImage && coverImage.startsWith('blob:')) {
            URL.revokeObjectURL(coverImage);
        }
        setCoverImage('');
        setCoverImageFile(null);
    };

    const removeAdditionalImage = (index: number) => {
        const imageUrl = additionalImages[index];
        if (imageUrl && imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl);
        }
        
        setAdditionalImages(prev => prev.filter((_, i) => i !== index));
        setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
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

            // Add markdown content if available
            if (markdownContent) {
                formDataToSend.append('markdown', markdownContent);
            }

            // Upload cover image if exists
            if (coverImageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', coverImageFile);

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    formDataToSend.append('image', uploadResult.url);
                }
            }

            // Upload additional images if exist
            if (additionalImageFiles.length > 0) {
                const additionalImageUrls: string[] = [];
                
                for (const file of additionalImageFiles) {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);

                    const uploadResponse = await fetch('/api/upload', {
                        method: 'POST',
                        body: uploadFormData,
                    });

                    if (uploadResponse.ok) {
                        const uploadResult = await uploadResponse.json();
                        additionalImageUrls.push(uploadResult.url);
                    }
                }

                additionalImageUrls.forEach(url => {
                    formDataToSend.append('additionalImages', url);
                });
            }

            const result = await api.blogs.create(formDataToSend);

            if (result.success) {
                // Cleanup object URLs
                if (coverImage && coverImage.startsWith('blob:')) {
                    URL.revokeObjectURL(coverImage);
                }
                
                additionalImages.forEach(url => {
                    if (url.startsWith('blob:')) {
                        URL.revokeObjectURL(url);
                    }
                });

                showDialog(
                    'success', 
                    'Blog Published Successfully', 
                    'Your blog post has been created and published successfully!',
                    () => router.push('/admin/blogs')
                );
            }
        } catch (error) {
            console.error('Error creating blog post:', error);
            showDialog(
                'error', 
                'Publication Failed', 
                'There was an error creating your blog post. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                                    Category
                                </Label>
                                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
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
                                content={formData.content}
                                onChange={(content) => handleInputChange('content', content)}
                                onMarkdownChange={setMarkdownContent}
                                placeholder="Write your blog content here..."
                            />
                        </div>
                    </div>

                    {/* Media Upload Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Cover Image */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Media Upload</h3>
                            
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
                                        <p className="text-gray-600 mb-2">Drag or drop a coverage</p>
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

                        {/* Additional Images */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Additional Images (Optional)</h3>
                            
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                {additionalImages.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {additionalImages.map((image, index) => (
                                            <div key={index} className="relative">
                                                <Image
                                                    src={image}
                                                    alt={`Additional image ${index + 1}`}
                                                    width={120}
                                                    height={80}
                                                    className="rounded-lg object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeAdditionalImage(index)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
                                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500">Add More</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleAdditionalImagesUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer block">
                                        <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 mb-2">Drag or drop Images</p>
                                        <p className="text-gray-500 text-sm mb-4">or click to upload</p>
                                        <p className="text-gray-400 text-xs">(Optional)</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleAdditionalImagesUpload}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 pt-8">
                        <Button
                            type="submit"
                            disabled={loading || !formData.title || !formData.content}
                            onClick={() => handleInputChange('published', true)}
                            className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            ) : null}
                            Publish Blog
                        </Button>
                        
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={loading || !formData.title || !formData.content}
                            onClick={() => handleInputChange('published', false)}
                            className="px-8 py-2"
                        >
                            Save as Draft
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
                            {dialogState.type === 'success' && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            {dialogState.type === 'error' && (
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                            {dialogState.type === 'info' && (
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                            )}
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
                            <Button onClick={closeDialog}>
                                OK
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}