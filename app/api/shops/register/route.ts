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
      service: 'gmail',
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
      subject: `🎉 Welcome to ScanToPrint – आपकी दुकान अब हुई स्मार्ट और ऑटोमेटेड!`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ScanToPrint</h1>
            <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Next-Gen Zero-Touch Counter Printing</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
            <h2 style="color: #1e293b; font-size: 20px; margin-top: 0;">
              नमस्ते ${shop.ownerName || shop.businessName || 'पार्टनर'}, आपका हार्दिक स्वागत है! 🙏
            </h2>
            
            <p style="font-size: 14px;">
              ScanToPrint परिवार से जुड़ने और अपनी दुकान को डिजिटल ऑटोमेशन की नई ऊँचाइयों पर ले जाने के लिए बहुत-बहुत बधाई। आपकी दुकान <strong>"${shop.businessName}"</strong> के लिए <strong>${planLabel}</strong> सफलतापूर्वक एक्टिवेट हो गया है।
            </p>

            <!-- Active Plan Card -->
            <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <span style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">एक्टिव प्लान:</span>
              <div style="font-size: 16px; font-weight: bold; color: #1e293b; margin-top: 4px;">${planLabel}</div>
            </div>

            <!-- Features -->
            <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 12px;">अब आपके काउंटर पर क्या बदलेगा?</h3>
            <ul style="padding-left: 18px; margin: 0 0 24px 0; font-size: 13.5px; color: #475569;">
              <li style="margin-bottom: 8px;"><strong>नो व्हाट्सएप झंझट:</strong> ग्राहक सीधे काउंटर QR स्कैन करेंगे और फाइल प्रिंट के लिए भेज देंगे।</li>
              <li style="margin-bottom: 8px;"><strong>जीरो-टच ऑटो प्रिंट:</strong> फाइल आते ही सीधे आपके प्रिंटर से प्रिंट निकलेगी, आपको कंप्यूटर छूने की भी ज़रूरत नहीं।</li>
              <li style="margin-bottom: 8px;"><strong>सीधे आपके खाते में UPI पेमेंट:</strong> बिना किसी कमीशन या देरी के पूरा पैसा सीधे आपके बैंक में।</li>
              <li style="margin-bottom: 8px;"><strong>सुरक्षित और प्राइवेट:</strong> ग्राहकों की फाइल्स प्रिंट होते ही सुरक्षित तरीके से हट जाती हैं।</li>
            </ul>

            <!-- Support Promise -->
            <div style="background-color: #ecfdf5; border: 1px dashed #10b981; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0;">
              <h4 style="color: #065f46; margin: 0 0 6px 0; font-size: 15px;">🤝 हम हर कदम पर आपके साथ हैं!</h4>
              <p style="color: #047857; font-size: 13px; margin: 0;">
                सॉफ्टवेयर सेटअप, प्रिंटर जोड़ने या किसी भी तकनीकी सहायता के लिए हमारी सपोर्ट टीम हमेशा उपलब्ध है। आपका काम कभी नहीं रुकेगा।
              </p>
            </div>

            <!-- Direct Actions -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="https://scantoprint.in/login" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 8px; display: inline-block;">
                डैशबोर्ड में लॉगिन करें ➔
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
              यदि आपको कोई भी सहायता चाहिए, तो आप बेझिझक इस ईमेल पर रिप्लाई कर सकते हैं या सीधे <a href="mailto:scantoprint.support@gmail.com" style="color: #4f46e5;">scantoprint.support@gmail.com</a> पर संपर्क कर सकते हैं।
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            ScanToPrint India • Empowering Local Print Shops with Smart Automation
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('Welcome email sending error:', emailErr);
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

    // Format business name into URL-safe slug (e.g., "Lilima Prints" -> "lilima-prints")
    const formattedName = businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Extract last 4 digits of phone or generate 4 random digits
    const cleanedDigits = mobile.replace(/\D/g, '');
    const lastDigits = cleanedDigits.slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
    const generatedSlug = `${formattedName}-${lastDigits}`;

    // Generate unique Desktop Spooler Agent API key
    const secretApiKey = `STP_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;

    // Calculate subscription validity & quota based on selected plan
    const normalizedPlan = planType.toLowerCase();
    const normalizedCycle = billingCycle.toLowerCase();

    let durationDays = 7;
    let pageLimit = 500;

    if (normalizedPlan === 'premium') {
      pageLimit = 999999; // Unlimited pages
      durationDays = normalizedCycle === 'yearly' ? 365 : 28;
    } else if (normalizedPlan === 'standard') {
      pageLimit = 500;
      durationDays = normalizedCycle === 'yearly' ? 365 : 28;
    } else {
      // Free trial
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
          name: businessName,          // Fixes legacy NOT NULL constraint
          business_name: businessName, // For new structure
          owner_name: ownerName || '',
          phone: mobile,
          email: email || '',
          plain_password: password,   // Stored for emergency super-admin retrieval
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
      // Handle duplicate mobile number or slug conflict
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