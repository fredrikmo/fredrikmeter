import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { questionId, password } = await request.json();

  if (password !== 'panel2025') {
    return NextResponse.json({ error: 'Feil passord' }, { status: 401 });
  }

  const { error } = await supabase
    .from('responses')
    .delete()
    .eq('question_id', questionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
