import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Blog from '@/models/Blog';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const total = await Blog.countDocuments({});
    
    // Get blogs with pagination
    const blogs = await Blog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: blogs.map((blog) => blog.toObject()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const formData = await request.formData();

    const blogData = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      content: formData.get('content'),
      description: formData.get('description'),
      excerpt: formData.get('excerpt'),
      author: formData.get('author'),
      tags: formData.getAll('tags'),
      published: formData.get('published') === 'true',
      image: formData.get('image'),
    };

    const blog = await Blog.create(blogData);

    return NextResponse.json({
      success: true,
      data: blog.toObject(),
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ success: false, error: 'Failed to create blog' }, { status: 500 });
  }
}
