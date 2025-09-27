import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Testimonial from '@/models/Testimonial';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    const query: Record<string, string | boolean | File> = { approved: true };

    // Filter by featured status if specified
    if (featured === 'true') {
      query.featured = true;
    }

    let testimonialsQuery = Testimonial.find(query).sort({ createdAt: -1 });

    // Apply limit if specified
    if (limit) {
      testimonialsQuery = testimonialsQuery.limit(Number(limit));
    }

    const testimonials = await testimonialsQuery;

    return NextResponse.json({
      success: true,
      data: testimonials.map((testimonial) => testimonial.toObject()),
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonials' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const formData = await request.formData();

    const testimonialData = {
      name: formData.get('name'),
      title: formData.get('title'),
      rating: Number(formData.get('rating')),
      text: formData.get('text'),
      image: formData.get('image'),
      featured: formData.get('featured') === 'true',
      approved: formData.get('approved') === 'true',
    };

    const testimonial = await Testimonial.create(testimonialData);

    return NextResponse.json({
      success: true,
      data: testimonial.toObject(),
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create testimonial' },
      { status: 500 },
    );
  }
}
