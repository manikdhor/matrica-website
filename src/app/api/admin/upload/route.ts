import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Send the file to your NEW cPanel subdomain!
    const cpanelReceiverUrl = 'https://storage.matricarealestate.com/receive.php';

    const buffer = Buffer.from(await file.arrayBuffer());
    const cpanelFormData = new FormData();
    cpanelFormData.append('file', new Blob([buffer], { type: file.type }), file.name);

    const response = await fetch(cpanelReceiverUrl, {
      method: 'POST',
      body: cpanelFormData,
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error || 'Upload to storage failed');

    return NextResponse.json({ 
      success: true,
      url: result.path,
      path: result.path,
      filePath: result.path
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}