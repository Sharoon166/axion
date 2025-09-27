import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, email, password, avatar } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user data object
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isAdmin: false, // Always false for signup endpoint
      role: 'user',
      ...(avatar && { avatar })
    };

    // Create new user
    const newUser = new User(userData);
    const savedUser = await newUser.save();

    // Remove password from response
    const userResponse = {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      isAdmin: false,
      avatar: savedUser.avatar,
      createdAt: savedUser.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: userResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate key error (in case of race condition)
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
