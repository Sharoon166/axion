import { NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  isAdmin?: boolean;
  avatar?: {
    url: string;
    publicId?: string;
  };
}

export async function POST(request: Request) {
  try {
    const { email, password, name, isAdmin, avatar }: RegisterData = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Check if user already exists in either users or admins collection
    const [existingUser, existingAdmin] = await Promise.all([
      db.collection('users').findOne({ email }),
      db.collection('admins').findOne({ email })
    ]);

    if (existingUser || existingAdmin) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();

    // Prepare user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      avatar: avatar || null,
      createdAt: now,
      updatedAt: now,
      emailVerified: false,
      isActive: true
    };

    let result;
    
    if (isAdmin) {
      // Create admin user
      result = await db.collection('admins').insertOne({
        ...userData,
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'manage_users', 'manage_products'],
        lastActive: now
      });
    } else {
      // Create regular user
      result = await db.collection('users').insertOne({
        ...userData,
        role: 'user',
        wishlist: [],
        addresses: []
      });
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = userData;
    console.log(_);
    return NextResponse.json({
      success: true,
      user: {
        id: result.insertedId,
        ...userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
