import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if shop/merchant exists with this email
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, email, business_name, name')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'इस ईमेल से कोई रजिस्टर्ड मर्चेंट अकाउंट नहीं मिला।' },
        { status: 404 }
      );
    }

    // 2. Generate 6-digit secure numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes validity

    // 3. Store OTP in database (shops table directly to avoid missing table issue)
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        reset_otp: otp,
        reset_otp_expires_at: expiresAt,
      })
      .eq('id', shop.id);

    if (updateError) {
      console.error('Supabase OTP save error:', updateError);
      return NextResponse.json(
        { error: 'OTP डेटाबेस में सेव नहीं हो सका। कृपया सपोर्ट से संपर्क करें।' },
        { status: 500 }
      );
    }

    // 4. Robust SMTP Transporter with SSL Port 465 (Vercel-proof)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 5. Send OTP Email
    await transporter.sendMail({
      from: `"ScanToPrint Security" <${process.env.SUPPORT_EMAIL}>`,
      to: cleanEmail,
      subject: `🔐 ${otp} is your Password Reset OTP • ScanToPrint`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background: #070b18; color: #ffffff; border-radius: 16px; padding: 32px 24px; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">ScanToPrint</h2>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Merchant Security Verification</p>
          </div>

          <div style="background: #0b1021; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 16px 0;">
              नमस्ते <strong>${shop.business_name || shop.name || 'Merchant'}</strong>, आपके अकाउंट का पासवर्ड रीसेट करने के लिए OTP नीचे दिया गया है:
            </p>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #10b981; font-family: monospace; background: #070b14; padding: 14px; border-radius: 8px; border: 1px dashed #10b981; margin: 16px 0;">
              ${otp}
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              यह OTP अगले <strong>10 मिनट</strong> के लिए वैध है। इसे किसी के साथ साझा न करें।
            </p>
          </div>

          <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 24px;">
            यदि आपने यह अनुरोध नहीं किया था, तो आप इस ईमेल को अनदेखा कर सकते हैं।
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {
    console.error('Nodemailer SMTP Error:', err);
    return NextResponse.json(
      { error: err.message || 'SMTP Authentication Failed. Check App Password.' },
      { status: 500 }
    );
  }
}