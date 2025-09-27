'use client';

import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import { useState, useEffect } from 'react';
import { BlogPost } from '@/types';
import Loading from '@/loading';

interface BlogPostClientProps {
  slug: string;
}

export default function BlogPostClient({ slug }: BlogPostClientProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
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
        <Loading />
      </div>
    );
  }

  if (!post) {
    return <div className="p-10 text-center text-gray-500">Post not found</div>;
  }

  return (
    <>
      <PageHeader title="" />
      <div className="max-w-[85rem] mx-auto px-8 sm:px-14">
        <h1 className="sm:text-3xl text-2xl font-semibold capitalize mt-2 text-center">{post.title}</h1>
        <p className="text-center text-gray-500 py-2 text-sm sm:text-lg">{post.description}</p>
        <div className="flex flex-wrap items-center justify-center sm:gap-x-20 gap-2 text-sm text-gray-500 mb-8">
          <span> By {post.author || 'Admin'}</span>
          <span>|</span>
          <span>
            Published on{' '}
            {post.date
              ? new Date(post.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <span>|</span>
          <span className='capitalize'>Category: {post.tags?.join(', ') || 'BLOG'}</span>
        </div>

        {/* Hero Image Section */}
        <div className="mb-10 flex justify-center">
          <Image
            src={post.image || '/prodcut-4.jpg'}
            alt={post.title || 'Blog post'}
            width={1000}
            height={500}
            className="rounded-2xl object-cover w-full h-96 md:h-[40rem]"
          />
        </div>

        {/* Content Section */}
        <article className="prose prose-lg prose-headings:text-(--color-logo) prose-h3:text-primary text-black max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: post.content || post.description || 'No content available.',
            }}
          />
        </article>

       
      </div>
    </>
  );
}
