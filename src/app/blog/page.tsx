'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
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

const itemsPerPage = 6;

export default function BlogPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch blogs from API
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch('/api/blogs');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Only show published blogs
            const publishedBlogs = result.data.filter((blog: BlogPost) => blog.published);
            setBlogPosts(publishedBlogs);
          }
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const totalPages = Math.ceil(blogPosts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = blogPosts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <PageHeader
        title="Our"
        titleHighlight="Blog"
        subtitle="Insights, tips, and inspiration for lighting up your world."
      />

      {/* Blog Content */}
      <section className="py-20">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => router.push('/admin/blogs/new')}>
              Add Blog Post
            </Button>
          </div>
          {/* Blog Posts Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading blog posts...</p>
            </div>
          ) : currentItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
              {currentItems.map((post) => (
                <Link key={post._id} href={`/blog/${post.slug}`}>
                  <article className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                    {/* Blog Post Image */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={getImageUrl(post.image || '')}
                        alt={post.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Blog Post Content */}
                    <div className="p-6">
                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="inline-block bg-[var(--color-logo)] text-white px-3 py-1 rounded text-xs font-semibold">
                              {tag.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="text-xl font-bold text-[var(--color-logo)] mb-4 leading-tight">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta Information */}
                      <div className="text-sm text-[var(--color-secondary-text)] space-y-1">
                        <p>{new Date(post.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                        {post.author && <p>By {post.author}</p>}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto text-gray-300 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-gray-500">No blog posts found</h4>
              <p className="text-sm text-gray-400 mt-1">Check back later for new content</p>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>
    </div>
  );
}
