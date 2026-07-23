import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const filePath = segments.join('/')

  // Redirect to the permanent Supabase Storage CDN
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const redirectUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`

  return NextResponse.redirect(redirectUrl)
}