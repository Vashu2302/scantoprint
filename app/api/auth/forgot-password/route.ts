import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify if the merchant exists
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, email')
      .eq('email', cleanEmail)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'This email is not registered with ScanToPrint.' },
        { status: 404 }
      );
    }

    // 2. Generate a 6-digit numeric OTP valid for 10 minutes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 3. Clear existing OTPs for this email and save the new one
    await supabase.from('password_resets').delete().eq('email', cleanEmail);
    const { error: insertError } = await supabase.from('password_resets').insert({
      email: cleanEmail,
      otp,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error('Supabase OTP insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate reset OTP. Please ensure password_resets table exists.' },
        { status: 500 }
      );
    }

    // 4. Configure Gmail SMTP Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 5. Send Email with clean HTML layout
    await transporter.sendMail({
      from: `"ScanToPrint Support" <${process.env.SUPPORT_EMAIL}>`,
      to: cleanEmail,
      subject: 'ScanToPrint - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; text-align: center; margin-top: 0;">ScanToPrint</h2>
          <p style="color: #334155; font-size: 15px;">Hello <strong>${shop.name || 'Merchant'}</strong>,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">We received a request to reset your password. Use the verification code below to proceed:</p>
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e293b; font-family: monospace;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.4;">This OTP is valid for <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">ScanToPrint Team • Contact: scantoprint.support@gmail.com</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your email address.',
    });
  } catch (err: any) {
    console.error('Forgot password route error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send OTP email. Please try again.' },
      { status: 500 }
    );
  }
}