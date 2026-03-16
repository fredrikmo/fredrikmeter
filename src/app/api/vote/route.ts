import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { questionId, answer, deviceType, browser, responseTimeMs } = await request.json();

  if (!questionId || !answer) {
    return NextResponse.json({ error: 'Mangler data' }, { status: 400 });
  }

  // Check if question is active
  const { data: question } = await supabase
    .from('questions')
    .select('is_active')
    .eq('id', questionId)
    .single();

  if (!question?.is_active) {
    return NextResponse.json({ error: 'Spørsmålet er ikke aktivt' }, { status: 403 });
  }

  const { error } = await supabase
    .from('responses')
    .insert({
      question_id: questionId,
      answer: answer.trim(),
      device_type: deviceType || null,
      browser: browser || null,
      response_time_ms: responseTimeMs || null,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
