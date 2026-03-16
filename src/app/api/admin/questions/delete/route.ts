import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { password, id } = await request.json();

  if (password !== 'panel2025') {
    return NextResponse.json({ error: 'Feil passord' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: 'ID er påkrevd' }, { status: 400 });
  }

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
