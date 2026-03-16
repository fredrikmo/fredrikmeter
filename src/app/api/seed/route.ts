import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { QUESTIONS } from '@/lib/questions';

export async function POST() {
  for (const q of QUESTIONS) {
    const { error } = await supabase
      .from('questions')
      .upsert(q, { onConflict: 'id' });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ success: true });
}
