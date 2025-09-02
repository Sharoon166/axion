'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  author: string;
  tags: string[];
  published: boolean;
  createdAt: string;
}

const BlogSection = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blogs');
      const result = await response.json();

      if (result.success && result.data) {
        // Filter only published blogs and take first 3
        const publishedBlogs = result.data
          .filter((blog: BlogPost) => blog.published)
          .slice(0, 3);
        setBlogPosts(publishedBlogs);
      } else {
        console.error('Failed to fetch blogs:', result.error);
        setBlogPosts([]);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 lg:mb-16">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-main-text)] mb-2 sm:mb-4">
              From our <span className="text-[var(--color-primary-accent)]">Blog</span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-secondary-text)] px-4">
              Insights, tips, and inspiration for lighting up your world.
            </p>
          </div>
          {user?.isAdmin && (
            <Button
              onClick={() => router.push('/admin/blogs/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Blog Post
            </Button>
          )}
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse"
              >
                <div className="h-40 sm:h-44 lg:h-48 bg-gray-300"></div>
                <div className="p-4 sm:p-5 lg:p-6 space-y-3">
                  <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No Blog Posts Yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by adding your first blog post to share insights and tips.
              </p>
              {user?.isAdmin && (
                <Button
                  onClick={() => router.push('/admin/blogs/new')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Blog Post
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            {blogPosts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden block"
              >
                {/* Blog Post Image */}
                <div className="relative h-40 sm:h-44 lg:h-48 overflow-hidden">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>

                {/* Blog Post Content */}
                <div className="p-4 sm:p-5 lg:p-6">
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="inline-block bg-[var(--color-logo)] text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-semibold mb-3 sm:mb-4">
                      {post.tags[0].toUpperCase()}
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-logo)] mb-3 sm:mb-4 leading-tight line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Meta Information */}
                  <div className="text-xs sm:text-sm text-[var(--color-secondary-text)] space-y-1">
                    <p>{formatDate(post.createdAt)}</p>
                    {post.author && <p>By {post.author}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center bg-[var(--color-logo)] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium shadow-md transition-colors group text-sm sm:text-base"
          >
            Read More Articles
            <span className="ml-2 inline-block transform transition-transform duration-300 group-hover:translate-x-2">
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
