'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import BlogCard from '@/components/BlogCard';
import Pagination from '@/components/Pagination';
import Loading from '@/loading';

type ApiBlog = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  excerpt?: string;
  image?: string;
  author?: string;
  tags?: string[];
  published?: boolean;
  content?: string;
  createdAt?: string;
};

export default function BlogPage() {
  const [blogs, setBlogs] = useState<ApiBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 6;

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json?.data)) {
            setBlogs(json.data.filter((b: ApiBlog) => b.published));
          }
        }
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(blogs.length / blogsPerPage);
  const startIndex = (currentPage - 1) * blogsPerPage;
  const endIndex = startIndex + blogsPerPage;
  const currentBlogs = blogs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center jutify-center">
        <Loading></Loading>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Our Blogs" subtitle="Insights, updates, and stories from the Axion team" />
      <div className="max-w-[85rem] mx-auto px-8 sm:px-6">
        {blogs.length === 0 ? (
          <div className="mt-8 text-center text-gray-600">No blog posts found.</div>
        ) : (
          <>
            {/* Blog Grid - Responsive */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {currentBlogs.map((post) => (
                <BlogCard
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  image={post.image}
                  title={post.title}
                  description={post.description || post.excerpt || post.content}
                  date={
                    post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                        })
                      : undefined
                  }
                />
              ))}
            </div>

            {/* Pagination - Always show */}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(totalPages, 1)} // Ensure at least 1 page
              onPageChange={goToPage}
            />
          </>
        )}
      </div>
    </>
  );
}
