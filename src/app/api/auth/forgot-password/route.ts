import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email });

    // For security reasons, don't reveal if the email exists or not
    if (!user) {
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate reset token and set expiry (1 hour from now)
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

    // Save token and expiry to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpiry;
    await user.save();

    // Send email with reset link
    const emailResult = await sendPasswordResetEmail(user.email, resetToken);

    if (!emailResult.success) {
      return NextResponse.json(
        { message: 'Error sending reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
