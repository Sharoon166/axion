import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Products';
import Category from '@/models/Category';

export async function POST() {
  try {
    await dbConnect();

    // First, create some categories if they don't exist
    const categories = [
      {
        name: 'Ceiling Lights',
        slug: 'ceiling-lights',
        description: 'Modern ceiling lighting solutions',
      },
      { name: 'Wall Lights', slug: 'wall-lights', description: 'Elegant wall-mounted lighting' },
      { name: 'Table Lamps', slug: 'table-lamps', description: 'Stylish table and desk lamps' },
      {
        name: 'Outdoor Lights',
        slug: 'outdoor-lights',
        description: 'Durable outdoor lighting solutions',
      },
    ];

    const createdCategories = [];
    for (const catData of categories) {
      let category = await Category.findOne({ slug: catData.slug });
      if (!category) {
        category = await Category.create(catData);
      }
      createdCategories.push(category);
    }

    // Create some featured products
    const featuredProducts = [
      {
        name: 'Modern Chandelier',
        slug: 'modern-chandelier',
        price: 1299.99,
        description:
          'A stunning modern chandelier that adds elegance to any room. Features crystal accents and LED lighting technology.',
        category: createdCategories[0]._id, // Ceiling Lights
        stock: 15,
        featured: true,
        images: ['/images/chandelier-1.jpg', '/images/chandelier-2.jpg'],
      },
      {
        name: 'Industrial Wall Sconce',
        slug: 'industrial-wall-sconce',
        price: 299.99,
        description:
          'Industrial-style wall sconce perfect for modern homes and offices. Features exposed bulb design.',
        category: createdCategories[1]._id, // Wall Lights
        stock: 25,
        featured: true,
        images: ['/images/sconce-1.jpg'],
      },
      {
        name: 'Minimalist Table Lamp',
        slug: 'minimalist-table-lamp',
        price: 149.99,
        description:
          'Clean and minimalist table lamp with adjustable brightness. Perfect for reading and ambient lighting.',
        category: createdCategories[2]._id, // Table Lamps
        stock: 30,
        featured: true,
        images: ['/images/table-lamp-1.jpg', '/images/table-lamp-2.jpg'],
      },
      {
        name: 'Solar Garden Path Lights',
        slug: 'solar-garden-path-lights',
        price: 89.99,
        description:
          'Eco-friendly solar-powered garden path lights. Automatically turn on at dusk and off at dawn.',
        category: createdCategories[3]._id, // Outdoor Lights
        stock: 50,
        featured: true,
        images: ['/images/garden-lights-1.jpg'],
      },
      {
        name: 'Crystal Pendant Light',
        slug: 'crystal-pendant-light',
        price: 599.99,
        description:
          'Luxurious crystal pendant light with multiple light sources. Creates beautiful light patterns.',
        category: createdCategories[0]._id, // Ceiling Lights
        stock: 10,
        featured: true,
        images: ['/images/pendant-1.jpg', '/images/pendant-2.jpg'],
      },
      {
        name: 'Smart LED Strip',
        slug: 'smart-led-strip',
        price: 199.99,
        description:
          'Smart LED strip with color changing capabilities. Controlled via smartphone app.',
        category: createdCategories[1]._id, // Wall Lights
        stock: 40,
        featured: true,
        images: ['/images/led-strip-1.jpg'],
      },
    ];

    const createdProducts = [];
    for (const productData of featuredProducts) {
      let product = await Product.findOne({ slug: productData.slug });
      if (!product) {
        product = await Product.create(productData);
      }
      createdProducts.push(product);
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        categoriesCreated: createdCategories.length,
        productsCreated: createdProducts.length,
        featuredProducts: createdProducts.filter((p) => p.featured).length,
      },
    });
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to seed database' }, { status: 500 });
  }
}
