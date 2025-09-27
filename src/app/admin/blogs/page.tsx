'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
} from 'lucide-react';
import { api } from '@/lib/api';
import BlogCard from '@/components/BlogCard';
import Loading from '@/loading';

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
    <div className="min-h-screen p-6">
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
         <Loading/>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBlogs.map((blog) => (
              <div key={blog._id} className="space-y-2">
                <BlogCard
                  href={`/blog/${blog.slug}`}
                  image={blog.image}
                  title={blog.title}
                  description={blog.excerpt || blog.content}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/admin/blogs/${blog.slug}/edit`)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
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
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredBlogs.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}