import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'सभी विवरण अनिवार्य हैं।' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check user & verify OTP
    const { data: shop, error: fetchError } = await supabase
      .from('shops')
      .select('id, reset_otp, reset_otp_expires_at')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (fetchError || !shop) {
      return NextResponse.json({ error: 'दुकानदार अकाउंट नहीं मिला।' }, { status: 404 });
    }

    if (!shop.reset_otp || shop.reset_otp !== otp.trim()) {
      return NextResponse.json({ error: 'अमान्य OTP! कृपया दोबारा चेक करें।' }, { status: 400 });
    }

    if (new Date(shop.reset_otp_expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'OTP की समय सीमा समाप्त (Expire) हो चुकी है।' }, { status: 400 });
    }

    // Update password & clear OTP
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        plain_password: newPassword,
        reset_otp: null,
        reset_otp_expires_at: null,
      })
      .eq('id', shop.id);

    if (updateError) {
      return NextResponse.json({ error: 'पासवर्ड अपडेट नहीं हो सका।' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password reset successful' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}