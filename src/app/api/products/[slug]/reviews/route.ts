import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Products';
import Review from '@/models/Review';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    
    const { userId, userName, userEmail, rating, comment } = await request.json();
    
    if (!userId || !userName || !userEmail || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const { slug } = await params;
    const product = await Product.findOne({ slug });
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ 
      userId, 
      productId: product._id 
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // Create new review in Review collection
    const newReview = await Review.create({
      userId,
      userName,
      userEmail,
      productId: product._id,
      productSlug: slug,
      rating: Number(rating),
      comment
    });

    // Update product rating and review count
    const reviews = await Review.find({ productId: product._id });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    
    await Product.findByIdAndUpdate(product._id, {
      rating: totalRating / reviews.length,
      numReviews: reviews.length
    });

    return NextResponse.json({
      success: true,
      message: 'Review added successfully',
      data: newReview
    });

  } catch (error) {
    console.error('Error adding review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add review' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    
    const { slug } = await params;
    const product = await Product.findOne({ slug });
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch reviews from Review collection
    const reviews = await Review.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews,
        rating: product.rating || 0,
        numReviews: product.numReviews || 0
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
