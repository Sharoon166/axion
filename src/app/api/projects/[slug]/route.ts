import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();
    const project = await Project.findOne({ slug: params.slug });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project.toObject(),
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();
    const formData = await request.formData();

    const updateData = {
      title: formData.get('title'),
      category: formData.get('category'),
      style: formData.get('style'),
      overview: formData.get('overview'),
      features: formData.getAll('features'),
      specs: {
        type: formData.get('specs.type'),
        location: formData.get('specs.location'),
        completion: formData.get('specs.completion'),
        duration: formData.get('specs.duration'),
        team: formData.get('specs.team'),
      },
      testimonial: {
        text: formData.get('testimonial.text'),
        author: formData.get('testimonial.author'),
      },
      location: formData.get('location'),
      date: formData.get('date'),
      featured: formData.get('featured') === 'true',
      images: formData.getAll('images'),
      image: formData.get('image'),
    };

    const project = await Project.findOneAndUpdate(
      { slug: params.slug },
      updateData,
      { new: true }
    );

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project.toObject(),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();
    const project = await Project.findOneAndDelete({ slug: params.slug });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 },
    );
  }
}