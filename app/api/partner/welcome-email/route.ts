import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, referralCode, upiId } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: 'Missing required details.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"ScanToPrint Partner Network" <${process.env.SUPPORT_EMAIL}>`,
      to: email.trim().toLowerCase(),
      subject: `Welcome to ScanToPrint Partner Program, ${fullName}! 🚀`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0b1021; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
          
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">ScanToPrint Partners</h1>
            <p style="color: #c7d2fe; margin: 6px 0 0 0; font-size: 13px;">Official Accreditation & Welcome Kit</p>
          </div>

          <div style="padding: 30px 24px;">
            <p style="font-size: 15px; color: #e2e8f0; margin-top: 0;">
              Hello <strong>${fullName}</strong>,
            </p>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
              Welcome aboard! Your partner account is active. You can now onboard local photocopy, cyber cafe, and stationery shops using your unique referral code.
            </p>

            <div style="background-color: #070b18; border: 1px solid #334155; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
              <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #38bdf8; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">
                Your Partner Credentials
              </span>
              <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;">
                <strong>Promo Code:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #fbbf24; background: rgba(251,191,36,0.1); padding: 2px 8px; border-radius: 6px;">${referralCode}</span>
              </p>
              <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;">
                <strong>User ID:</strong> <span style="font-family: monospace; color: #ffffff;">${phone}</span>
              </p>
              <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;">
                <strong>Payout UPI:</strong> <span style="font-family: monospace; color: #34d399;">${upiId}</span>
              </p>
            </div>

            <div style="background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.12)); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 10px 0; color: #34d399; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                💰 How Much Can You Earn?
              </h3>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #e2e8f0; line-height: 1.6;">
                <li><strong>₹100 Direct Commission:</strong> On every Standard store subscription.</li>
                <li><strong>₹150 Direct Commission:</strong> On every Premium store subscription.</li>
                <li><strong>Recurring Passive Income:</strong> Onboarding just 30 active stores earns you <strong>₹3,000 to ₹4,500 every month</strong> recurring revenue.</li>
                <li><strong>Direct Settlements:</strong> Weekly/monthly UPI transfers straight to your bank account.</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 24px 0 12px 0;">
              <a href="https://scantoprint.in/partner/login" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 10px; display: inline-block;">
                Access Partner Dashboard →
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center;">
              Need help? Reach out at <a href="mailto:scantoprint.support@gmail.com" style="color: #818cf8; text-decoration: none;">scantoprint.support@gmail.com</a>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'Welcome email sent successfully.' });
  } catch (err: any) {
    console.error('Welcome email error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}