export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Sale from '@/models/Sale';

// GET /api/sale -> returns current active sale (if any)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const now = new Date();

    if (mode === 'all') {
      const sales = await Sale.find({ active: true, endsAt: { $gt: now } })
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, data: sales });
    }

    const sale = await Sale.findOne({ active: true, endsAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: sale || null });
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch sale' }, { status: 500 });
  }
}

// POST /api/sale -> create/update active sale (admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }
    const { categorySlugs, productIds, endsAt, discountPercent } = (body || {}) as { categorySlugs?: string[]; productIds?: string[]; endsAt?: string; discountPercent?: number };

    const catList = Array.isArray(categorySlugs) ? categorySlugs.filter(Boolean) : [];
    const prodList = Array.isArray(productIds) ? productIds.filter(Boolean) : [];
    if (catList.length === 0 && prodList.length === 0) {
      return NextResponse.json({ success: false, error: 'Provide at least one categorySlug or productId' }, { status: 400 });
    }
    const ends = new Date(endsAt || '');
    if (isNaN(ends.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid endsAt datetime' }, { status: 400 });
    }

    // Note: Do not deactivate existing active sales; allow multiple concurrent sales

    const pct = typeof discountPercent === 'number' && discountPercent >= 0 ? Math.min(95, Math.max(0, Math.round(discountPercent))) : 0;
    console.log('Creating sale with discountPercent:', pct); // Debug log
    const created = await Sale.create({ categorySlugs: catList, productIds: prodList, endsAt: ends, discountPercent: pct, active: true });

    // In case of a stale cached schema (without productIds), explicitly set it and return a lean doc
    if (prodList.length > 0) {
      try {
        await Sale.updateOne({ _id: created._id }, { $set: { productIds: prodList } }, { strict: false });
      } catch (e) {
        console.warn('Warning: failed to set productIds via updateOne', e);
      }
    }

    const saved = await Sale.findById(created._id).lean();
    return NextResponse.json({ success: true, data: saved || created.toObject() });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ success: false, error: 'Failed to create sale' }, { status: 500 });
  }
}
