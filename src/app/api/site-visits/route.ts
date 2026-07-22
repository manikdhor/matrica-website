import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// PUBLIC endpoint - creates a site visit booking
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    // 10 bookings per hour per IP.
    const limited = rateLimit(`sitevisit:${ip}`, 10, 60 * 60 * 1000)
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      )
    }

    const body = await request.json()
    const { name, phone, email, projectId, preferredDate, preferredTime, peopleCount, freeTransport, message } = body
    if (!name || !name.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    if (!phone || !phone.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    if (!preferredDate) return NextResponse.json({ error: 'Preferred date is required' }, { status: 400 })

    // Resolve projectId (forms may send a slug); unknown values become null
    // instead of failing the booking with a foreign-key error.
    let resolvedProjectId: string | null = null
    if (projectId) {
      const project = await db.project.findFirst({
        where: { OR: [{ id: String(projectId) }, { slug: String(projectId) }] },
        select: { id: true },
      })
      resolvedProjectId = project?.id || null
    }

    const booking = await db.siteVisitBooking.create({
      data: {
        name: name.trim().slice(0, 120), phone: phone.trim().slice(0, 32), email: email?.trim().slice(0, 254) || null,
        projectId: resolvedProjectId, preferredDate,
        preferredTime: preferredTime || 'morning',
        peopleCount: peopleCount ? parseInt(peopleCount) : 1,
        freeTransport: freeTransport !== false, message: message?.trim().slice(0, 2000) || null,
      },
    })

    // Create notification for admin — booking already saved; don't let a
    // notification failure 500 the submission.
    await db.notification.create({
      data: {
        type: 'site_visit',
        title: 'New site visit booking',
        message: `${booking.name} (${booking.phone}) booked for ${preferredDate}`,
        link: `/admin/site-visits?id=${booking.id}`,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, id: booking.id }, { status: 201 })
  } catch (error) {
    console.error('Error creating site visit booking:', error)
    return NextResponse.json({ error: 'Failed to create booking. Please try again.' }, { status: 500 })
  }
}