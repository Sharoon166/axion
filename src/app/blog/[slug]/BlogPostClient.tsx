'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BlogPostClientProps {
  slug: string;
}

export default function BlogPostClient({ slug }: BlogPostClientProps) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/blogs/${slug}`);
        if (response.ok) {
          const result = await response.json();
          const post = result.success ? result.data : null;
          setPost(post);
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!post) {
    return <div className="p-10 text-center text-gray-500">Post not found</div>;
  }

  return (
    <div className="max-w-[85rem] mx-auto px-4">
      {/* Header Section with PageHeader */}
      <PageHeader
        title={post.title?.split(' ').slice(0, -2).join(' ') || 'Blog'}
        titleHighlight={post.title?.split(' ').slice(-2).join(' ') || 'Post'}
        subtitle={post.excerpt || ''}
      />
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 mb-8">
        <span>{post.author || 'Admin'}</span>
        <span className="w-1 h-1 bg-gray-400 rounded-full mx-2"></span>
        <span>{post.date ? new Date(post.date).toLocaleDateString() : new Date().toLocaleDateString()}</span>
        <span className="w-1 h-1 bg-gray-400 rounded-full mx-2"></span>
        <span>{post.category || 'BLOG'}</span>
      </div>

      {/* Hero Image Section */}
      <div className="mb-10 flex justify-center">
        <Image
          src={post.image || '/prodcut-4.jpg'}
          alt={post.title || 'Blog post'}
          width={1200}
          height={500}
          className="rounded-2xl object-cover w-full h-96 md:h-[40rem]"
        />
      </div>

      {/* Content Section */}
      <article className="prose prose-lg prose-headings:text-(--color-logo) prose-h3:text-primary text-black max-w-none">
        <div dangerouslySetInnerHTML={{ __html: post.content || post.description || 'No content available.' }} />
      </article>

      {/* Call-to-Action Section */}
      <div className="my-16 text-center">
        <h2 className="text-(--color-logo) text-2xl font-bold mb-4">
          Ready to Upgrade Your Home with Smart Lighting?
        </h2>
        <p className="text-gray-600 mb-6">
          Contact us today to start your journey toward a smarter, brighter home.
        </p>
        <Button className="bg-(--color-logo) hover:bg-(--color-logo)/80 rounded-xl group">
          Start Your Project{' '}
          <ArrowRight className="group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  );
}