import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Products';
import Category from '@/models/Category';

export async function GET() {
  try {
    await dbConnect();

    const [products, categories, featuredProducts] = await Promise.all([
      Product.find({}),
      Category.find({}),
      Product.find({ featured: true }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalCategories: categories.length,
        featuredProducts: featuredProducts.length,
        products: products.map((p) => ({
          id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          featured: p.featured,
          category: p.category,
        })),
        categories: categories.map((c) => ({
          id: c._id,
          name: c.name,
          slug: c.slug,
        })),
        featured: featuredProducts.map((p) => ({
          id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.price,
        })),
      },
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to test database' }, { status: 500 });
  }
}
