import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import dbConnect from '@/lib/db';
import Product from '@/models/Products';
import Category from '@/models/Category';

// Simplified type definitions to avoid deep type instantiation
interface SimpleVariantOption {
  _id?: string;
  label: string;
  value: string;
  priceModifier: number;
  stock: number;
  image?: string;
  sku?: string;
  subVariants?: SimpleSubVariant[];
  customProperties?: Record<string, unknown>;
  specifications: { name: string; value: string }[];
}

interface SimpleSubVariant {
  _id?: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required: boolean;
  options: SimpleSubVariantOption[];
}

interface SimpleSubVariantOption {
  _id?: string;
  label: string;
  value: string;
  priceModifier: number;
  stock: number;
  image?: string;
  sku?: string;
  subSubVariants?: SimpleSubSubVariant[];
  customProperties?: Record<string, unknown>;
  specifications: { name: string; value: string }[];
}
interface ProductDTO {
  _id: string;
  name: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    name: string;
    slug: string;
  };
}

interface SimpleSubSubVariant {
  _id?: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required: boolean;
  options: SimpleSubSubVariantOption[];
}

interface SimpleSubSubVariantOption {
  _id?: string;
  label: string;
  value: string;
  priceModifier: number;
  stock: number;
  image?: string;
  sku?: string;
  customProperties?: Record<string, unknown>;
  specifications: { name: string; value: string }[];
}

interface SimpleVariant {
  _id?: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required: boolean;
  options: SimpleVariantOption[];
}

