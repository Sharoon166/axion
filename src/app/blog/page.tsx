import PageHeader from '@/components/PageHeader';
import BlogCard from '@/components/BlogCard';

type ApiBlog = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  author?: string;
  tags?: string[];
  published?: boolean;
  content?: string;
  createdAt?: string;
};

async function getBlogs(): Promise<ApiBlog[]> {
  // Ensure we always fetch fresh content from the server
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/blogs`, {
    cache: 'no-store',
    // If NEXT_PUBLIC_SITE_URL is not set, fallback to relative URL at runtime
    // (Next.js will resolve it correctly in production; for dev it’s fine too)
    next: { revalidate: 0 },
  }).catch(async () => {
    // Fallback to relative URL in case absolute URL is not configured
    return fetch('/api/blogs', { cache: 'no-store', next: { revalidate: 0 } });
  });

  if (!res.ok) {
    console.error('Failed to fetch blogs:', res.statusText);
    return [];
  }

  const json = await res.json();
  if (!json?.success || !Array.isArray(json?.data)) return [];
  return json.data as ApiBlog[];
}

export default async function BlogPage() {
  const blogs = (await getBlogs()).filter((b) => b.published);

  return (
    <div className="max-w-[85rem] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
      <PageHeader title="Blog" subtitle="Insights, updates, and stories from the Axion team" />
      {blogs.length === 0 ? (
        <div className="mt-8 text-center text-gray-600">No blog posts found.</div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((post) => (
            <BlogCard
              key={post._id}
              href={`/blog/${post.slug}`}
              image={post.image}
              title={post.title}
              description={post.content}
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
      )}
    </div>
  );
}
