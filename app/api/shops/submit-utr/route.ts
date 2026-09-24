import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role or anon client with full authority
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const { shopId, utrNumber } = body;

    console.log('[SUBMIT_UTR] Received for shop:', shopId, 'UTR:', utrNumber);

    if (!shopId || !utrNumber) {
      return NextResponse.json(
        { message: 'Shop ID and UTR Number are mandatory' },
        { status: 400 }
      );
    }

    const cleanUtr = String(utrNumber).trim();

    // 1. Fetch current shop details to verify plan and promo code status
    const { data: shop, error: fetchError } = await supabaseAdmin
      .from('shops')
      .select('id, name, business_name, plan_type, referred_by_code')
      .eq('id', shopId)
      .single();

    if (fetchError || !shop) {
      console.error('[SUBMIT_UTR_FETCH_ERROR]:', fetchError);
      return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
    }

    // 2. Calculate the exact discounted amount if promo code was applied
    const isPremium = String(shop.plan_type).toLowerCase() === 'premium';
    const basePrice = isPremium ? 249 : 149;
    const hasPromoCode = Boolean(shop.referred_by_code && String(shop.referred_by_code).trim() !== '');

    // 20% discount applied: 149 -> 119, 249 -> 199
    const actualPaidAmount = hasPromoCode ? (isPremium ? 199 : 119) : basePrice;

    // 3. Update shop with UTR, actual paid amount, and payment verification status
    const { data, error } = await supabaseAdmin
      .from('shops')
      .update({
        payment_utr: cleanUtr,
        payment_verified: false,
        subscription_status: 'active',
        paid_amount: actualPaidAmount,
      })
      .eq('id', shopId)
      .select('id, payment_utr, plan_type, referred_by_code, paid_amount');

    if (error) {
      console.error('[SUBMIT_UTR_DB_ERROR]:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    console.log('[SUBMIT_UTR_SUCCESS]: Saved UTR with actual amount:', actualPaidAmount, data);
    return NextResponse.json({
      success: true,
      message: 'UTR and verified amount saved successfully',
      paidAmount: actualPaidAmount,
      hasDiscount: hasPromoCode,
      data,
    });
  } catch (err: any) {
    console.error('[SUBMIT_UTR_SERVER_ERROR]:', err);
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}