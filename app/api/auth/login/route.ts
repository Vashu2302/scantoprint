import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { message: 'Phone/Email and Password are required.' },
        { status: 400 }
      );
    }

    const cleanInput = String(identifier).trim();
    const cleanPass = String(password).trim();

    // Check phone or email
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .or(`phone.eq.${cleanInput},email.eq.${cleanInput}`);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    if (!shops || shops.length === 0) {
      return NextResponse.json(
        { message: 'No account registered with this Phone or Email.' },
        { status: 404 }
      );
    }

    const targetShop = shops[0];

    // Check password
    if (String(targetShop.plain_password).trim() !== cleanPass) {
      return NextResponse.json(
        { message: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      shop: targetShop,
      slug: targetShop.slug
    });

  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Server error' },
      { status: 500 }
    );
  }
}