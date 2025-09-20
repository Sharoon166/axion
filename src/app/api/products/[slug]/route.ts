import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Enhanced connection with retry
    let retries = 3;
    while (retries > 0) {
      try {
        await Promise.race([
          dbConnect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 8000)),
        ]);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const { slug } = await params;
    
    if (!slug || slug === 'undefined' || slug === 'null') {
      return NextResponse.json(
        { success: false, error: 'Valid product slug is required' },
        { status: 400 }
      );
    }

    try {
      // Try with population first
      const product = await Product.findOne({ slug })
        .populate({
          path: 'category',
          select: 'name slug',
          options: { strictPopulate: false }
        });

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: product.toObject(),
      });
    } catch (populationError) {
      console.warn('Population failed, trying without:', populationError);
      
      // Fallback: try without population
      const product = await Product.findOne({ slug });

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: product.toObject(),
        warning: 'Fetched without category population due to error'
      });
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    
    if (error instanceof Error && error.message === 'DB timeout') {
      return NextResponse.json(
        { success: false, error: 'Database connection timeout. Please try again.' },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch product. Please check your connection and try again.' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    const formData = await request.formData();

    // Only include fields that are present in formData
    const updateData: Partial<{
      name: string | undefined | null;
      price: number | undefined | null;
      description: string | undefined | null;
      stock: number | undefined | null;
      featured: boolean | undefined | null;
      images: string[] | undefined | null;
      colors: string[] | undefined | null;
    }> = {};
    if (formData.has('name')) updateData.name = formData.get('name') as string;
    if (formData.has('price')) updateData.price = Number(formData.get('price'));
    if (formData.has('description')) updateData.description = formData.get('description') as string;
    if (formData.has('stock')) updateData.stock = Number(formData.get('stock'));
    if (formData.has('featured')) updateData.featured = formData.get('featured') === 'true';
    const images = formData.getAll('images');
    if (images && images.length > 0) updateData.images = images as string[];
    const colors = formData.getAll('colors');
    if (colors && colors.length > 0) updateData.colors = colors as string[];

    const product = await Product.findOneAndUpdate(
      { slug },
      updateData,
      { new: true }
    ).populate('category', 'name slug');

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product.toObject(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    const product = await Product.findOneAndDelete({ slug });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 },
    );
  }
}