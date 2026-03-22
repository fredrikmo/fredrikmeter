import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, text, type, options } = await request.json();

  if (!id || !text || !type) {
    return NextResponse.json({ error: 'ID, tekst og type er påkrevd' }, { status: 400 });
  }

  if (!['word_cloud', 'multiple_choice'].includes(type)) {
    return NextResponse.json({ error: 'Type må være word_cloud eller multiple_choice' }, { status: 400 });
  }

  if (type === 'multiple_choice' && (!options || options.length < 2)) {
    return NextResponse.json({ error: 'Flervalg trenger minst 2 alternativer' }, { status: 400 });
  }

  const { error } = await supabase
    .from('questions')
    .update({
      text,
      type,
      options: type === 'multiple_choice' ? options : null,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
