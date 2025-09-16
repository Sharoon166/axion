import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import Admin from '@/models/Admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    // Validate required fields
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'User ID, current password, and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Try to find user in regular users collection first
    let userDoc = await User.findById(userId).select('+password');
    let isAdmin = false;

    // If not found in users, try admins collection
    if (!userDoc) {
      userDoc = await Admin.findById(userId).select('+password');
      isAdmin = true;
    }

    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userDoc.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in the appropriate collection
    if (isAdmin) {
      await Admin.findByIdAndUpdate(userId, { password: hashedNewPassword });
    } else {
      await User.findByIdAndUpdate(userId, { password: hashedNewPassword });
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}