'use client'

import { useState } from 'react'
import { Loader2, ShieldCheck, CheckCircle2, Mail, MessageCircle, Building2, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const projectOptions = [
  { value: 'chandra-chaya', label: 'Chandra Chaya' },
  { value: 'ventura-city', label: 'Ventura City' },
]

interface LeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultSource?: string
}

export default function LeadModal({ open, onOpenChange, defaultSource = 'website' }: LeadModalProps) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    projectId: '',
    message: '',
  })

  const resetForm = () => setForm({ name: '', phone: '', email: '', projectId: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error('Please fill in your name and phone number')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: defaultSource,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Thank you! Our team will contact you soon.')
        setSubmitted(true)
      } else {
        toast.error(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setSubmitted(false); resetForm(); } onOpenChange(v) }}>
      <DialogContent showCloseButton={false} className="bg-white border-0 max-w-md w-[95%] p-0 overflow-hidden rounded-2xl shadow-2xl">
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#1E6B3A]" />
            </div>
            <h3 className="text-xl font-bold text-[#1A202C]">Thank You, {form.name}! 🎉</h3>
            <p className="text-sm text-[#64748B]">
              We&apos;ve received your inquiry. Our team will contact you within 24 hours.
            </p>
            <div className="space-y-2 pt-2">
              {form.email && (
                <div className="flex items-center justify-center gap-2 text-sm text-[#475569]">
                  <Mail className="w-4 h-4 text-[#1E6B3A]" />
                  <span>Confirmation email sent to {form.email}</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-sm text-[#475569]">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp message will be sent shortly</span>
              </div>
            </div>
            <Button
              onClick={() => { setSubmitted(false); resetForm(); onOpenChange(false) }}
              className="mt-4 bg-[#1E6B3A] text-white hover:bg-[#166B34]"
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Branded header band */}
            <div className="relative px-6 pt-6 pb-5" style={{ background: 'linear-gradient(150deg, #0F2B1A 0%, #1E6B3A 100%)' }}>
              <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)' }} />
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#C7AE79]" />
                </span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/60 font-medium">Matrica Real Estate</span>
              </div>
              <DialogTitle className="font-heading text-2xl font-semibold text-white leading-tight">
                Get in Touch
              </DialogTitle>
              <DialogDescription className="text-white/65 text-sm mt-1.5">
                Leave your details — a land advisor reaches out within 2 hours.
              </DialogDescription>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[calc(100dvh-19rem)] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-[11px] font-medium uppercase tracking-wide text-[#6B776E]">
                    Name <span className="text-[#B4472A]">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="premium-input mt-1.5 h-11"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-[11px] font-medium uppercase tracking-wide text-[#6B776E]">
                    Phone <span className="text-[#B4472A]">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="01XXX-XXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="premium-input mt-1.5 h-11"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-[11px] font-medium uppercase tracking-wide text-[#6B776E]">
                  Email <span className="text-[#9AA69C] normal-case tracking-normal">(optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="premium-input mt-1.5 h-11"
                />
              </div>

              <div>
                <Label htmlFor="project" className="text-[11px] font-medium uppercase tracking-wide text-[#6B776E]">Project</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(val) => setForm({ ...form, projectId: val })}
                >
                  <SelectTrigger id="project" className="bg-white border-[#E2E8F0] mt-1.5 h-11 focus:ring-[#1E6B3A] focus:border-[#1E6B3A]">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {projectOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message" className="text-[11px] font-medium uppercase tracking-wide text-[#6B776E]">
                  Message <span className="text-[#9AA69C] normal-case tracking-normal">(optional)</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Any specific requirements..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="premium-input mt-1.5 min-h-[76px] resize-none"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E6B3A] text-white hover:bg-[#166B34] font-semibold h-12 transition-colors group"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? 'Submitting...' : 'Submit'}
                {!loading && <Send className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />}
              </Button>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1E6B3A]" />
                <span className="text-[#6B776E] text-xs">Your information is secure &amp; confidential</span>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}