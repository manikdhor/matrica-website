'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  Sparkles,
  FileText,
  Building2,
  Share2,
  HelpCircle,
  Mail,
  Copy,
  Check,
  Loader2,
  BookOpen,
  MapPin,
  Hash,
  MessageSquare,
  Send,
  ArrowRight,
  RefreshCw,
  Clock,
  Type,
  Users,
  Zap,
  BarChart3,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentType = 'blog_post' | 'project_description' | 'social_media' | 'faq_answer' | 'email_campaign'

interface ContentTypeInfo {
  id: ContentType
  label: string
  icon: React.ReactNode
  description: string
}

interface BlogResult {
  title: string
  excerpt: string
  content: string
  metaDescription: string
  suggestedTags: string[]
}

interface ProjectDescResult {
  tagline: string
  summary: string
  description: string
  highlights: string[]
}

interface SocialPost {
  platform: string
  content: string
  hashtags: string
}

interface SocialResult {
  posts: SocialPost[]
}

interface FaqResult {
  answer: string
}

interface EmailResult {
  subject: string
  previewText: string
  body: string
  ctaText: string
  ctaLink: string
}

// ─── Content Types ─────────────────────────────────────────────────────────────

const contentTypes: ContentTypeInfo[] = [
  { id: 'blog_post', label: 'Blog Post', icon: <FileText className="w-4 h-4" />, description: 'SEO-optimized blog posts' },
  { id: 'project_description', label: 'Project Description', icon: <Building2 className="w-4 h-4" />, description: 'Compelling project copy' },
  { id: 'social_media', label: 'Social Media', icon: <Share2 className="w-4 h-4" />, description: 'Platform-specific posts' },
  { id: 'faq_answer', label: 'FAQ Answer', icon: <HelpCircle className="w-4 h-4" />, description: 'Helpful FAQ responses' },
  { id: 'email_campaign', label: 'Email Campaign', icon: <Mail className="w-4 h-4" />, description: 'Marketing emails' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getReadingTime(text: string) {
  const words = getWordCount(text)
  const minutes = Math.max(1, Math.ceil(words / 200))
  return minutes
}

function formatReadingTime(text: string) {
  const minutes = getReadingTime(text)
  return minutes === 1 ? '1 min read' : `${minutes} min read`
}

// ─── Animated Sparkle Component ───────────────────────────────────────────────

function AnimatedSparkles({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.5, y: 4 }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8], y: [4, -2, 4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
        >
          <Sparkles className="w-4 h-4 text-[#34D399]" />
        </motion.span>
      ))}
    </div>
  )
}

// ─── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(label ? `${label} copied!` : 'Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600/50"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </motion.button>
  )
}

// ─── Content Stats Bar ────────────────────────────────────────────────────────

function ContentStatsBar({ text }: { text: string }) {
  const words = getWordCount(text)
  const readTime = formatReadingTime(text)
  const chars = text.length

  return (
    <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800/50">
      <span className="flex items-center gap-1.5">
        <Type className="w-3.5 h-3.5" />
        {words.toLocaleString()} words
      </span>
      <span className="w-px h-3 bg-slate-700/50" />
      <span className="flex items-center gap-1.5">
        <Hash className="w-3.5 h-3.5" />
        {chars.toLocaleString()} chars
      </span>
      <span className="w-px h-3 bg-slate-700/50" />
      <span className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        {readTime}
      </span>
    </div>
  )
}

// ─── Loading Shimmer ────────────────────────────────────────────────────────────

