import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { dhakaDateStr, dhakaToday, dhakaDayStart, dhakaDayEnd } from '@/lib/dhaka-date'

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_ORDER = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'won', 'lost']

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  site_visit: 'Site Visit',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

const SCORE_RANGES = [
  { range: '0-20', min: 0, max: 20 },
  { range: '21-40', min: 21, max: 40 },
  { range: '41-60', min: 41, max: 60 },
  { range: '61-80', min: 61, max: 80 },
  { range: '81-100', min: 81, max: 100 },
]

const RESPONSE_BUCKET_MS = [
  { range: '< 1h', min: 0, max: 3_600_000 },
  { range: '1-4h', min: 3_600_000, max: 14_400_000 },
  { range: '4-24h', min: 14_400_000, max: 86_400_000 },
  { range: '1-3d', min: 86_400_000, max: 259_200_000 },
  { range: '> 3d', min: 259_200_000, max: Infinity },
]

const STAGE_INDEX: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s, i) => [s, i]))

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Day-bucketing keys off the Asia/Dhaka calendar day (see resolveDateRange).
function toDateStr(d: Date): string {
  return dhakaDateStr(d)
}

function resolveDateRange(from: string | null, to: string | null) {
  // `from`/`to` are `YYYY-MM-DD` Dhaka calendar days. Resolve them to the absolute
  // instants of Dhaka midnight → end-of-day so DB (UTC) filters and day-bucketing
  // agree regardless of the server's local timezone.
  const todayStr = dhakaToday()
  const fromStr = from
    ? from
    : dhakaDateStr(new Date(dhakaDayStart(todayStr).getTime() - 29 * 24 * 60 * 60 * 1000))
  const toStr = to || todayStr

  return { startDate: dhakaDayStart(fromStr), endDate: dhakaDayEnd(toStr) }
}

function generateDayKeys(start: Date, end: Date): string[] {
  // start is Dhaka midnight, end is Dhaka end-of-day — step a full day (no DST in
  // Dhaka) so each Dhaka calendar day appears exactly once.
  const keys: string[] = []
  let cur = start.getTime()
  const fin = end.getTime()
  while (cur <= fin) {
    keys.push(dhakaDateStr(new Date(cur)))
    cur += 24 * 60 * 60 * 1000
  }
  return keys
}

function formatHours(ms: number): string {
  if (ms <= 0) return '0h'
  const h = ms / 3_600_000
  if (h < 1) return `${Math.round(ms / 60_000)}m`
  return `${h.toFixed(1)}h`
}

