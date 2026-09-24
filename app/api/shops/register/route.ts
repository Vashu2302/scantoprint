import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const senderEmail = process.env.SUPPORT_EMAIL || 'scantoprint.support@gmail.com';
  const apiKey = process.env.BREVO_API_KEY;

  if (!shop.email || !apiKey) {
    console.warn('Welcome email skipped: Missing email or BREVO_API_KEY');
    return;
  }

  try {
    const planLabel =
      shop.planType === 'premium'
        ? 'Premium Plan'
        : shop.planType === 'standard'
        ? 'Standard Plan'
        : '7-Day Free Trial';

    const recipientName = shop.ownerName || shop.businessName || 'Merchant';

    const plainText = `Hi ${recipientName},\n\nYour ScanToPrint account for "${shop.businessName}" is now active.\n\nAccount Details:\n- Store Name: ${shop.businessName}\n- Subscription: ${planLabel}\n- Dashboard: https://scantoprint.in/login\n\nYou can sign in to access your print counter and QR code.\n\nIf you need any setup assistance, reply directly to this email.\n\nBest regards,\nScanToPrint Support\n${senderEmail}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #222222; margin: 0; padding: 16px;">
        <p>Hi ${recipientName},</p>
        
        <p>Your ScanToPrint account for <strong>${shop.businessName}</strong> is now active.</p>
        
        <p style="margin: 12px 0;">
          Store Name: ${shop.businessName}<br>
          Subscription: ${planLabel}<br>
          Dashboard Login: <a href="https://scantoprint.in/login" style="color: #1a73e8;">https://scantoprint.in/login</a>
        </p>
        
        <p>You can sign in to access your print counter and customer QR code.</p>
        
        <p style="margin-top: 24px; color: #555555;">
          Best regards,<br>
          ScanToPrint Support<br>
          ${senderEmail}
        </p>
      </body>
      </html>
    `;

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'ScanToPrint Support', email: senderEmail },
        to: [{ email: shop.email, name: recipientName }],
        replyTo: { email: senderEmail, name: 'ScanToPrint Support' },
        subject: `Account active: ${shop.businessName} - ScanToPrint`,
        textContent: plainText,
        htmlContent: htmlContent,
      }),
    });

    if (!brevoResponse.ok) {
      const errData = await brevoResponse.json();
      console.error('Brevo welcome email dispatch failed:', errData);
    } else {
      console.log('Welcome email successfully dispatched via Brevo to:', shop.email);
    }
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

    // Await email delivery to ensure Vercel doesn't kill the runtime
    if (email && email.trim()) {
      try {
        await sendWelcomeEmail({
          ownerName: ownerName || '',
          businessName,
          email: email.trim().toLowerCase(),
          planType: normalizedPlan,
          slug: generatedSlug,
        });
      } catch (e) {
        console.error('Email sending failed in registration flow:', e);
      }
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