export async function GET(request: NextRequest) {
  try {
    // // Enhanced connection with retry mechanism
    // let retries = 3;
    // while (retries > 0) {
    //   try {
    //     await Promise.race([
    //       dbConnect(),
    //       new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 8000)),
    //     ]);
    //     break;
    //   } catch (error) {
    //     retries--;
    //     if (retries === 0) throw error;
    //     await new Promise((resolve) => setTimeout(resolve, 1000));
    //   }
    // }

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');
    const page = searchParams.get('page');
    const idsParam = searchParams.get('ids');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const query: {
      featured?: boolean;
      'category.slug'?: string;
      price?: {
        $gte?: number;
        $lte?: number;
      };
      _id?: { $in: string[] };
    } = {};

    // If explicit IDs are provided, fetch those products and return early
    if (idsParam) {
      const rawIds = idsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (rawIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      try {
        const products = await Product.find({ _id: { $in: rawIds } })
        .populate({
          path: 'category',
          select: 'name slug',
          options: { strictPopulate: false },
        })
        .lean<ProductDTO[]>();
      

        // Preserve input order
        const orderMap = new Map(rawIds.map((id, idx) => [id, idx]));
        const sorted = products
          .map((p) => ({ p, idx: orderMap.get(String(p._id)) ?? 0 }))
          .sort((a, b) => a.idx - b.idx)
          .map(({ p }) => p);
        return NextResponse.json({ success: true, data: sorted });
      } catch (idsError) {
        console.error('Error fetching products by IDs:', idsError);
        // Fallback: try without population
        const products = await Product.find({ _id: { $in: rawIds } }).lean<ProductDTO[]>();
        return NextResponse.json({
          success: true,
          data: products,
          warning: 'Fetched without category population',
        });
      }
    }

    // Filter by price range if specified
    console.log('Price filter params - raw:', { minPrice, maxPrice });
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        const min = parseFloat(minPrice);
        console.log('Parsed minPrice:', min);
        query.price.$gte = min;
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice);
        console.log('Parsed maxPrice:', max);
        query.price.$lte = max;
      }
      console.log('Final price query:', JSON.stringify(query));
      
      // Add debug logging for the actual query being executed
      console.log('Executing query with price filter:', JSON.stringify(query));
      const count = await Product.countDocuments(query);
      console.log(`Found ${count} products matching price filter`);
    }

    // Filter by featured status if specified
    if (featured === 'true') {
      query.featured = true;
    }

    // Filter by category if specified
    if (category) {
      try {
        // Find category by slug
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          // Use the correct query format for category filter
          query['category.slug'] = categoryDoc.slug;
        } else {
          // Return empty array if category not found
          return NextResponse.json({
            success: true,
            data: [],
            message: 'Category not found',
          });
        }
      } catch (categoryError) {
        console.error('Error finding category:', categoryError);
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Error finding category',
        });
      }
    }

    try {
      let productsQuery = Product.find(query)
        .populate({
          path: 'category',
          select: 'name slug',
          options: { strictPopulate: false },
        })
        .sort({ createdAt: -1 });

      // Apply pagination
      if (page && limit) {
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;
        productsQuery = productsQuery.skip(skip).limit(limitNum);
      } else if (limit) {
        productsQuery = productsQuery.limit(Number(limit));
      }

      const products = await productsQuery;

      // Get total count for pagination
      let totalCount = products.length;
      if (page && limit) {
        totalCount = await Product.countDocuments(query);
      }

      return NextResponse.json({
        success: true,
        data: products.map((product) => product.toObject()),
        pagination: page && limit ? {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          itemsPerPage: Number(limit)
        } : undefined
      });
    } catch (queryError) {
      console.warn('Query with population failed, trying without:', queryError);

      // Fallback: try without population
      let productsQuery = Product.find(query).sort({ createdAt: -1 });

      // Apply pagination
      if (page && limit) {
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;
        productsQuery = productsQuery.skip(skip).limit(limitNum);
      } else if (limit) {
        productsQuery = productsQuery.limit(Number(limit));
      }

      const products = await productsQuery;

      // Get total count for pagination
      let totalCount = products.length;
      if (page && limit) {
        totalCount = await Product.countDocuments(query);
      }

      return NextResponse.json({
        success: true,
        data: products.map((product) => product.toObject()),
        warning: 'Fetched without category population due to error',
        pagination: page && limit ? {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          itemsPerPage: Number(limit)
        } : undefined
      });
    }
  } catch (error) {
    console.error('Error fetching products:', error);

    if (error instanceof Error && error.message === 'DB timeout') {
      return NextResponse.json(
        { success: false, error: 'Database connection timeout. Please try again.' },
        { status: 504 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products. Please check your connection and try again.',
      },
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

    // Convert variant and option string IDs to MongoDB ObjectIds and handle sub-variants
    const processedVariants = (variants as SimpleVariant[]).map((variant) => ({
      ...variant,
      _id: new Types.ObjectId(), // Generate new ObjectId for the variant
      options: variant.options.map((option) => ({
        ...option,
        _id: new Types.ObjectId(), // Generate new ObjectId for each option
        // Ensure customProperties is properly handled
        customProperties: option.customProperties || {},
        // Generate SKU if not provided
        sku: option.sku || `${formData.get('slug')}-${variant.name}-${option.value}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-'),
        // Process sub-variants if they exist (up to 3 levels)
        subVariants: option.subVariants ? option.subVariants.map((subVariant) => ({
          ...subVariant,
          _id: new Types.ObjectId(), // Generate new ObjectId for sub-variant
          options: subVariant.options.map((subOption) => ({
            ...subOption,
            _id: new Types.ObjectId(), // Generate new ObjectId for sub-option
            customProperties: subOption.customProperties || {},
            sku: subOption.sku || `${formData.get('slug')}-${variant.name}-${option.value}-${subVariant.name}-${subOption.value}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-'),
            // Process sub-sub-variants if they exist
            subSubVariants: subOption.subSubVariants ? subOption.subSubVariants.map((subSubVariant) => ({
              ...subSubVariant,
              _id: new Types.ObjectId(), // Generate new ObjectId for sub-sub-variant
              options: subSubVariant.options.map((subSubOption) => ({
                ...subSubOption,
                _id: new Types.ObjectId(), // Generate new ObjectId for sub-sub-option
                customProperties: subSubOption.customProperties || {},
                sku: subSubOption.sku || `${formData.get('slug')}-${variant.name}-${option.value}-${subVariant.name}-${subOption.value}-${subSubVariant.name}-${subSubOption.value}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-')
              }))
            })) : undefined
          }))
        })) : undefined
      }))
    }));



    const productData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      price: Number(formData.get('price')),
      description: formData.get('description'),
      category: categoryId,
      // Removed stock field - now handled at variant level
      featured: formData.get('featured') === 'true',
      images: formData.getAll('images'),
      colors: formData.getAll('colors'),
      sizes: formData.getAll('sizes'),
      variants: processedVariants,
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
