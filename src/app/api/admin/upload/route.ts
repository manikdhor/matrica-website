import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename (same logic you probably already use)
    const ext = file.name.split('.').pop();
    const uniqueName = `${file.name.split('.')[0]}-${Date.now()}.${ext}`;
    
    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('uploads')
      .upload(`2026-07/${uniqueName}`, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    // Return the path that your database expects
    return NextResponse.json({ 
      path: `/api/uploads/2026-07/${uniqueName}` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}