import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Products';
import Category from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');
    const idsParam = searchParams.get('ids');

    const query: Record<string, string | boolean | File> = {};

    // If explicit IDs are provided, fetch those products and return early
    if (idsParam) {
      const rawIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (rawIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      const products = await Product.find({ _id: { $in: rawIds } })
        .populate('category', 'name slug')
        .lean();
      // Preserve input order
      const orderMap = new Map(rawIds.map((id, idx) => [id, idx]));
      const sorted = products
        .map((p) => ({ p, idx: orderMap.get(String(p._id)) ?? 0 }))
        .sort((a, b) => a.idx - b.idx)
        .map(({ p }) => p);
      return NextResponse.json({ success: true, data: sorted });
    }

    // Filter by featured status if specified
    if (featured === 'true') {
      query.featured = true;
    }

    // Filter by category if specified
    if (category) {
      // Find category by slug
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        // Return empty array if category not found
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Category not found'
        });
      }
    }

    let productsQuery = Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    // Apply limit if specified
    if (limit) {
      productsQuery = productsQuery.limit(Number(limit));
    }

    const products = await productsQuery;

    return NextResponse.json({
      success: true,
      data: products.map((product) => product.toObject()),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const formData = await request.formData();

    // Handle category - find by name and get ObjectId
    const categoryName = formData.get('category') as string;
    let categoryId = null;

    if (categoryName && categoryName !== 'Create New Category...') {
      const category = await Category.findOne({ name: categoryName });
      if (category) {
        categoryId = category._id;
      } else {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 400 });
      }
    }

    // Parse specifications
    const specificationsData = formData.get('specifications');
    let specifications = [];
    if (specificationsData) {
      try {
        specifications = JSON.parse(specificationsData as string);
      } catch (error) {
        console.error('Error parsing specifications:', error);
      }
    }

    // Parse shipping data
    const shippingData = formData.get('shipping');
    let shipping = {};
    if (shippingData) {
      try {
        shipping = JSON.parse(shippingData as string);
      } catch (error) {
        console.error('Error parsing shipping data:', error);
      }
    }

    // Parse variants
    const variantsData = formData.get('variants');
    let variants = [];
    if (variantsData) {
      try {
        variants = JSON.parse(variantsData as string);
      } catch (error) {
        console.error('Error parsing variants:', error);
      }
    }

    // Parse subcategories (as JSON array of strings or multiple fields)
    let subcategories: string[] = [];
    const subcatsData = formData.get('subcategories');
    if (subcatsData) {
      try {
        const parsed = JSON.parse(subcatsData as string);
        if (Array.isArray(parsed)) subcategories = parsed.filter(Boolean);
      } catch {
        // If not JSON, collect all fields named 'subcategories'
        subcategories = formData.getAll('subcategories').map(String).filter(Boolean);
      }
    }

    // Parse addons (enhanced system)
    const addonsData = formData.get('addons');
    let addons = [];
    if (addonsData) {
      try {
        addons = JSON.parse(addonsData as string);
      } catch (error) {
        console.error('Error parsing addons:', error);
      }
    }

    const productData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      price: Number(formData.get('price')),
      description: formData.get('description'),
      category: categoryId,
      stock: Number(formData.get('stock')) || 0,
      featured: formData.get('featured') === 'true',
      images: formData.getAll('images'),
      colors: formData.getAll('colors'),
      sizes: formData.getAll('sizes'),
      variants,
      addons,
      specifications: specifications,
      shipping: shipping,
      subcategories,
    };

    const product = await Product.create(productData);

    return NextResponse.json({
      success: true,
      data: product.toObject(),
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 },
    );
  }
}
