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
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify merchant existence
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, email, business_name, name')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'No registered merchant account found with this email.' },
        { status: 404 }
      );
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 3. Save OTP in database
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        reset_otp: otp,
        reset_otp_expires_at: expiresAt,
      })
      .eq('id', shop.id);

    if (updateError) {
      console.error('Supabase OTP error:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate verification code. Please try again.' },
        { status: 500 }
      );
    }

    // 4. Secure Transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const merchantName = shop.business_name || shop.name || 'Merchant Partner';

    // 5. Send Professional English OTP Email
    await transporter.sendMail({
      from: `"ScanToPrint Security" <${process.env.SUPPORT_EMAIL}>`,
      to: cleanEmail,
      subject: `${otp} is your verification code • ScanToPrint`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #0b1021; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
          
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">ScanToPrint</h1>
            <p style="color: #c7d2fe; margin: 6px 0 0 0; font-size: 13px;">Merchant Account Security</p>
          </div>

          <div style="padding: 32px 24px;">
            <p style="font-size: 15px; color: #e2e8f0; margin-top: 0;">
              Hello <strong>${merchantName}</strong>,
            </p>
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0;">
              We received a request to reset your password. Use the verification code below to complete your password reset:
            </p>

            <div style="text-align: center; background-color: #070b18; border: 1px dashed #6366f1; border-radius: 12px; padding: 20px 16px; margin: 24px 0;">
              <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: 'Courier New', Courier, monospace; display: block;">
                ${otp}
              </span>
              <span style="font-size: 12px; color: #64748b; margin-top: 8px; display: block;">
                Valid for 10 minutes only
              </span>
            </div>

            <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
              If you did not make this request, you can safely ignore this email. Your account remains completely secure.
            </p>

            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center;">
              Need help? Reach us anytime at <a href="mailto:scantoprint.support@gmail.com" style="color: #818cf8; text-decoration: none;">scantoprint.support@gmail.com</a>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'Verification code sent successfully.' });
  } catch (err: any) {
    console.error('Nodemailer error:', err);
    return NextResponse.json(
      { error: err.message || 'SMTP Authentication Failed. Check App Password.' },
      { status: 500 }
    );
  }
}