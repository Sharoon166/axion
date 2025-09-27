import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';

export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: projects.map((project) => project.toObject()),
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    // Generate slug from title if not provided
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const projectData = {
      title: body.title,
      slug: slug,
      category: body.category,
      style: body.style,
      overview: body.overview,
      content: body.content || '',
      keyFeatures: body.keyFeatures || '',
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
      featured: body.featured || false,
      images: body.images || [],
    };

    const project = await Project.create(projectData);

    return NextResponse.json({
      success: true,
      data: project.toObject(),
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 },
    );
  }
}
