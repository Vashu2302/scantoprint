import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data: versionData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'latest_agent_version')
      .maybeSingle();

    const { data: downloadData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'agent_download_url')
      .maybeSingle();

    return NextResponse.json({
      version: versionData?.value || '1.0.0',
      download_url: downloadData?.value || '',
    });
  } catch (err: any) {
    return NextResponse.json(
      { version: '1.0.0', download_url: '' },
      { status: 500 }
    );
  }
}