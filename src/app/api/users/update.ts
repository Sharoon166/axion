import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';

export async function PATCH(request: NextRequest) {
    interface UserData {
    phone?: string;
    address?: string;
    avatar?: string;
    }
  try {
    await dbConnect();
    const body = await request.json();
    const { userId, phone, address, avatar } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    const updateFields: UserData = {};
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (avatar) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}
