import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const filePath = segments.join('/')

  // Fetch images directly from your NEW cPanel subdomain hard drive
  const cpanelStorageUrl = 'https://storage.matricarealestate.com/uploads';

  return NextResponse.redirect(`${cpanelStorageUrl}/${filePath}`)
}