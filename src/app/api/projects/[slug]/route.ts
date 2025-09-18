import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    const project = await Project.findOne({ slug });

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
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    const body = await request.json();

    const updateData = {
      title: body.title,
      category: body.category,
      style: body.style,
      overview: body.overview,
      content: body.content,
      keyFeatures: body.keyFeatures,
      technicalSpecs: {
        projectType: body.technicalSpecs?.projectType || '',
        // location: body.technicalSpecs?.location || '',
        completion: body.technicalSpecs?.completion || '',
        duration: body.technicalSpecs?.duration || '',
        team: body.technicalSpecs?.team || '',
      },
      clientTestimonial: {
        text: body.clientTestimonial?.text || '',
        author: body.clientTestimonial?.author || '',
      },
      location: body.location || '',
      date: body.date,
      images: body.images || [],
      featured: body.featured || false,
    };

    const project = await Project.findOneAndUpdate(
      { slug },
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
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;
    const project = await Project.findOneAndDelete({ slug });

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