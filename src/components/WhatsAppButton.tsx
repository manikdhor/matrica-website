'use client'

import { MessageCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSiteSettings, getWhatsAppLink } from '@/lib/use-site-settings'
import { useT } from '@/lib/use-ui-strings'

export default function WhatsAppButton() {
  const s = useSiteSettings()
  const t = useT()
  const href = getWhatsAppLink(s)

  // Admin toggle off, or no usable number (falls back to company phone) — hide
  if (!s.widgetWhatsappEnabled || href === '#') return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed fab-whatsapp z-40 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-transform"
            style={{ boxShadow: 'var(--shadow-md)' }}
            aria-label={t('chrome.whatsapp.aria')}
          >
            <MessageCircle className="w-7 h-7" />
          </a>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="bg-white text-slate-700 border-gray-200 text-sm"
        >
          {t('chrome.whatsapp.tooltip')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}