function bucketize(values: number[], buckets: { range: string; min: number; max: number }[]) {
  return buckets.map(b => ({
    range: b.range,
    count: values.filter(v => v >= b.min && v < b.max).length,
  }))
}

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await requirePermission('reports', false)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const { startDate, endDate } = resolveDateRange(searchParams.get('from'), searchParams.get('to'))
    const days = generateDayKeys(startDate, endDate)

    const dateFilter = { createdAt: { gte: startDate, lte: endDate } }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // ── Parallel data fetches ──────────────────────────────────────────────

    const [
      leads,
      followUps,
      siteVisits,
      allLeadsLight,
      allVisitsLight,
      allNewsletters,
      [totalPosts, publishedPosts, draftPosts],
      activeTestimonials,
      activeFaqs,
      activeGalleryItems,
      activeLeadIds,
      recentActiveLeadIds,
      wonLeads,
    ] = await Promise.all([
      // Leads in date range with all status_change activities (for velocity, response time, scoring)
      db.lead.findMany({
        where: dateFilter,
        include: {
          activities: { where: { type: 'status_change' }, orderBy: { createdAt: 'asc' } },
        },
      }),

      // Follow-ups in date range
      db.leadFollowUp.findMany({ where: dateFilter }),

      // Site visits in date range
      db.siteVisitBooking.findMany({ where: dateFilter }),

      // All leads up to endDate (lightweight, for cumulative trends)
      db.lead.findMany({
        where: { createdAt: { lte: endDate } },
        select: { createdAt: true, status: true, source: true, score: true, phone: true, email: true },
      }),

      // All site visits up to endDate (lightweight)
      db.siteVisitBooking.findMany({
        where: { createdAt: { lte: endDate } },
        select: { createdAt: true, status: true, phone: true, email: true },
      }),

      // All newsletter subscribers
      db.newsletter.findMany({ select: { createdAt: true } }),

      // Blog post counts
      Promise.all([
        db.blogPost.count(),
        db.blogPost.count({ where: { status: 'published' } }),
        db.blogPost.count({ where: { status: 'draft' } }),
      ]),

      db.testimonial.count({ where: { status: 'active' } }),
      db.fAQ.count({ where: { enabled: true } }),
      db.galleryItem.count({ where: { enabled: true } }),

      // Active leads (not won/lost) for stalled detection
      db.lead.findMany({
        where: { status: { notIn: ['won', 'lost'] } },
        select: { id: true },
      }),

      // Lead IDs with any activity in the last 7 days
      db.leadActivity.groupBy({
        by: ['leadId'],
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      // All won leads with their first 'won' status_change activity
      db.lead.findMany({
        where: { status: 'won' },
        select: {
          id: true,
          phone: true,
          email: true,
          createdAt: true,
          activities: {
            where: { type: 'status_change', newStatus: 'won' },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      }),
    ])

    // ── Pre-compute daily index maps (O(n) instead of O(n * days)) ────────

    const daySet = new Set(days)

    // Lead daily counts
    const leadByDay = new Map<string, number>()
    const wonByDay = new Map<string, number>()
    for (const l of allLeadsLight) {
      const d = toDateStr(l.createdAt)
      leadByDay.set(d, (leadByDay.get(d) || 0) + 1)
      if (l.status === 'won') wonByDay.set(d, (wonByDay.get(d) || 0) + 1)
    }

    // Source daily counts
    const allSources = Array.from(new Set(allLeadsLight.map(l => l.source || 'unknown')))
    const sourceByDay = new Map<string, Map<string, number>>()
    for (const l of allLeadsLight) {
      const d = toDateStr(l.createdAt)
      const src = l.source || 'unknown'
      if (!sourceByDay.has(d)) sourceByDay.set(d, new Map())
      const dm = sourceByDay.get(d)!
      dm.set(src, (dm.get(src) || 0) + 1)
    }

    // Follow-up daily counts
    const fuCreatedByDay = new Map<string, number>()
    const fuCompletedByDay = new Map<string, number>()
    for (const f of followUps) {
      const cd = toDateStr(f.createdAt)
      if (daySet.has(cd)) fuCreatedByDay.set(cd, (fuCreatedByDay.get(cd) || 0) + 1)
      if (f.completedAt) {
        const fd = toDateStr(f.completedAt)
        if (daySet.has(fd)) fuCompletedByDay.set(fd, (fuCompletedByDay.get(fd) || 0) + 1)
      }
    }

    // Visit daily counts
    const visitByDay = new Map<string, number>()
    const visitCompletedByDay = new Map<string, number>()
    for (const v of allVisitsLight) {
      const d = toDateStr(v.createdAt)
      visitByDay.set(d, (visitByDay.get(d) || 0) + 1)
      if (v.status === 'completed') visitCompletedByDay.set(d, (visitCompletedByDay.get(d) || 0) + 1)
    }

    // Newsletter cumulative — pre-sort by date
    const newslettersSorted = [...allNewsletters].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const nlTotalByDay = new Map<string, number>()
    let nlRunning = 0
    for (const nl of newslettersSorted) {
      const d = toDateStr(nl.createdAt)
      nlRunning++
      nlTotalByDay.set(d, nlRunning)
    }
    const nlNewByDay = new Map<string, number>()
    for (const nl of allNewsletters) {
      const d = toDateStr(nl.createdAt)
      nlNewByDay.set(d, (nlNewByDay.get(d) || 0) + 1)
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1. LEAD ANALYTICS
    // ══════════════════════════════════════════════════════════════════════

    // 1a. leadFunnel
    const leadFunnel = STAGE_ORDER.map(stage => ({
      stage: STAGE_LABELS[stage] || stage,
      count: leads.filter(l => l.status === stage).length,
    }))

    // 1b. leadTrend
    const leadTrend = days.map(date => ({
      date,
      leads: leadByDay.get(date) || 0,
      won: wonByDay.get(date) || 0,
    }))

    // 1c. scoreDistribution
    const scoreDistribution = SCORE_RANGES.map(({ range, min, max }) => ({
      range,
      count: leads.filter(l => l.score >= min && l.score <= max).length,
    }))

    // 1d. scoreVsConversion
    const scoreVsConversion = SCORE_RANGES.map(({ range, min, max }) => {
      const inRange = leads.filter(l => l.score >= min && l.score <= max)
      return { range, total: inRange.length, won: inRange.filter(l => l.status === 'won').length }
    })

    // ══════════════════════════════════════════════════════════════════════
    // 2. PIPELINE VELOCITY
    // ══════════════════════════════════════════════════════════════════════

    // Collect per-stage metrics from consecutive activity pairs
    const stageDays: Record<string, number[]> = {}
    const stageMovedForward: Record<string, number> = {}
    const stageTotal: Record<string, number> = {}
    for (const s of STAGE_ORDER) {
      stageDays[s] = []
      stageMovedForward[s] = 0
      stageTotal[s] = 0
    }

    for (const lead of leads) {
      const acts = lead.activities
      if (acts.length === 0) {
        stageTotal[lead.status] = (stageTotal[lead.status] || 0) + 1
        continue
      }
      // Track the "entered" timestamp for the first status
      if (acts.length >= 1) {
        const firstStage = acts[0].newStatus || 'new'
        if (STAGE_INDEX[firstStage] !== undefined) {
          stageTotal[firstStage] = (stageTotal[firstStage] || 0) + 1
        }
      }
      // Consecutive pairs → time spent in each stage
      for (let i = 0; i < acts.length - 1; i++) {
        const from = acts[i].newStatus || 'new'
        const to = acts[i + 1].newStatus || 'new'
        if (STAGE_INDEX[from] === undefined) continue

        const diffMs = acts[i + 1].createdAt.getTime() - acts[i].createdAt.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        if (diffDays >= 0) stageDays[from].push(diffDays)

        if (to !== 'lost' && (STAGE_INDEX[to] ?? -1) > (STAGE_INDEX[from] ?? -1)) {
          stageMovedForward[from]++
        }
      }
    }

    const stageVelocity = STAGE_ORDER
      .filter(s => s !== 'won' && s !== 'lost')
      .map(stage => {
        const arr = stageDays[stage]
        const avgDays = arr.length > 0
          ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1))
          : 0
        return { stage, avgDays, totalLeads: stageTotal[stage] || 0, movedForward: stageMovedForward[stage] || 0 }
      })

    // 2b. pipelineHealth
    const activeIdSet = new Set(activeLeadIds.map(l => l.id))
    const recentIdSet = new Set(recentActiveLeadIds.map(r => r.leadId))
    const stalledLeads = activeLeadIds.filter(l => !recentIdSet.has(l.id)).length

    const conversionDaysArr: number[] = []
    for (const wl of wonLeads) {
      if (wl.activities.length > 0) {
        const diff = (wl.activities[0].createdAt.getTime() - new Date(wl.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        if (diff >= 0) conversionDaysArr.push(diff)
      }
    }
    const avgDaysToConvert = conversionDaysArr.length > 0
      ? Number((conversionDaysArr.reduce((a, b) => a + b, 0) / conversionDaysArr.length).toFixed(1))
      : 0

    const bottleneckEntry = stageVelocity.reduce(
      (best, sv) => (sv.avgDays > best.avgDays ? sv : best),
      { stage: 'new', avgDays: 0, totalLeads: 0, movedForward: 0 },
    )

    const pipelineHealth = {
      totalActive: activeLeadIds.length,
      stalledLeads,
      avgDaysToConvert,
      bottleneckStage: bottleneckEntry.stage,
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. ACTIVITY & FOLLOW-UP
    // ══════════════════════════════════════════════════════════════════════

    const fuCompleted = followUps.filter(f => f.status === 'completed')
    const fuPending = followUps.filter(f => f.status === 'pending')
    const now = new Date()
    const fuOverdue = followUps.filter(f => {
      if (f.status !== 'pending') return false
      try {
        // Interpret the stored due date/time as Asia/Dhaka so the boundary matches
        // the other overdue routes (which key off the Dhaka calendar day).
        const due = new Date(`${f.dueDate}T${f.dueTime || '23:59:59'}+06:00`)
        return due < now
      } catch {
        return false
      }
    })

    const fuCompletionHours: number[] = []
    for (const f of fuCompleted) {
      if (f.completedAt) {
        const h = (new Date(f.completedAt).getTime() - new Date(f.createdAt).getTime()) / 3_600_000
        if (h >= 0) fuCompletionHours.push(h)
      }
    }

    const followUpStats = {
      total: followUps.length,
      completed: fuCompleted.length,
      pending: fuPending.length,
      overdue: fuOverdue.length,
      completionRate: followUps.length > 0
        ? Number(((fuCompleted.length / followUps.length) * 100).toFixed(1))
        : 0,
      avgCompletionTimeHours: fuCompletionHours.length > 0
        ? Number((fuCompletionHours.reduce((a, b) => a + b, 0) / fuCompletionHours.length).toFixed(1))
        : 0,
    }

    // 3b. followUpTypes
    const fuTypeAgg = new Map<string, { count: number; completed: number }>()
    for (const f of followUps) {
      const t = f.type || 'other'
      if (!fuTypeAgg.has(t)) fuTypeAgg.set(t, { count: 0, completed: 0 })
      const entry = fuTypeAgg.get(t)!
      entry.count++
      if (f.status === 'completed') entry.completed++
    }
    const followUpTypes = Array.from(fuTypeAgg.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      completed: data.completed,
    }))

    // 3c. followUpTrend
    const followUpTrend = days.map(date => ({
      date,
      created: fuCreatedByDay.get(date) || 0,
      completed: fuCompletedByDay.get(date) || 0,
    }))

    // 3d. responseTimeDistribution
    const responseMs: number[] = []
    for (const lead of leads) {
      const firstNonNew = lead.activities.find(a => a.newStatus && a.newStatus !== 'new')
      if (firstNonNew) {
        const diff = firstNonNew.createdAt.getTime() - new Date(lead.createdAt).getTime()
        if (diff > 0) responseMs.push(diff)
      }
    }
    const responseTimeDistribution = bucketize(responseMs, RESPONSE_BUCKET_MS)

    // ══════════════════════════════════════════════════════════════════════
    // 4. SOURCE & CHANNEL
    // ══════════════════════════════════════════════════════════════════════

    // 4a. sourceEffectiveness
    const srcAgg = new Map<string, { leads: number; won: number; scores: number[]; responseMs: number[] }>()
    for (const lead of leads) {
      const src = lead.source || 'unknown'
      if (!srcAgg.has(src)) srcAgg.set(src, { leads: 0, won: 0, scores: [], responseMs: [] })
      const e = srcAgg.get(src)!
      e.leads++
      e.scores.push(lead.score)
      if (lead.status === 'won') e.won++

      const firstNonNew = lead.activities.find(a => a.newStatus && a.newStatus !== 'new')
      if (firstNonNew) {
        const diff = firstNonNew.createdAt.getTime() - new Date(lead.createdAt).getTime()
        if (diff > 0) e.responseMs.push(diff)
      }
    }
    const sourceEffectiveness = Array.from(srcAgg.entries()).map(([source, d]) => ({
      source,
      leads: d.leads,
      won: d.won,
      conversionRate: d.leads > 0 ? Number(((d.won / d.leads) * 100).toFixed(1)) : 0,
      avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
      avgResponseTime: d.responseMs.length > 0
        ? formatHours(d.responseMs.reduce((a, b) => a + b, 0) / d.responseMs.length)
        : 'N/A',
    }))

    // 4b. sourceTrend
    const sourceTrend = days.map(date => {
      const entry: Record<string, string | number> = { date }
      const dm = sourceByDay.get(date)
      for (const src of allSources) {
        entry[src] = dm?.get(src) || 0
      }
      return entry
    })

    // ══════════════════════════════════════════════════════════════════════
    // 4c. TEAM / AGENT PERFORMANCE (by assignedTo)
    // ══════════════════════════════════════════════════════════════════════

    const agentAgg = new Map<string, { leads: number; won: number; scores: number[]; responseMs: number[] }>()
    let unassignedCount = 0
    for (const lead of leads) {
      if (!lead.assignedTo) { unassignedCount++; continue }
      const key = lead.assignedTo
      if (!agentAgg.has(key)) agentAgg.set(key, { leads: 0, won: 0, scores: [], responseMs: [] })
      const e = agentAgg.get(key)!
      e.leads++
      e.scores.push(lead.score)
      if (lead.status === 'won') e.won++
      const firstNonNew = lead.activities.find(a => a.newStatus && a.newStatus !== 'new')
      if (firstNonNew) {
        const diff = firstNonNew.createdAt.getTime() - new Date(lead.createdAt).getTime()
        if (diff > 0) e.responseMs.push(diff)
      }
    }
    const agentPerformance = Array.from(agentAgg.entries())
      .map(([agent, d]) => ({
        agent,
        leads: d.leads,
        won: d.won,
        conversionRate: d.leads > 0 ? Number(((d.won / d.leads) * 100).toFixed(1)) : 0,
        avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
        avgResponseTime: d.responseMs.length > 0
          ? formatHours(d.responseMs.reduce((a, b) => a + b, 0) / d.responseMs.length)
          : 'N/A',
      }))
      .sort((a, b) => b.leads - a.leads)

    // ══════════════════════════════════════════════════════════════════════
    // 5. SITE VISIT
    // ══════════════════════════════════════════════════════════════════════

    const nonCancelledVisits = siteVisits.filter(v => v.status !== 'cancelled')
    const visitFunnel = {
      booked: nonCancelledVisits.length,
      confirmed: nonCancelledVisits.filter(v => v.status === 'confirmed' || v.status === 'completed').length,
      completed: nonCancelledVisits.filter(v => v.status === 'completed').length,
      convertedToLead: (() => {
        const wonPhones = new Set(wonLeads.map(l => l.phone))
        const wonEmails = new Set(wonLeads.map(l => l.email).filter((e): e is string => !!e))
        return siteVisits.filter(v => wonPhones.has(v.phone) || (v.email && wonEmails.has(v.email))).length
      })(),
    }

    // 5b. visitTrend
    const visitTrend = days.map(date => ({
      date,
      bookings: visitByDay.get(date) || 0,
      completed: visitCompletedByDay.get(date) || 0,
    }))

    // 5c. visitPreferences
    const preferredTimes = { morning: 0, afternoon: 0, evening: 0 }
    let transportRequested = 0
    const groupSizes: number[] = []

    for (const v of siteVisits) {
      const t = (v.preferredTime || '').toLowerCase()
      if (t.includes('afternoon')) preferredTimes.afternoon++
      else if (t.includes('evening')) preferredTimes.evening++
      else preferredTimes.morning++

      if (v.freeTransport) transportRequested++
      if (v.peopleCount > 0) groupSizes.push(v.peopleCount)
    }

    const visitPreferences = {
      preferredTimes,
      transportRequested,
      transportRate: siteVisits.length > 0
        ? Number(((transportRequested / siteVisits.length) * 100).toFixed(1))
        : 0,
      avgGroupSize: groupSizes.length > 0
        ? Number((groupSizes.reduce((a, b) => a + b, 0) / groupSizes.length).toFixed(1))
        : 0,
    }

    // ══════════════════════════════════════════════════════════════════════
    // 6. GROWTH
    // ══════════════════════════════════════════════════════════════════════

    // 6a. newsletterGrowth (cumulative)
    // Seed with subscribers that existed before the visible range, otherwise the
    // leading days (before the first in-range signup) read 0 despite prior subscribers.
    let nlPrevTotal = await db.newsletter.count({ where: { createdAt: { lt: startDate } } })
    const newsletterGrowth = days.map(date => {
      const total = nlTotalByDay.get(date) ?? nlPrevTotal
      nlPrevTotal = total
      return { date, total, new: nlNewByDay.get(date) || 0 }
    })

    // 6b. contentStats
    const contentStats = {
      totalPosts,
      published: publishedPosts,
      drafts: draftPosts,
      totalTestimonials: activeTestimonials,
      activeFaqs,
      galleryItems: activeGalleryItems,
    }

    // 6c. kpiTrend (cumulative)
    let kpiLeadTotal = 0
    let kpiWonTotal = 0
    let kpiVisitTotal = 0
    let kpiSubTotal = 0

    const kpiTrend = days.map(date => {
      kpiLeadTotal += leadByDay.get(date) || 0
      kpiWonTotal += wonByDay.get(date) || 0
      kpiVisitTotal += visitByDay.get(date) || 0
      kpiSubTotal += nlNewByDay.get(date) || 0
      return {
        date,
        leads: kpiLeadTotal,
        won: kpiWonTotal,
        visits: kpiVisitTotal,
        subscribers: kpiSubTotal,
      }
    })

    // ── Source Trend Keys (for dynamic chart series) ──
    const sourceTrendKeys = sourceEffectiveness.map(s => s.source)
    const sourcePieData = sourceEffectiveness.map(s => ({ name: s.source, value: s.leads }))

    // ── Visit Funnel formatted ──
    const VISIT_FUNNEL_COLORS = ['#34D399', '#3B82F6', '#A98B4F', '#8B5CF6']
    const visitFunnelFormatted = [
      { stage: 'Booked', count: visitFunnel.booked, color: VISIT_FUNNEL_COLORS[0] },
      { stage: 'Confirmed', count: visitFunnel.confirmed, color: VISIT_FUNNEL_COLORS[1] },
      { stage: 'Completed', count: visitFunnel.completed, color: VISIT_FUNNEL_COLORS[2] },
      { stage: 'Converted', count: visitFunnel.convertedToLead, color: VISIT_FUNNEL_COLORS[3] },
    ]

    // ── Preferred Times array ──
    const preferredTimesArr = [
      { time: 'Morning', count: visitPreferences.preferredTimes.morning || 0 },
      { time: 'Afternoon', count: visitPreferences.preferredTimes.afternoon || 0 },
      { time: 'Evening', count: visitPreferences.preferredTimes.evening || 0 },
    ]

    // ── Follow-up type names ──
    const followUpTypeNames = followUpTypes.map(ft => {
      const label: Record<string, string> = { call: 'Call', email: 'Email', visit: 'Visit', whatsapp: 'WhatsApp', other: 'Other' }
      return label[ft.type] || ft.type
    })

    // ── Status map entries for pipeline pie ──
    const statusAgg = new Map<string, number>()
    for (const l of allLeadsLight) {
      statusAgg.set(l.status, (statusAgg.get(l.status) || 0) + 1)
    }
    const statusMapEntries = Array.from(statusAgg.entries())

    // ── Avg response time ms ──
    const avgResponseTimeMs = responseMs.length > 0
      ? responseMs.reduce((a, b) => a + b, 0) / responseMs.length
      : 0

    // ── Response ─────────────────────────────────────────────────────────

    return NextResponse.json({
      leadAnalytics: {
        totalLeads: leads.length,
        winRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100) : 0,
        avgScore: allLeadsLight.length > 0 ? Number((allLeadsLight.reduce((a, l) => a + l.score, 0) / allLeadsLight.length).toFixed(1)) : 0,
        avgResponseTime: avgResponseTimeMs,
        leadFunnel: leadFunnel.map(f => ({ ...f, key: f.stage })),
        leadTrend,
        scoreDistribution,
        scoreVsConversion: scoreVsConversion.map(s => ({ range: s.range, leads: s.total, winRate: s.total > 0 ? Number(((s.won / s.total) * 100).toFixed(1)) : 0 })),
      },
      pipeline: {
        activePipeline: pipelineHealth.totalActive,
        stalledLeads: pipelineHealth.stalledLeads,
        avgDaysToConvert: pipelineHealth.avgDaysToConvert,
        stageVelocity: stageVelocity.map(s => ({ ...s, key: s.stage, forwardRate: s.totalLeads > 0 ? Number(((s.movedForward / s.totalLeads) * 100).toFixed(1)) : 0 })),
        bottleneck: { stage: pipelineHealth.bottleneckStage, avgDays: 0 },
        pipelineDistribution: statusMapEntries.map(([status, count]) => ({ name: STAGE_LABELS[status] || status, value: count })),
      },
      activity: {
        totalFollowUps: followUpStats.total,
        completionRate: Number(followUpStats.completionRate),
        overdue: followUpStats.overdue,
        avgCompletionTime: followUpStats.avgCompletionTimeHours,
        followUpTypeBreakdown: followUpTypeNames.map((name, i) => ({ name, value: followUpTypes[i]?.count || 0 })),
        followUpTrend,
        responseTimeDistribution,
      },
      sources: {
        totalSources: sourceEffectiveness.length,
        bestSource: sourceEffectiveness.length > 0 ? sourceEffectiveness[0].source : 'N/A',
        avgConversionRate: sourceEffectiveness.length > 0 ? Number((sourceEffectiveness.reduce((a, s) => a + s.conversionRate, 0) / sourceEffectiveness.length).toFixed(1)) : 0,
        sourceEffectiveness,
        sourceTrend,
        sourceTrendKeys,
        sourcePieData,
      },
      team: {
        totalAgents: agentPerformance.length,
        assignedLeads: leads.length - unassignedCount,
        unassignedLeads: unassignedCount,
        topAgent: agentPerformance.length > 0 ? agentPerformance[0].agent : 'N/A',
        agentPerformance,
      },
      siteVisits: {
        totalBookings: visitFunnel.booked,
        completionRate: visitFunnel.booked > 0 ? Number(((visitFunnel.completed / visitFunnel.booked) * 100).toFixed(1)) : 0,
        transportRequests: visitPreferences.transportRequested,
        avgGroupSize: visitPreferences.avgGroupSize,
        visitFunnel: visitFunnelFormatted,
        visitTrend,
        preferredTimes: preferredTimesArr,
        transportRate: Number(visitPreferences.transportRate),
      },
      growth: {
        totalSubscribers: allNewsletters.length,
        publishedPosts: contentStats.published,
        activeFaqs: contentStats.activeFaqs,
        galleryItems: contentStats.galleryItems,
        newsletterGrowth,
        kpiTrend,
      },
    })
  } catch (error) {
    console.error('Reports v2 error:', error)
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
  }
}