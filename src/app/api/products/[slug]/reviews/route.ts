import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Products';
import Review from '@/models/Review';
interface ReviewType {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  productId: string;
  productSlug: string;
  rating: number;
  comment: string;
  images?: string[];
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    
    const { userId, userName, userEmail, userImage, rating, comment, images } = await request.json();
    
    if (!userId || !userName || !userEmail || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }
    
    // Validate images array if provided
    if (images && !Array.isArray(images)) {
      return NextResponse.json(
        { success: false, error: 'Images must be an array' },
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
    const reviewData: ReviewType = {
      userId,
      userName,
      userEmail,
      userImage: userImage || '',
      productId: product._id.toString(),
      productSlug: slug,
      rating: Number(rating),
      comment,
    };

    // Only add images if they exist and are valid
    if (Array.isArray(images) && images.length > 0) {
      reviewData.images = images.filter(img => typeof img === 'string' && img.trim() !== '');
    } else {
      reviewData.images = [];
    }

    const newReview = await Review.create(reviewData);

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

    // Find the product by slug
    const product = await Product.findOne({ slug });
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get all reviews for this product, sorted by newest first
    const reviews = await Review.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .lean();

    // Ensure each review has an images array, even if empty
    const reviewsWithImages = reviews.map(review => ({
      ...review,
      images: Array.isArray(review.images) ? review.images : []
    }));

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviewsWithImages,
        rating: averageRating,
        numReviews: reviews.length,
      },
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
