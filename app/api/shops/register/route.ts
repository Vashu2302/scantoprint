import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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

    const plainText = `Hi ${recipientName},\n\nYour ScanToPrint account for "${shop.businessName}" is now active.\n\nAccount Overview:\n- Shop Name: ${shop.businessName}\n- Active Plan: ${planLabel}\n- Counter Login: https://scantoprint.in/login\n\nHow ScanToPrint transforms your print desk:\n- Saves 15-20 minutes every hour: Customer files queue directly to your printer without manual transfers.\n- 100% WhatsApp Clutter Free: Customers scan your unique counter QR code to send documents directly.\n- Direct Payments: All printing charges deposit straight into your linked UPI account.\n- Private & Secure: Customer files auto-delete immediately after printing.\n\nWe are here to help you get started:\nNeed help setting up your desktop spooler or printer settings? Reply directly to this email or ping our support desk. We are always on standby to assist you.\n\nBest regards,\nScanToPrint Support Team\n${senderEmail}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.6; color: #2d3748; margin: 0; padding: 20px;">
        <p style="font-size: 14.5px;">Hi <strong>${recipientName}</strong>,</p>
        <p>Your ScanToPrint counter account for <strong>${shop.businessName}</strong> is now live.</p>
        <div style="background-color: #f7fafc; border-left: 3px solid #4f46e5; padding: 10px 14px; margin: 16px 0;">
          <strong>Account Summary:</strong><br>
          • Store: ${shop.businessName}<br>
          • Plan: ${planLabel}<br>
          • Merchant Login: <a href="https://scantoprint.in/login" style="color: #4f46e5; text-decoration: underline;">https://scantoprint.in/login</a>
        </div>
        <p style="font-weight: 600; margin-top: 18px; margin-bottom: 6px;">How ScanToPrint saves you time every single day:</p>
        <p style="margin: 4px 0;">• <strong>Saves 15-20 mins/hour:</strong> No more waiting for files or manually opening downloads on PC.</p>
        <p style="margin: 4px 0;">• <strong>Zero WhatsApp clutter:</strong> Customers scan your counter QR to send print tasks directly.</p>
        <p style="margin: 4px 0;">• <strong>Direct UPI payments:</strong> Customer payments credit instantly to your own UPI account.</p>
        <p style="margin: 4px 0;">• <strong>Data privacy:</strong> Files auto-purge right after printing is completed.</p>
        <div style="background-color: #f0fdf4; border-radius: 6px; padding: 12px; margin: 20px 0; font-size: 13px; color: #166534;">
          <strong>Need setup assistance? We've got your back!</strong><br>
          Whether you need help configuring your desktop spooler agent or connecting your printers, our support team is available anytime. Simply reply to this email or reach us at <a href="mailto:${senderEmail}" style="color: #15803d; text-decoration: underline;">${senderEmail}</a>.
        </div>
        <p style="margin-top: 24px; color: #718096; font-size: 12.5px;">
          Warm regards,<br>
          ScanToPrint Support Team<br>
          ${senderEmail}
        </p>
      </body>
      </html>
    `;

    await fetch('https://api.brevo.com/v3/smtp/email', {
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
        subject: `Welcome to ScanToPrint: ${shop.businessName} setup details`,
        textContent: plainText,
        htmlContent: htmlContent,
      }),
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

    if (!mobile || !businessName || !password) {
      return NextResponse.json(
        { message: 'Missing required registration details.' },
        { status: 400 }
      );
    }

    const formattedName = businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const cleanedDigits = mobile.replace(/\D/g, '');
    const lastDigits = cleanedDigits.slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
    const generatedSlug = `${formattedName}-${lastDigits}`;

    const secretApiKey = `STP_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;

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
      { message: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}