'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Search, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { useActions } from '@/hooks/useActions';
import { getImageUrl } from '@/lib/utils';

interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    author?: string;
    published: boolean;
    createdAt: string;
    updatedAt: string;
    image?: string;
    tags: string[];
}

export default function BlogsManagement() {
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        author: '',
        published: false,
        image: '',
        tags: ''
    });
    const { blog } = useActions();

    // Fetch blogs from API
    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await fetch('/api/blogs');
                if (response.ok) {
                    const result = await response.json();
                    const blogs = result.success ? result.data : [];
                    setBlogs(blogs);
                }
            } catch (error) {
                console.error('Error fetching blogs:', error);
                setBlogs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    // Filter blogs based on search and status
    const filteredBlogs = blogs.filter(blog => {
        const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'published' && blog.published) ||
            (statusFilter === 'draft' && !blog.published);
        return matchesSearch && matchesStatus;
    });

    // Generate slug from title
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const blogData = new FormData();
        blogData.append('title', formData.title);
        blogData.append('slug', formData.slug || generateSlug(formData.title));
        blogData.append('excerpt', formData.excerpt);
        blogData.append('content', formData.content);
        blogData.append('author', formData.author);
        blogData.append('published', formData.published.toString());
        blogData.append('image', formData.image);
        
        // Handle tags array
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        tagsArray.forEach(tag => blogData.append('tags', tag));

        try {
            if (editingBlog) {
                await blog.update(editingBlog._id, blogData);
            } else {
                await blog.create(blogData);
            }

            // Refresh blogs list
            const response = await fetch('/api/blogs');
            if (response.ok) {
                const result = await response.json();
                const updatedBlogs = result.success ? result.data : [];
                setBlogs(updatedBlogs);
            }

            // Reset form
            setFormData({
                title: '', slug: '', excerpt: '', content: '', author: '',
                published: false, image: '', tags: ''
            });
            setShowAddDialog(false);
            setEditingBlog(null);
        } catch (error) {
            console.error('Error saving blog:', error);
        }
    };

    // Handle edit
    const handleEdit = (blogPost: BlogPost) => {
        setEditingBlog(blogPost);
        setFormData({
            title: blogPost.title,
            slug: blogPost.slug,
            excerpt: blogPost.excerpt || '',
            content: blogPost.content,
            author: blogPost.author || '',
            published: blogPost.published,
            image: blogPost.image || '',
            tags: blogPost.tags.join(', ')
        });
        setShowAddDialog(true);
    };

    // Handle delete
    const handleDelete = async (blogId: string) => {
        if (confirm('Are you sure you want to delete this blog post?')) {
            try {
                await blog.delete(blogId);
                setBlogs(blogs.filter(b => b._id !== blogId));
            } catch (error) {
                console.error('Error deleting blog:', error);
            }
        }
    };

    // Handle status change
    const handleStatusChange = async (blogId: string, newStatus: boolean) => {
        try {
            const formData = new FormData();
            formData.append('published', newStatus.toString());
            
            await blog.update(blogId, formData);
            
            setBlogs(blogs.map(b =>
                b._id === blogId ? { ...b, published: newStatus, updatedAt: new Date().toISOString() } : b
            ));
        } catch (error) {
            console.error('Error updating blog status:', error);
        }
    };

    const getStatusColor = (published: boolean) => {
        return published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
                    <p className="text-gray-600">Create and manage your blog posts</p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <FileText className="w-4 h-4 mr-2" />
                            New Blog Post
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
                            <DialogDescription>
                                {editingBlog ? 'Update your blog post details' : 'Write a new blog post for your website'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <Input
                                        required
                                        placeholder="Enter blog post title"
                                        value={formData.title}
                                        onChange={(e) => {
                                            setFormData({ ...formData, title: e.target.value });
                                            if (!formData.slug) {
                                                setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                    <Input
                                        placeholder="url-friendly-slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                                <Textarea
                                    placeholder="Brief description of the blog post"
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <Textarea
                                    required
                                    placeholder="Write your blog post content here..."
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={8}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                                    <Input
                                        placeholder="Author name"
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                                    <Input
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                <Input
                                    placeholder="lighting, smart home, technology"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="published"
                                    checked={formData.published}
                                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                    className="rounded"
                                />
                                <label htmlFor="published" className="text-sm font-medium text-gray-700">
                                    Publish immediately
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    {editingBlog ? 'Update Post' : 'Create Post'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Posts</p>
                                <p className="text-2xl font-bold text-gray-900">{blogs.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Published</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {blogs.filter(b => b.published).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Edit className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Drafts</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {blogs.filter(b => !b.published).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Eye className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">This Month</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {blogs.filter(b => {
                                        const blogDate = new Date(b.createdAt);
                                        const now = new Date();
                                        return blogDate.getMonth() === now.getMonth() && blogDate.getFullYear() === now.getFullYear();
                                    }).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Blogs Table */}
            <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Blog Posts</h3>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search posts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-64 pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Post</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Author</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tags</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBlogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-gray-500">
                                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                <p className="text-lg font-medium">No blog posts found</p>
                                                <p className="text-sm">Create your first blog post to get started</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBlogs.map((blogPost) => (
                                            <tr key={blogPost._id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                                                            <Image
                                                                src={getImageUrl(blogPost.image || '')}
                                                                alt={blogPost.title}
                                                                width={48}
                                                                height={48}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 max-w-xs truncate">{blogPost.title}</h4>
                                                            <p className="text-sm text-gray-500 max-w-xs truncate">{blogPost.excerpt || 'No excerpt'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-gray-600">{blogPost.author || 'Anonymous'}</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {blogPost.tags.slice(0, 2).map((tag, index) => (
                                                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {blogPost.tags.length > 2 && (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                                +{blogPost.tags.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge className={`${getStatusColor(blogPost.published)} w-fit capitalize`}>
                                                        {blogPost.published ? 'Published' : 'Draft'}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4 text-gray-600">
                                                    {new Date(blogPost.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(blogPost)}
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant={blogPost.published ? "outline" : "default"}
                                                            size="sm"
                                                            onClick={() => handleStatusChange(blogPost._id, !blogPost.published)}
                                                        >
                                                            {blogPost.published ? 'Unpublish' : 'Publish'}
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(blogPost._id)}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}