function PremiumShimmer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-card p-6 overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-6">
        <AnimatedSparkles />
        <p className="text-sm font-medium text-[#34D399]">AI is crafting your content...</p>
      </div>

      <div className="space-y-4">
        {/* Title shimmer */}
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-slate-800/60" />
          <div className="h-6 w-3/4 rounded-lg bg-slate-800/40 animate-pulse" />
        </div>

        {/* Content lines shimmer */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-4 rounded-md animate-pulse"
            style={{
              background: 'linear-gradient(90deg, rgba(30,41,59,0.4) 25%, rgba(51,65,85,0.6) 50%, rgba(30,41,59,0.4) 75%)',
              backgroundSize: '200% 100%',
              animation: `shimmer 1.5s infinite ${i * 0.1}s`,
              width: i === 4 ? '55%' : '100%',
            }}
          />
        ))}

        {/* Tags shimmer */}
        <div className="flex gap-2 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-16 rounded-full bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      </div>

      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </motion.div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="admin-card p-10 flex flex-col items-center justify-center text-center min-h-[360px] relative overflow-hidden"
    >
      {/* Subtle animated background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(30,107,58,0.08) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1E6B3A]/20 to-[#A98B4F]/10 border border-[#1E6B3A]/20 flex items-center justify-center mb-5">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-9 h-9 text-[#34D399]" />
          </motion.div>
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-white mb-2 relative"
      >
        Your content canvas awaits
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-slate-400 max-w-sm relative"
      >
        Fill in the form and let AI create premium content for your real estate brand
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 mt-6 text-xs text-slate-600 relative"
      >
        <Zap className="w-3.5 h-3.5 text-[#A98B4F]" />
        <span>Powered by AI</span>
        <span className="w-1 h-1 rounded-full bg-slate-700" />
        <span>Instant results</span>
      </motion.div>
    </motion.div>
  )
}

// ─── Input Hint ────────────────────────────────────────────────────────────────

function InputHint({ text }: { text: string }) {
  return (
    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
      <span className="text-[#A98B4F]/60">💡</span> {text}
    </p>
  )
}

// ─── Blog Post Form ───────────────────────────────────────────────────────────

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'informative', label: 'Informative' },
]

function BlogPostForm({ onGenerate }: { onGenerate: (input: Record<string, string | string[]>) => void }) {
  const [title, setTitle] = useState('')
  const [tone, setTone] = useState('professional')
  const [keywords, setKeywords] = useState('')

  return (
    <motion.div
      key="blog-form"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <BookOpen className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Blog Post Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          className="admin-input w-full"
          placeholder="e.g., Why Purbachal is the Best Investment Destination in 2025"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <InputHint text="A clear, specific title yields better SEO-optimized content" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2.5">
          <Type className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Writing Tone
        </label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                tone === t.value
                  ? 'bg-[#1E6B3A]/20 text-[#34D399] border-[#1E6B3A]/40 shadow-[0_0_12px_rgba(30,107,58,0.15)]'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-slate-600/60 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <Hash className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Keywords <span className="text-slate-500">(comma separated)</span>
        </label>
        <input
          type="text"
          className="admin-input w-full"
          placeholder="e.g., purbachal, real estate, investment, Dhaka"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <InputHint text="Keywords help AI optimize content for search engines" />
      </div>

      <motion.button
        onClick={() => onGenerate({ title, tone, keywords })}
        disabled={!title.trim()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="btn-admin btn-admin-primary w-full disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        <Sparkles className="w-4 h-4" /> Generate Blog Post
      </motion.button>
    </motion.div>
  )
}

// ─── Blog Post Output ─────────────────────────────────────────────────────────

function BlogPostOutput({ data }: { data: BlogResult }) {
  const [viewMode, setViewMode] = useState<'markdown' | 'preview'>('preview')

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Generated Title</h4>
          <CopyButton text={data.title} label="Title" />
        </div>
        <p className="text-white font-semibold text-lg leading-snug">{data.title}</p>
      </div>

      {/* Excerpt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Excerpt</h4>
          <CopyButton text={data.excerpt} label="Excerpt" />
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{data.excerpt}</p>
      </div>

      {/* Content with markdown/preview toggle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Content</h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/40">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'preview' ? 'bg-[#1E6B3A]/20 text-[#34D399]' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" /> Preview
              </button>
              <button
                onClick={() => setViewMode('markdown')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'markdown' ? 'bg-[#1E6B3A]/20 text-[#34D399]' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5 inline mr-1" /> Markdown
              </button>
            </div>
            <CopyButton text={data.content} label="Content" />
          </div>
        </div>
        <div className="bg-slate-950/60 rounded-lg border border-slate-800/50 overflow-hidden">
          {viewMode === 'preview' ? (
            <div className="p-5 prose prose-invert prose-sm prose-emerald max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-200 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-slate-300 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-slate-300 [&_ol]:space-y-1 [&_li]:text-sm [&_strong]:text-white [&_strong]:font-semibold [&_em]:text-slate-200 [&_blockquote]:border-l-2 [&_blockquote]:border-[#1E6B3A] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-400 [&_a]:text-[#34D399] [&_hr]:border-slate-800 [&_code]:bg-slate-800/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#34D399] [&_code]:text-xs max-h-96 overflow-y-auto custom-scrollbar">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>
          ) : (
            <pre className="p-4 text-slate-200 text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
              {data.content}
            </pre>
          )}
          <ContentStatsBar text={data.content} />
        </div>
      </div>

      {/* Meta & Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Meta Description</h4>
            <CopyButton text={data.metaDescription} label="Meta" />
          </div>
          <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
            {data.metaDescription}
          </p>
          <p className="text-xs text-slate-500 mt-1">{data.metaDescription.length}/160 chars</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Tags</h4>
            <CopyButton text={data.suggestedTags?.join(', ')} label="Tags" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.suggestedTags?.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#1E6B3A]/15 text-[#34D399] border border-[#1E6B3A]/20">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Project Description Form ─────────────────────────────────────────────────

function ProjectDescForm({ onGenerate }: { onGenerate: (input: Record<string, string | string[]>) => void }) {
  const [projectName, setProjectName] = useState('')
  const [features, setFeatures] = useState('')
  const [location, setLocation] = useState('')
  const [tone, setTone] = useState('professional')

  return (
    <motion.div
      key="project-form"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <Building2 className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Project Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          className="admin-input w-full"
          placeholder="e.g., Chandra Chaya"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <InputHint text="Use the official project name for brand consistency" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Key Features</label>
        <textarea
          className="admin-input w-full min-h-[80px] resize-y"
          placeholder={`One feature per line, e.g.:\nRAJUK approved plots\n24/7 security\nGated community`}
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
        />
        <InputHint text="List unique selling points to generate richer descriptions" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <MapPin className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Location
        </label>
        <input
          type="text"
          className="admin-input w-full"
          placeholder="e.g., Purbachal, Dhaka"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2.5">
          <Type className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Writing Tone
        </label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                tone === t.value
                  ? 'bg-[#1E6B3A]/20 text-[#34D399] border-[#1E6B3A]/40 shadow-[0_0_12px_rgba(30,107,58,0.15)]'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-slate-600/60 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={() =>
          onGenerate({
            projectName,
            features: features ? features.split('\n').filter(Boolean) : [],
            location,
            tone,
          })
        }
        disabled={!projectName.trim()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="btn-admin btn-admin-primary w-full disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        <Sparkles className="w-4 h-4" /> Generate Project Description
      </motion.button>
    </motion.div>
  )
}

// ─── Project Description Output ───────────────────────────────────────────────

function ProjectDescOutput({ data }: { data: ProjectDescResult }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tagline</h4>
          <CopyButton text={data.tagline} label="Tagline" />
        </div>
        <p className="text-[#A98B4F] font-semibold text-lg italic">&ldquo;{data.tagline}&rdquo;</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Summary</h4>
          <CopyButton text={data.summary} label="Summary" />
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{data.summary}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Description</h4>
          <CopyButton text={data.description} label="Description" />
        </div>
        <div className="bg-slate-950/60 rounded-lg border border-slate-800/50 overflow-hidden">
          <div className="p-5 prose prose-invert prose-sm prose-emerald max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-200 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-slate-300 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-slate-300 [&_ol]:space-y-1 [&_li]:text-sm [&_strong]:text-white [&_strong]:font-semibold [&_em]:text-slate-200 [&_blockquote]:border-l-2 [&_blockquote]:border-[#1E6B3A] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-400 max-h-96 overflow-y-auto custom-scrollbar">
            <ReactMarkdown>{data.description}</ReactMarkdown>
          </div>
          <ContentStatsBar text={data.description} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Key Highlights</h4>
          <CopyButton text={data.highlights?.join('\n• ')} label="Highlights" />
        </div>
        <ul className="space-y-2">
          {data.highlights?.map((h, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6B3A] mt-1.5 shrink-0" />
              {h}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-800/50">
        <button
          onClick={() => {
            const all = `# ${data.tagline}\n\n${data.summary}\n\n${data.description}\n\n**Highlights:**\n${data.highlights?.map((h) => `- ${h}`).join('\n')}`
            navigator.clipboard.writeText(all)
            toast.success('All content copied!')
          }}
          className="btn-admin btn-admin-primary text-sm"
        >
          <Copy className="w-4 h-4" /> Copy All
        </button>
        <button className="btn-admin btn-admin-secondary text-sm">
          <Building2 className="w-4 h-4" /> Apply to Project
        </button>
      </div>
    </div>
  )
}

// ─── Social Media Form ────────────────────────────────────────────────────────

const PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', iconChar: 'f', desc: 'Best for community posts' },
  { value: 'linkedin', label: 'LinkedIn', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', iconChar: 'in', desc: 'Professional audience' },
  { value: 'whatsapp', label: 'WhatsApp', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', iconChar: 'wa', desc: 'Direct engagement' },
]

function SocialMediaForm({ onGenerate }: { onGenerate: (input: Record<string, string>) => void }) {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('facebook')

  return (
    <motion.div
      key="social-form"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <MessageSquare className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Topic <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          className="admin-input w-full"
          placeholder="e.g., New plot launch in Purbachal"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <InputHint text="Be specific — include project name or offer details for better results" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2.5">
          <Share2 className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Target Platform
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PLATFORM_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value)}
              className={`relative flex flex-col items-center gap-1.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border text-center ${
                platform === p.value
                  ? `${p.bg} ${p.color} ${p.border} shadow-[0_0_20px_rgba(0,0,0,0.2)]`
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-slate-600/60 hover:text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span className={`font-bold text-sm ${platform === p.value ? p.color : 'text-slate-500'}`}>{p.iconChar}</span>
              <span className="font-medium text-xs">{p.label}</span>
              <span className={`text-[10px] ${platform === p.value ? 'text-slate-400' : 'text-slate-600'}`}>{p.desc}</span>
              {platform === p.value && (
                <motion.div
                  layoutId="platform-indicator"
                  className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#34D399]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={() => onGenerate({ topic, platform })}
        disabled={!topic.trim()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="btn-admin btn-admin-primary w-full disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        <Sparkles className="w-4 h-4" /> Generate Social Media Posts
      </motion.button>
    </motion.div>
  )
}

// ─── Social Media Output ──────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { color: string; bg: string; border: string; iconChar: string }> = {
  facebook: { color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20', iconChar: 'f' },
  linkedin: { color: 'text-sky-400', bg: 'bg-sky-500/5', border: 'border-sky-500/20', iconChar: 'in' },
  whatsapp: { color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', iconChar: 'wa' },
}

function SocialMediaOutput({ data }: { data: SocialResult }) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Generated Variations</h4>
      <div className="space-y-3">
        {data.posts?.map((post, i) => {
          const meta = PLATFORM_META[post.platform] || PLATFORM_META.facebook
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl p-4 border ${meta.bg} ${meta.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.bg} border ${meta.border}`}>
                    <span className={`font-bold text-xs ${meta.color}`}>{meta.iconChar}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-300">Variation {i + 1}</span>
                    <span className="text-xs text-slate-600 mx-1.5">·</span>
                    <span className={`text-xs font-medium capitalize ${meta.color}`}>{post.platform}</span>
                  </div>
                </div>
                <CopyButton text={`${post.content}\n\n${post.hashtags}`} label={`Post ${i + 1}`} />
              </div>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              <p className="text-[#A98B4F]/70 text-xs mt-3">{post.hashtags}</p>
              <ContentStatsBar text={post.content} />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── FAQ Form ─────────────────────────────────────────────────────────────────

function FaqForm({ onGenerate }: { onGenerate: (input: Record<string, string>) => void }) {
  const [question, setQuestion] = useState('')
  const [context, setContext] = useState('')

  return (
    <motion.div
      key="faq-form"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <HelpCircle className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Question <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          className="admin-input w-full"
          placeholder="e.g., What sizes of plots are available at Chandra Chaya?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <InputHint text="Write the question exactly as a customer would ask it" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Additional Context</label>
        <textarea
          className="admin-input w-full min-h-[80px] resize-y"
          placeholder="Provide any relevant details to help generate a better answer..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
        <InputHint text="Optional — helps AI provide more specific, accurate answers" />
      </div>

      <motion.button
        onClick={() => onGenerate({ question, context })}
        disabled={!question.trim()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="btn-admin btn-admin-primary w-full disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        <Sparkles className="w-4 h-4" /> Generate Answer
      </motion.button>
    </motion.div>
  )
}

// ─── FAQ Output ───────────────────────────────────────────────────────────────

function FaqOutput({ data }: { data: FaqResult }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Generated Answer</h4>
        <CopyButton text={data.answer} label="Answer" />
      </div>
      <div className="bg-slate-950/60 rounded-lg border border-slate-800/50 overflow-hidden">
        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap p-5">{data.answer}</p>
        <ContentStatsBar text={data.answer} />
      </div>
    </div>
  )
}

// ─── Email Campaign Form ──────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  { value: 'new_leads', label: 'New Leads', icon: <Users className="w-4 h-4" />, desc: 'Fresh prospects' },
  { value: 'site_visitors', label: 'Site Visitors', icon: <Eye className="w-4 h-4" />, desc: 'Returning traffic' },
  { value: 'newsletter', label: 'Newsletter Subscribers', icon: <Mail className="w-4 h-4" />, desc: 'Engaged readers' },
]

function EmailForm({ onGenerate }: { onGenerate: (input: Record<string, string>) => void }) {
  const [subject, setSubject] = useState('')
  const [target, setTarget] = useState('new_leads')
  const [project, setProject] = useState('')
  const [offer, setOffer] = useState('')

  return (
    <motion.div
      key="email-form"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <Mail className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Subject Line <span className="text-slate-500">(optional — AI will suggest)</span>
        </label>
        <input
          type="text"
          className="admin-input w-full"
          placeholder="e.g., Exclusive Offer on Purbachal Plots"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <InputHint text="Leave blank for AI-generated subject lines optimized for open rates" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2.5">
          <Users className="w-4 h-4 inline mr-1.5 text-[#34D399]" />
          Target Audience <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {AUDIENCE_OPTIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => setTarget(a.value)}
              className={`relative flex flex-col items-center gap-1.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border text-center ${
                target === a.value
                  ? 'bg-[#1E6B3A]/15 text-[#34D399] border-[#1E6B3A]/30 shadow-[0_0_20px_rgba(0,0,0,0.2)]'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-slate-600/60 hover:text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              {a.icon}
              <span className="font-medium text-xs">{a.label}</span>
              <span className={`text-[10px] ${target === a.value ? 'text-[#34D399]/60' : 'text-slate-600'}`}>{a.desc}</span>
              {target === a.value && (
                <motion.div
                  layoutId="audience-indicator"
                  className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#34D399]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Project</label>
        <select className="admin-select w-full" value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">All Projects</option>
          <option value="Chandra Chaya">Chandra Chaya</option>
          <option value="Ventura City">Ventura City</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Special Offer</label>
        <input
          type="text"
          className="admin-input w-full"
          placeholder="e.g., 10% early bird discount"
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
        />
        <InputHint text="Mention any ongoing promotions for more relevant copy" />
      </div>

      <motion.button
        onClick={() => onGenerate({ subject, target, project, offer })}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="btn-admin btn-admin-primary w-full text-sm"
      >
        <Sparkles className="w-4 h-4" /> Generate Email Campaign
      </motion.button>
    </motion.div>
  )
}

// ─── Email Output ─────────────────────────────────────────────────────────────

function EmailOutput({ data }: { data: EmailResult }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</h4>
            <CopyButton text={data.subject} label="Subject" />
          </div>
          <p className="text-white font-medium text-sm">{data.subject}</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview Text</h4>
            <CopyButton text={data.previewText} label="Preview" />
          </div>
          <p className="text-slate-300 text-sm">{data.previewText}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Body</h4>
          <CopyButton text={data.body} label="Body" />
        </div>
        <div className="bg-slate-950/60 rounded-lg border border-slate-800/50 overflow-hidden">
          <div className="p-5 prose prose-invert prose-sm prose-emerald max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-2 [&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-slate-300 [&_ul]:space-y-1 [&_li]:text-sm [&_strong]:text-white [&_strong]:font-semibold [&_a]:text-[#34D399] max-h-96 overflow-y-auto custom-scrollbar">
            <ReactMarkdown>{data.body}</ReactMarkdown>
          </div>
          <ContentStatsBar text={data.body} />
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/40">
        <div className="flex-1">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Call to Action</h4>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E6B3A] text-white text-sm font-medium">
              {data.ctaText}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs text-slate-500 truncate">{data.ctaLink}</span>
          </div>
        </div>
        <CopyButton text={`${data.ctaText} → ${data.ctaLink}`} label="CTA" />
      </div>
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function AIContentWriterPage() {
  const [activeType, setActiveType] = useState<ContentType>('blog_post')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastInputRef = useRef<Record<string, string | string[]> | null>(null)
  const [contentCount] = useState(47) // Static for now

  const handleGenerate = useCallback(async (input: Record<string, string | string[]>) => {
    lastInputRef.current = input
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/ai/content-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeType, input }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Generation failed')
        toast.error(data.error || 'Failed to generate content')
        return
      }
      setResult(data.content)
      toast.success('Content generated successfully!')
    } catch {
      setError('Network error. Please try again.')
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }, [activeType])

  const handleRegenerate = useCallback(() => {
    if (lastInputRef.current) {
      handleGenerate(lastInputRef.current)
    }
  }, [handleGenerate])

  const handleReset = () => {
    setResult(null)
    setError(null)
  }

  const handleTabChange = (type: ContentType) => {
    setActiveType(type)
    setResult(null)
    setError(null)
    lastInputRef.current = null
  }

  const activeContentType = contentTypes.find((ct) => ct.id === activeType)!

  return (
    <div className="space-y-6">
      {/* ─── Premium Header ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/40 border border-slate-800/60 p-6 md:p-8">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#1E6B3A]/8 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#A98B4F]/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="p-3 rounded-xl bg-gradient-to-br from-[#1E6B3A]/20 to-[#1E6B3A]/5 border border-[#1E6B3A]/25 shrink-0"
            >
              <Sparkles className="w-7 h-7 text-[#34D399]" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-2xl md:text-3xl font-bold text-white tracking-tight"
              >
                AI Content Studio
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-slate-400 mt-1 max-w-lg"
              >
                Generate marketing content, blog posts, and social media with AI
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 shrink-0"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
              <BarChart3 className="w-4 h-4 text-[#34D399]" />
              <div>
                <p className="text-white font-semibold text-sm">{contentCount}</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">Content generated</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
              <Zap className="w-4 h-4 text-[#A98B4F]" />
              <div>
                <p className="text-white font-semibold text-sm">5</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">Content types</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Content Type Tabs ─── */}
      <div className="admin-card p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {contentTypes.map((ct) => (
            <button
              key={ct.id}
              onClick={() => handleTabChange(ct.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeType === ct.id
                  ? 'text-[#34D399]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span className={activeType === ct.id ? 'text-[#34D399]' : 'text-slate-500'}>
                {ct.icon}
              </span>
              <span className="hidden sm:inline">{ct.label}</span>
              {activeType === ct.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#1E6B3A]"
                  style={{ boxShadow: '0 0 8px rgba(30, 107, 58, 0.5)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Active Tab Description ─── */}
      <AnimatePresence mode="wait">
        <motion.p
          key={activeType}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-slate-500 -mt-3"
        >
          {activeContentType.description}
        </motion.p>
      </AnimatePresence>

      {/* ─── Main Content Area ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Left: Form */}
        <div className="admin-card p-5 lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center gap-2 mb-5">
            <Send className="w-4 h-4 text-[#34D399]" />
            <h3 className="text-sm font-semibold text-white">Configure</h3>
          </div>

          <AnimatePresence mode="wait">
            {activeType === 'blog_post' && <BlogPostForm onGenerate={handleGenerate} />}
            {activeType === 'project_description' && <ProjectDescForm onGenerate={handleGenerate} />}
            {activeType === 'social_media' && <SocialMediaForm onGenerate={handleGenerate} />}
            {activeType === 'faq_answer' && <FaqForm onGenerate={handleGenerate} />}
            {activeType === 'email_campaign' && <EmailForm onGenerate={handleGenerate} />}
          </AnimatePresence>
        </div>

        {/* Right: Output */}
        <div className="space-y-4 min-w-0">
          {/* Loading State */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <PremiumShimmer />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="admin-card p-5 border-red-500/20"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generated Output */}
          <AnimatePresence>
            {!loading && result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="admin-card p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1E6B3A]/15 border border-[#1E6B3A]/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#34D399]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Generated Content</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{activeContentType.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={handleRegenerate}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#A98B4F] bg-[#A98B4F]/10 border border-[#A98B4F]/20 hover:bg-[#A98B4F]/15 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                    </motion.button>
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/50"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {activeType === 'blog_post' && <BlogPostOutput data={result as unknown as BlogResult} />}
                  {activeType === 'project_description' && <ProjectDescOutput data={result as unknown as ProjectDescResult} />}
                  {activeType === 'social_media' && <SocialMediaOutput data={result as unknown as SocialResult} />}
                  {activeType === 'faq_answer' && <FaqOutput data={result as unknown as FaqResult} />}
                  {activeType === 'email_campaign' && <EmailOutput data={result as unknown as EmailResult} />}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          <AnimatePresence>
            {!loading && !result && !error && <EmptyState />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}