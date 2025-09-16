import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

type RouteContext = {
  params?: Record<string, string>;
};

export async function requireAdmin(request: NextRequest) {
  try {
    console.log(request)
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin' || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return null; // No error, user is authorized
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function withAdminAuth(
  handler: (request: NextRequest, context?: RouteContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: RouteContext) => {
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }
    
    return handler(request, context);
  };
}
