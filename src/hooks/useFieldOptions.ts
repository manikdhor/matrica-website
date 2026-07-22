'use client'

import { useState, useEffect, useCallback } from 'react'

interface FieldOption {
  label: string
  value: string
}

interface FieldOptions {
  lead_sources: FieldOption[]
  lead_statuses: FieldOption[]
  lead_priorities: FieldOption[]
  lead_tags_colors: FieldOption[]
  site_visit_statuses: FieldOption[]
  site_visit_times: FieldOption[]
  team_categories: FieldOption[]
  team_statuses: FieldOption[]
  project_statuses: FieldOption[]
  project_publish_statuses: FieldOption[]
  blog_statuses: FieldOption[]
  blog_categories: FieldOption[]
  testimonial_statuses: FieldOption[]
  faq_categories: FieldOption[]
  newsletter_sources: FieldOption[]
  whatsapp_categories: FieldOption[]
  gallery_media_types: FieldOption[]
  follow_up_types: FieldOption[]
  follow_up_statuses: FieldOption[]
  document_types: FieldOption[]
  [key: string]: FieldOption[]
}

const DEFAULT_OPTIONS: FieldOptions = {
  lead_sources: [
    { label: 'Website', value: 'website' },
    { label: 'Contact Form', value: 'contact' },
    { label: 'Project Page', value: 'project' },
    { label: 'Site Visit', value: 'site_visit' },
    { label: 'Blog', value: 'blog' },
    { label: 'Manual', value: 'manual' },
    { label: 'Referral', value: 'referral' },
    { label: 'Facebook', value: 'facebook' },
    { label: 'WhatsApp', value: 'whatsapp' },
  ],
  lead_statuses: [
    { label: 'New', value: 'new' },
    { label: 'Contacted', value: 'contacted' },
    { label: 'Qualified', value: 'qualified' },
    { label: 'Site Visit', value: 'site_visit' },
    { label: 'Negotiation', value: 'negotiation' },
    { label: 'Won', value: 'won' },
    { label: 'Lost', value: 'lost' },
  ],
  lead_priorities: [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ],
  lead_tags_colors: [
    { label: 'Indigo', value: '#6366F1' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Sky', value: '#0EA5E9' },
    { label: 'Pink', value: '#EC4899' },
    { label: 'Violet', value: '#8B5CF6' },
    { label: 'Orange', value: '#F97316' },
  ],
  site_visit_statuses: [
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ],
  site_visit_times: [
    { label: 'Morning (9AM-12PM)', value: 'morning' },
    { label: 'Afternoon (12PM-3PM)', value: 'afternoon' },
    { label: 'Evening (3PM-6PM)', value: 'evening' },
  ],
  team_categories: [
    { label: 'Management', value: 'management' },
    { label: 'Sales', value: 'sales' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Support', value: 'support' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Finance', value: 'finance' },
  ],
  team_statuses: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
  project_statuses: [
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Completed', value: 'completed' },
    { label: 'Sold Out', value: 'sold_out' },
    { label: 'Cancelled', value: 'cancelled' },
  ],
  project_publish_statuses: [
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
  ],
  blog_statuses: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
  blog_categories: [
    { label: 'Investment Guide', value: 'investment_guide' },
    { label: 'Project Update', value: 'project_update' },
    { label: 'Market Analysis', value: 'market_analysis' },
    { label: 'Company News', value: 'company_news' },
    { label: 'Real Estate Tips', value: 'real_estate_tips' },
    { label: 'Lifestyle', value: 'lifestyle' },
  ],
  testimonial_statuses: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
  faq_categories: [
    { label: 'General', value: 'general' },
    { label: 'Projects', value: 'projects' },
    { label: 'Payment', value: 'payment' },
    { label: 'Legal', value: 'legal' },
    { label: 'Location', value: 'location' },
    { label: 'Construction', value: 'construction' },
  ],
  newsletter_sources: [
    { label: 'Manual', value: 'manual' },
    { label: 'Footer', value: 'footer' },
    { label: 'Popup', value: 'popup' },
    { label: 'Lead Form', value: 'lead_form' },
  ],
  whatsapp_categories: [
    { label: 'General', value: 'general' },
    { label: 'Welcome', value: 'welcome' },
    { label: 'Follow Up', value: 'follow_up' },
    { label: 'Promotion', value: 'promotion' },
    { label: 'Reminder', value: 'reminder' },
    { label: 'Notification', value: 'notification' },
    { label: 'Custom', value: 'custom' },
  ],
  gallery_media_types: [
    { label: 'Image', value: 'image' },
    { label: 'Video', value: 'video' },
  ],
  follow_up_types: [
    { label: 'Call', value: 'call' },
    { label: 'Email', value: 'email' },
    { label: 'WhatsApp', value: 'whatsapp' },
    { label: 'Site Visit', value: 'site_visit' },
    { label: 'Meeting', value: 'meeting' },
    { label: 'Other', value: 'other' },
  ],
  follow_up_statuses: [
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ],
  document_types: [
    { label: 'Brochure', value: 'brochure' },
    { label: 'Floor Plan', value: 'floor_plan' },
    { label: 'Price List', value: 'price_list' },
    { label: 'Payment Plan', value: 'payment_plan' },
    { label: 'Legal Document', value: 'legal_document' },
    { label: 'Site Map', value: 'site_map' },
    { label: 'Other', value: 'other' },
  ],
}

// Cache the fetch promise so multiple components don't trigger duplicate requests
let fetchPromise: Promise<FieldOptions> | null = null

async function fetchOptions(): Promise<FieldOptions> {
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/api/admin/options')
    .then(r => r.json())
    .then(data => {
      if (data.options) return data.options as FieldOptions
      return DEFAULT_OPTIONS
    })
    .catch(() => DEFAULT_OPTIONS)
    .finally(() => {
      fetchPromise = null
    })

  return fetchPromise
}

export function useFieldOptions() {
  const [state, setState] = useState<{ options: FieldOptions; loading: boolean }>({
    options: DEFAULT_OPTIONS,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    fetchOptions().then((opts) => {
      if (!cancelled) {
        setState({ options: opts, loading: false })
      }
    })
    return () => { cancelled = true }
  }, [])

  const reload = useCallback(() => {
    let cancelled = false
    setState(prev => ({ ...prev, loading: true }))
    fetchOptions().then((opts) => {
      if (!cancelled) {
        setState({ options: opts, loading: false })
      }
    })
    return () => { cancelled = true }
  }, [])

  const { options, loading } = state

  // Helper to get values array from a key
  const getValues = useCallback((key: string): string[] => {
    return (options[key] || []).map(o => o.value)
  }, [options])

  // Helper to get label for a value
  const getLabel = useCallback((key: string, value: string): string => {
    const opt = (options[key] || []).find(o => o.value === value)
    return opt ? opt.label : value
  }, [options])

  // Helper to get full options for a select
  const getOptions = useCallback((key: string): FieldOption[] => {
    return options[key] || []
  }, [options])

  return { options, loading, reload, getValues, getLabel, getOptions }
}