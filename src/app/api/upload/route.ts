import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const safeFileBase = (file.name || 'image')
      .split(/[/\\]/)
      .pop()
      ?.replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .substring(0, 20);

    if (!safeFileBase) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // ✅ no slashes in public_id

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

    const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        file: dataUri,
        upload_preset: uploadPreset,
        timestamp: Math.round(Date.now() / 1000).toString(),
      }),
    });

    const uploaded = await cloudinaryRes.json();

    if (!cloudinaryRes.ok) {
      console.error('Cloudinary upload error:', {
        status: cloudinaryRes.status,
        statusText: cloudinaryRes.statusText,
        error: uploaded,
        fileSize: file.size,
        fileType: file.type,
      });
      return NextResponse.json(
        { error: uploaded.error?.message || `Cloudinary upload failed (${cloudinaryRes.status})` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
