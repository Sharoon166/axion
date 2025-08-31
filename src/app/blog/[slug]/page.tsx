import BlogPostClient from './BlogPostClient';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;

  return <BlogPostClient slug={slug} />;
}
