import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by reset token and check if it's still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, message: 'Invalid or expired reset token' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: 'Valid reset token',
    });
  } catch (error) {
    console.error('Validate token error:', error);
    return NextResponse.json(
      { valid: false, message: 'Error validating token' },
      { status: 500 }
    );
  }
}
