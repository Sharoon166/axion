import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Products';
import Category from '@/models/Category';
import { requireAdmin } from '@/lib/adminAuth';
import mongoose from 'mongoose';
const toObjectId = (id?: string) => (id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : new mongoose.Types.ObjectId());
interface Specification {
  name: string;
  value: string;
}

interface ShippingDimensions {
  length?: number;
  width?: number;
  height?: number;
}

interface ShippingInfo {
  weight?: number;
  dimensions?: ShippingDimensions;
  freeShipping?: boolean;
  shippingCost?: number;
  estimatedDelivery?: string;
  returnPolicy?: string;
}

interface SubSubVariantOption {
  _id?: string;
  label: string;
  value: string;
  priceModifier?: number;
  stock?: number;
  image?: string;
  sku?: string;
  customProperties?: Record<string, unknown>;
  specifications?: Specification[];
}

interface SubSubVariant {
  _id?: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required?: boolean;
  options: SubSubVariantOption[];
}

interface SubVariantOption {
  _id?: string;
  label: string;
  value: string;
  priceModifier?: number;
  stock?: number;
  image?: string;
  sku?: string;
  subSubVariants?: SubSubVariant[];
  customProperties?: Record<string, unknown>;
  specifications?: Specification[];
}

interface SubVariant {
  _id?: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required?: boolean;
  options: SubVariantOption[];
}

interface VariantOption {
  _id?: string;
  label: string;
  value: string;
  priceModifier?: number;
  stock?: number;
  image?: string;
  sku?: string;
  subVariants?: SubVariant[];
  customProperties?: Record<string, unknown>;
  specifications?: Specification[];
}

interface Variant {
  _id?: string;
  name: string;
  type: 'color' | 'size' | 'text' | 'dropdown';
  required?: boolean;
  options: VariantOption[];
}

interface AddonOption {
  label: string;
  price: number;
  description?: string;
  image?: string;
}

interface Addon {
  name: string;
  description?: string;
  type: 'checkbox' | 'radio' | 'quantity';
  required?: boolean;
  maxQuantity?: number;
  options: AddonOption[];
}

interface ProductUpdateData {
  name: FormDataEntryValue | null;
  slug: FormDataEntryValue | null;
  price: number;
  description: FormDataEntryValue | null;
  category: string;
  // Removed stock field - now handled at variant level
  featured: boolean;
  specifications: Specification[];
  shipping: ShippingInfo;
  images: string[];
  colors: string[];
  variants?: Variant[];
  addons?: Addon[];
  sizes?: string[];
  subcategories?: string[];
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  // Check admin authorization
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await dbConnect();
    const { slug } = await params;

    const product = await Product.findOne({ slug }).populate('category', 'name slug');

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: product.toObject(),
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  // Check admin authorization
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await dbConnect();
    const { slug } = await params;
    const formData = await request.formData();

    // Handle category - find by name and get ObjectId
    const categoryName = formData.get('category') as string;
    let categoryId = null;

    if (categoryName && categoryName !== 'Create New Category...') {
      const category = await Category.findOne({ name: categoryName });
      if (category) {
        categoryId = category._id;
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

    // Parse subcategories
    const subcategories = [];
    // Handle both array-style (subcategories[0], subcategories[1], etc.) and direct subcategories field
    for (const [key, value] of formData.entries()) {
      if (key === 'subcategories' || key.startsWith('subcategories[')) {
        if (typeof value === 'string' && value.trim() !== '') {
          subcategories.push(value);
        }
      }
    }

    // Parse variants and addons if they exist
    const variantsData = formData.get('variants');
    let variants = [];
    if (variantsData) {
      try {
        variants = JSON.parse(variantsData as string);
      } catch (error) {
        console.error('Error parsing variants:', error);
      }
    }

    const addonsData = formData.get('addons');
    let addons = [];
    if (addonsData) {
      try {
        addons = JSON.parse(addonsData as string);
      } catch (error) {
        console.error('Error parsing addons:', error);
      }
    }

    const updateData: ProductUpdateData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      price: Number(formData.get('price')),
      description: formData.get('description'),
      category: categoryId,
      // Removed stock field - now handled at variant level
      featured: formData.get('featured') === 'true',
      specifications: specifications,
      shipping: shipping,
      images: formData
        .getAll('images')
        .filter((img): img is string => typeof img === 'string' && img.trim() !== ''),
      colors: formData
        .getAll('colors')
        .filter((c): c is string => typeof c === 'string' && c.trim() !== ''),
      sizes: formData
        .getAll('sizes')
        .filter((s): s is string => typeof s === 'string' && s.trim() !== ''),
      subcategories: subcategories,
    };

    // Process variants with sub-variants and proper ObjectIds
    const processedVariants = (variants || []).map((variant: Variant) => ({
      ...variant,
      _id: toObjectId(variant._id as string | undefined),
      options: variant.options.map((option: VariantOption) => ({
        ...option,
        _id: toObjectId(option._id as string | undefined),
        customProperties: option.customProperties || {},
        sku: option.sku || `${formData.get('slug')}-${variant.name}-${option.value}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-'),
        subVariants: option.subVariants ? option.subVariants.map((subVariant: SubVariant) => ({
          ...subVariant,
          _id: toObjectId(subVariant._id as string | undefined),
          options: subVariant.options.map((subOption: SubVariantOption) => ({
            ...subOption,
            _id: toObjectId(subOption._id as string | undefined),
            customProperties: subOption.customProperties || {},
            sku: subOption.sku || `${formData.get('slug')}-${variant.name}-${option.value}-${subVariant.name}-${subOption.value}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-'),
            subSubVariants: subOption.subSubVariants ? subOption.subSubVariants.map((subSubVariant: SubSubVariant) => ({
              ...subSubVariant,
              _id: toObjectId(subSubVariant._id as string | undefined),
              options: subSubVariant.options.map((subSubOption: SubSubVariantOption) => ({
                ...subSubOption,
                _id: toObjectId(subSubOption._id as string | undefined),
                customProperties: subSubOption.customProperties || {},
                sku: subSubOption.sku || `${formData.get('slug')}-${variant.name}-${option.value}-${subVariant.name}-${subOption.value}-${subSubVariant.name}-${subSubOption.value}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-')
              }))
            })) : undefined
          }))
        })) : undefined
      }))
    }));

    // Always set variants, even if empty (to handle deletion of all variants)
    updateData.variants = processedVariants;

    // Only set addons if they exist (maintain existing behavior for addons)
    if (addons && addons.length > 0) {
      updateData.addons = addons;
    }

    const product = await Product.findOneAndUpdate({ slug }, updateData, { new: true }).populate(
      'category',
      'name slug',
    );

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
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
  { params }: { params: Promise<{ slug: string }> },
) {
  // Check admin authorization
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await dbConnect();
    const { slug } = await params;

    const product = await Product.findOneAndDelete({ slug });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
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
