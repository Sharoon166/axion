import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Products';

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({}).sort({ name: 1 });

    // Aggregate product counts per category
    const counts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>(
      counts.map((c) => [String(c._id), c.count])
    );

    return NextResponse.json({
      success: true,
      data: categories.map((cat) => {
        const obj = cat.toObject();
        const id = String(cat._id);
        return { ...obj, productCount: countMap.get(id) || 0 };
      }),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    // Generate slug from name if not provided
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const categoryData = {
      name: body.name,
      slug: slug,
      description: body.description || '',
      image: body.image || null,
      subcategories: Array.isArray(body.subcategories) ? body.subcategories.filter(Boolean) : [],
    };

    const category = await Category.create(categoryData);

    return NextResponse.json({
      success: true,
      data: category.toObject(),
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 },
    );
  }
}
