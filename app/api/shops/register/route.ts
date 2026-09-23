import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function sendWelcomeEmail(shop: {
  ownerName?: string;
  businessName: string;
  email: string;
  planType: string;
  slug: string;
}) {
  if (!shop.email || !process.env.SUPPORT_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const planLabel =
      shop.planType === 'premium'
        ? 'Premium Plan'
        : shop.planType === 'standard'
        ? 'Standard Plan'
        : '7-Day Free Trial';

    await transporter.sendMail({
      from: `"ScanToPrint Team" <${process.env.SUPPORT_EMAIL}>`,
      to: shop.email,
      subject: `Welcome to ScanToPrint! Your store is now live 🚀`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07);">
          
          <!-- Banner -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 28px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ScanToPrint</h1>
            <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Next-Gen Zero-Touch Counter Printing</p>
          </div>

          <!-- Body -->
          <div style="padding: 36px 28px; color: #334155; line-height: 1.6;">
            <h2 style="color: #0f172a; font-size: 20px; margin-top: 0; font-weight: 700;">
              Welcome aboard, ${shop.ownerName || shop.businessName || 'Partner'}! 👋
            </h2>
            
            <p style="font-size: 14.5px; color: #475569; margin: 0 0 20px 0;">
              Congratulations on taking your print counter to the next level of digital automation. Your store <strong>"${shop.businessName}"</strong> has been successfully configured.
            </p>

            <!-- Plan Badge -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; padding: 18px; border-radius: 8px; margin: 24px 0;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Active Subscription</span>
              <div style="font-size: 18px; font-weight: 800; color: #1e293b; margin-top: 4px;">${planLabel}</div>
            </div>

            <!-- Features Breakdown -->
            <h3 style="color: #0f172a; font-size: 16px; margin: 28px 0 12px 0;">What happens next at your counter?</h3>
            <ul style="padding-left: 20px; margin: 0 0 28px 0; font-size: 14px; color: #475569;">
              <li style="margin-bottom: 10px;"><strong>Zero WhatsApp Clutter:</strong> Customers scan your custom counter QR and submit print jobs directly.</li>
              <li style="margin-bottom: 10px;"><strong>Automated Spooling:</strong> Documents print automatically to your desk printer without touching your PC.</li>
              <li style="margin-bottom: 10px;"><strong>Direct UPI Settlements:</strong> 100% customer payments land straight into your own UPI account.</li>
              <li style="margin-bottom: 10px;"><strong>Data Privacy:</strong> Customer files are completely purged from storage right after printing.</li>
            </ul>

            <!-- Full Support Assurance -->
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 28px 0;">
              <h4 style="color: #15803d; margin: 0 0 6px 0; font-size: 15px;">🤝 We've got your back!</h4>
              <p style="color: #166534; font-size: 13.5px; margin: 0; line-height: 1.5;">
                From setting up your desktop spooler agent to configuring multiple printers, our team is always ready to guide you. Your counter productivity is our top priority.
              </p>
            </div>

            <!-- Dashboard Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://scantoprint.in/login" style="background-color: #4f46e5; color: #ffffff; padding: 13px 32px; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 10px; display: inline-block; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);">
                Access Merchant Dashboard ➔
              </a>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-top: 28px;">
              Have questions or need assistance? Reply directly to this email or reach our support desk at <a href="mailto:scantoprint.support@gmail.com" style="color: #4f46e5; text-decoration: none;">scantoprint.support@gmail.com</a>.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            © ${new Date().getFullYear()} ScanToPrint India • Automated Smart Counter Printing
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('Welcome email error:', emailErr);
  }
}

export async function POST(req: Request) {
  try {
    const {
      ownerName,
      businessName,
      mobile,
      email,
      password,
      upiId,
      planType = 'trial',
      billingCycle = 'monthly',
      referredByCode = null,
    } = await req.json();

    // Basic validation
    if (!mobile || !businessName || !password) {
      return NextResponse.json(
        { message: 'Missing required registration details (Business Name, Mobile, Password are required).' },
        { status: 400 }
      );
    }

    // Format business name into URL-safe slug
    const formattedName = businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const cleanedDigits = mobile.replace(/\D/g, '');
    const lastDigits = cleanedDigits.slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
    const generatedSlug = `${formattedName}-${lastDigits}`;

    // Desktop Spooler Agent API key
    const secretApiKey = `STP_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;

    // Plan calculation
    const normalizedPlan = planType.toLowerCase();
    const normalizedCycle = billingCycle.toLowerCase();

    let durationDays = 7;
    let pageLimit = 500;

    if (normalizedPlan === 'premium') {
      pageLimit = 999999;
      durationDays = normalizedCycle === 'yearly' ? 365 : 28;
    } else if (normalizedPlan === 'standard') {
      pageLimit = 500;
      durationDays = normalizedCycle === 'yearly' ? 365 : 28;
    } else {
      pageLimit = 500;
      durationDays = 7;
    }

    const calculatedEndDate = new Date();
    calculatedEndDate.setDate(calculatedEndDate.getDate() + durationDays);

    const cleanReferralCode = referredByCode ? String(referredByCode).trim().toUpperCase() : null;

    // Insert record into Supabase shops table
    const { data: newShop, error } = await supabase
      .from('shops')
      .insert([
        {
          name: businessName,
          business_name: businessName,
          owner_name: ownerName || '',
          phone: mobile,
          email: email || '',
          plain_password: password,
          upi_id: upiId || '',
          slug: generatedSlug,
          api_key: secretApiKey,
          subscription_status: 'active',
          plan_type: normalizedPlan,
          subscription_end: calculatedEndDate.toISOString(),
          page_limit: pageLimit,
          monthly_pages_printed: 0,
          referred_by_code: cleanReferralCode,
          commission_credited: false,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'This mobile number or shop is already registered.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    // Send welcome greeting email asynchronously
    if (email && email.trim()) {
      sendWelcomeEmail({
        ownerName: ownerName || '',
        businessName,
        email: email.trim().toLowerCase(),
        planType: normalizedPlan,
        slug: generatedSlug,
      }).catch((err) => console.error('Background welcome email failed:', err));
    }

    return NextResponse.json({
      success: true,
      shop: newShop,
      portalUrl: `https://${newShop.slug}.scantoprint.in`,
    });

  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}