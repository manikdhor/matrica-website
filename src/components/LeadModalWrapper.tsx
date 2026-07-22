'use client'

import { useState, useEffect, useRef } from 'react'
import LeadModal from '@/components/LeadModal'

const AUTO_OPEN_KEY = 'matrica-lead-modal-auto-opened'

export default function LeadModalWrapper() {
  const [open, setOpen] = useState(false)
  const hasAutoOpened = useRef(false)

  useEffect(() => {
    if (hasAutoOpened.current) return
    // Once per session, and late enough not to interrupt first reading
    try {
      if (sessionStorage.getItem(AUTO_OPEN_KEY)) return
    } catch {}
    const timer = setTimeout(() => {
      hasAutoOpened.current = true
      try {
        sessionStorage.setItem(AUTO_OPEN_KEY, 'true')
      } catch {}
      setOpen(true)
    }, 45_000)
    return () => clearTimeout(timer)
  }, [])

  return <LeadModal open={open} onOpenChange={setOpen} />
}