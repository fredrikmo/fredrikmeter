import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { questionId, password } = await request.json();

  if (password !== 'panel2025') {
    return NextResponse.json({ error: 'Feil passord' }, { status: 401 });
  }

  // Deactivate all questions
  await supabase.from('questions').update({ is_active: false }).neq('id', '');

  // Activate the selected question
  const { error } = await supabase
    .from('questions')
    .update({ is_active: true })
    .eq('id', questionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
