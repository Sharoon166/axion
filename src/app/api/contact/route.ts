import { NextRequest, NextResponse } from 'next/server';

// You can create a Contact model if you want to store contact form submissions
// For now, this will just handle the form submission and could send emails

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const contactData = {
      fullName: formData.get('full-name'),
      email: formData.get('email'),
      company: formData.get('company'),
      inquiryType: formData.get('inquiry-type'),
      budgetRange: formData.get('budget-range'),
      cityCountry: formData.get('city-country'),
      message: formData.get('message'),
      contactMethod: formData.get('contact-method'),
      submittedAt: new Date(),
    };

    // Here you could:
    // 1. Save to database if you create a Contact model
    // 2. Send email notification
    // 3. Integrate with CRM
    
    console.log('Contact form submission:', contactData);

    // For now, just return success
    // In production, you'd want to:
    // - Validate the data
    // - Send email notifications
    // - Store in database
    // - Integrate with your CRM/support system

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We will get back to you within 24 hours.',
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message. Please try again.' },
      { status: 500 },
    );
  }
}