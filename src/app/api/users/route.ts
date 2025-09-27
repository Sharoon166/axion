import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';
export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: users.map((user) => user.toObject()),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const formData = await request.formData();

    const hashedPassword = await bcrypt.hash(formData.get('password') as string, 12);

    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: hashedPassword,
      isAdmin: formData.get('isAdmin') === 'true',
    };

    const user = await User.create(userData);

    // Don't return the password in the response
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}

interface UpdateUserBody {
  userId: string;
  name?: string;
  email?: string;
  password?: string;
  isAdmin?: boolean;
  phone?: string;
  address?: string;
  avatar?: string;
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body: UpdateUserBody = await request.json();
    const { userId, name, email, password, isAdmin, phone, address, avatar } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    const updateData: Partial<UpdateUserBody> = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (typeof isAdmin === 'boolean') updateData.isAdmin = isAdmin;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (avatar) updateData.avatar = avatar;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }

    // Try to find and update in User model first
    let user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    // If not found in User model, try Admin model
    if (!user) {
      user = await Admin.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({ success: true, data: userResponse });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}
