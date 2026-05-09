import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const settingsId = formData.get('settingsId') as string | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const path = `logo-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from('logos').getPublicUrl(path);
  const url = data.publicUrl;

  if (settingsId) {
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ logo_url: url, updated_at: new Date().toISOString() })
      .eq('id', settingsId);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('site_settings')
      .insert({ logo_url: url })
      .select()
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ url, settingsId: inserted.id });
  }

  return NextResponse.json({ url });
}
