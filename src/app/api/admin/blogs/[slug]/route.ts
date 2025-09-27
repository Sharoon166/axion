import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Check admin authorization
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await dbConnect();
    const { slug } = await params;
    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: blog.toObject(),
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog post' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Check admin authorization
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await dbConnect();
    const { slug } = await params;
    const formData = await request.formData();

    // Get image URL (already uploaded by frontend)
    const imageUrl = formData.get('image') as string | null;

    const updateData = {
      title: formData.get('title'),
      content: formData.get('content'),
      description: formData.get('description'),
      excerpt: formData.get('excerpt'),
      author: formData.get('author'),
      tags: formData.getAll('tags'),
      published: formData.get('published') === 'true',
      ...(imageUrl && { image: imageUrl }), // Only update image if we have a new URL
    };

    const blog = await Blog.findOneAndUpdate(
      { slug },
      updateData,
      { new: true }
    );

    if (!blog) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: blog.toObject(),
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update blog post' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Check admin authorization
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await dbConnect();
    const { slug } = await params;
    const blog = await Blog.findOneAndDelete({ slug });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete blog post' },
      { status: 500 },
    );
  }
}