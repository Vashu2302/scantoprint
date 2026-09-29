import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, password, action, payload } = body;

    if (!shopId || !password) {
      return NextResponse.json(
        { message: 'Shop ID and Password are required' },
        { status: 400 }
      );
    }

    // 1. Fetch shop and strictly verify password
    const { data: shop, error: fetchErr } = await supabaseAdmin
      .from('shops')
      .select('id, plain_password')
      .eq('id', shopId)
      .single();

    if (fetchErr || !shop) {
      return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
    }

    if (String(shop.plain_password).trim() !== String(password).trim()) {
      return NextResponse.json(
        { message: 'Incorrect store password! Verification failed.' },
        { status: 401 }
      );
    }

    // 2. Prepare update fields depending on action
    let updateData: any = {};
    if (action === 'save_upi') {
      if (!payload?.upiId || !payload.upiId.includes('@')) {
        return NextResponse.json({ message: 'Invalid UPI ID format' }, { status: 400 });
      }
      updateData.upi_id = String(payload.upiId).trim();
    } else if (action === 'save_rates') {
      updateData.bw_single = parseFloat(payload.bwSingle) || 0;
      updateData.bw_double = parseFloat(payload.bwDouble) || 0;
      updateData.color_single = parseFloat(payload.colorSingle) || 0;
      updateData.color_double = parseFloat(payload.colorDouble) || 0;
    } else {
      return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
    }

    // 3. Commit update using admin authority
    const { data, error: updateErr } = await supabaseAdmin
      .from('shops')
      .update(updateData)
      .eq('id', shopId)
      .select();

    if (updateErr) {
      return NextResponse.json({ message: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Updated successfully',
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}