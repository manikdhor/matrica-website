import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field.trim())
        field = ''
      } else if (ch === '\r' && next === '\n') {
        current.push(field.trim())
        field = ''
        rows.push(current)
        current = []
        i++ // skip \n
      } else if (ch === '\n' || ch === '\r') {
        current.push(field.trim())
        field = ''
        rows.push(current)
        current = []
      } else {
        field += ch
      }
    }
  }

  // Last field
  if (field || current.length > 0) {
    current.push(field.trim())
    rows.push(current)
  }

  return rows
}

const EXPECTED_COLUMNS = ['name', 'phone', 'email', 'source', 'project', 'priority', 'message', 'assignedto']

export async function POST(request: NextRequest) {
  const auth = await requirePermission('leads', true)
  if (auth instanceof Response) return auth

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are accepted' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })
    }

    // Parse headers (case-insensitive)
    const headerRow = rows[0].map((h) => h.toLowerCase().replace(/[^a-z]/g, ''))
    const colMap: Record<string, number> = {}

    for (let i = 0; i < headerRow.length; i++) {
      const cleaned = headerRow[i]
      const match = EXPECTED_COLUMNS.find((col) => cleaned.includes(col))
      if (match) {
        colMap[match] = i
      }
    }

    if (colMap.name === undefined || colMap.phone === undefined) {
      return NextResponse.json(
        { error: 'CSV must contain "name" and "phone" columns' },
        { status: 400 }
      )
    }

    // Fetch all projects for name matching
    const projects = await db.project.findMany({ select: { id: true, name: true } })
    const projectMap = new Map(projects.map((p) => [p.name.toLowerCase(), p.id]))

    const errors: { row: number; message: string }[] = []
    let imported = 0
    let skipped = 0

    // Process data rows
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      const rowNum = r + 1

      const name = row[colMap.name]?.trim()
      const phone = row[colMap.phone]?.trim()

      if (!name || !phone) {
        errors.push({ row: rowNum, message: 'Missing required fields (name or phone)' })
        skipped++
        continue
      }

      const email = colMap.email !== undefined ? row[colMap.email]?.trim() || null : null
      const source = colMap.source !== undefined ? row[colMap.source]?.trim() || 'manual' : 'manual'
      const rawProject = colMap.project !== undefined ? row[colMap.project]?.trim() || '' : ''
      const priority = colMap.priority !== undefined ? row[colMap.priority]?.trim() || 'medium' : 'medium'
      const message = colMap.message !== undefined ? row[colMap.message]?.trim() || null : null
      const assignedTo = colMap.assignedto !== undefined ? row[colMap.assignedto]?.trim() || null : null

      // Match project by name
      let projectId: string | null = null
      if (rawProject) {
        projectId = projectMap.get(rawProject.toLowerCase()) || null
      }

      // Validate priority
      const validPriority = ['high', 'medium', 'low'].includes(priority?.toLowerCase())
        ? priority.toLowerCase()
        : 'medium'

      try {
        await db.lead.create({
          data: {
            name,
            phone,
            email,
            source,
            projectId,
            priority: validPriority,
            message,
            assignedTo,
          },
        })

        imported++
      } catch (err) {
        errors.push({ row: rowNum, message: `Failed to create lead: ${(err as Error).message}` })
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
      skipped,
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ error: 'Failed to import CSV' }, { status: 500 })
  }
}