import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    const product = await Product.findOne({ slug })
      .populate('category', 'name slug');

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
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
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