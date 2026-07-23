import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const filePath = segments.join('/')

  // Point directly to your cPanel server's public_html folder
  const cpanelStorageUrl = 'https://matricarealestate.com/uploads'; // Use your cPanel temp URL if needed (e.g. https://s1052.../~matricarealestat/uploads)

  return NextResponse.redirect(`${cpanelStorageUrl}/${filePath}`)
}