import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { ownerName, businessName, mobile, email, password, upiId } = await req.json();

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
          subscription_status: 'active'
        }
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

    return NextResponse.json({
      success: true,
      shop: newShop,
      portalUrl: `https://${newShop.slug}.scantoprint.in`
    });

  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}