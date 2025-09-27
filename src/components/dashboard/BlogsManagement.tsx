'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/utils';
import Loading from '@/loading';
import Pagination from '@/components/Pagination';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  description?: string;
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
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch blogs from API
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        console.log('Fetching blogs from /api/blogs...');
        const response = await fetch('/api/blogs');
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Expected JSON but got:', text);
          throw new Error('Server returned non-JSON response');
        }

        const result = await response.json();
        console.log('API response:', result);

        if (result.success) {
          setBlogs(result.data || []);
        } else {
          console.error('API returned error:', result.error);
          setBlogs([]);
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

  // Filter blogs based on search
  const filteredBlogs = blogs.filter((blog) => {
    return (
      blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.tags && blog.tags.some((tag) => tag?.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBlogs = filteredBlogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle delete
  const handleDelete = async (blogSlug: string) => {
    {
      try {
        const response = await fetch(`/api/admin/blogs/${blogSlug}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setBlogs(blogs.filter((b) => b.slug !== blogSlug));
        }
      } catch (error) {
        console.error('Error deleting blog:', error);
      }
    }
  };

  const getStatusColor = (published: boolean) => {
    return published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
          <p className="text-gray-600">Create and manage your blog posts</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user?.isAdmin && (
            <>
              <Link href="/admin/blogs/new" className="w-full sm:w-auto">
                <Button className="bg-[#0077B6] hover:bg-[#0077B6]/90 w-full sm:w-auto">
                  <FileText className="w-4 h-4 mr-2" />
                  New Blog Post
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Blogs Table */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Blog Posts</h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredBlogs.length === 0
                  ? 'No posts found'
                  : `Showing ${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, filteredBlogs.length)} of ${filteredBlogs.length} posts`}
              </p>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Post</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tags</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBlogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No blog posts found</p>
                        <p className="text-sm">Create your first blog post to get started</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedBlogs.map((blogPost) => (
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
                              <h4 className="font-medium text-gray-900 max-w-xs truncate">
                                {blogPost.title}
                              </h4>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {blogPost.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                              >
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
                          <Badge
                            className={`${getStatusColor(blogPost.published)} w-fit capitalize`}
                          >
                            {blogPost.published ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(blogPost.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/blogs/${blogPost.slug}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-3 h-3" />
                              </Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(blogPost.slug)}
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

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {paginatedBlogs.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No blog posts found</p>
                    <p className="text-sm">Create your first blog post to get started</p>
                  </div>
                ) : (
                  paginatedBlogs.map((blogPost) => (
                    <Card key={blogPost._id} className="overflow-hidden">
                      <div className="relative">
                        <div className="h-32 bg-gray-100 overflow-hidden">
                          <Image
                            src={getImageUrl(blogPost.image || '')}
                            alt={blogPost.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge className={`${getStatusColor(blogPost.published)} capitalize`}>
                            {blogPost.published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{blogPost.title}</h3>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span>{blogPost.author || 'Anonymous'}</span>
                          <span>{new Date(blogPost.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {blogPost.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {blogPost.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{blogPost.tags.length - 3}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between gap-2">
                          <Link href={`/admin/blogs/${blogPost.slug}/edit`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </Link>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(blogPost.slug)}
                            className="flex-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Pagination - Always show when not loading */}
          {!loading && (
            <div className='flex items-center justify-end'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
