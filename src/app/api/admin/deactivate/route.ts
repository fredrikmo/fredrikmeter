import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== 'panel2025') {
    return NextResponse.json({ error: 'Feil passord' }, { status: 401 });
  }

  await supabase.from('questions').update({ is_active: false }).neq('id', '');

  return NextResponse.json({ success: true });
}
