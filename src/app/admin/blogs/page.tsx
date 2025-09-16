'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { api } from '@/lib/api';
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
  createdAt: string;
  updatedAt: string;
}

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const result = await api.blogs.getAll();
      if (result.success) {
        setBlogs(result.data as Blog[] || []);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
     {
      const result = await api.blogs.delete(slug);
      if (result.success) {
        setBlogs(blogs.filter(b => b.slug !== slug));
      }
    }
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.tags?.some(tag => tag?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
              <p className="text-gray-600 mt-2">Manage your blog content</p>
            </div>
            <Button 
              onClick={() => router.push('/admin/blogs/new')}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search blog posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Blogs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first blog post'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => router.push('/admin/blogs/new')}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBlogs.map((blog) => (
              <Card key={blog._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Blog Image */}
                    <div className="flex-shrink-0 w-full md:w-auto">
                      <div className="w-full md:w-32 h-48 md:h-24 bg-gray-100 rounded-lg overflow-hidden">
                        {blog.image ? (
                          <Image
                            src={getImageUrl(blog.image)}
                            alt={blog.title}
                            width={128}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Blog Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {blog.title}
                          </h3>
                          
                          {blog.excerpt && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {blog.excerpt}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            {blog.author && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {blog.author}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(blog.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Tags */}
                          {blog.tags && blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {blog.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge variant={blog.published ? 'default' : 'secondary'}>
                              {blog.published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4 md:mt-0 md:ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/blog/${blog.slug}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/blogs/${blog.slug}/edit`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(blog.slug)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredBlogs.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{filteredBlogs.length}</p>
                  <p className="text-sm text-gray-500">Total Posts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredBlogs.filter(b => b.published).length}
                  </p>
                  <p className="text-sm text-gray-500">Published</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {filteredBlogs.filter(b => !b.published).length}
                  </p>
                  <p className="text-sm text-gray-500">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}