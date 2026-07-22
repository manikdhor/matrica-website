'use client'

import * as React from 'react'
import {
  Home, Building2, MapPin, Phone, Mail, Globe, Facebook, Instagram,
  Youtube, Linkedin, Twitter, MessageCircle, Star, Heart, Shield,
  Award, Trophy, Users, User, UserCheck, Settings, Search, Filter,
  Plus, Minus, X, Check, ArrowRight, ArrowLeft, ChevronRight, ChevronDown,
  Menu, Image, Camera, Video, FileText, Calendar, Clock, Bell,
  Eye, EyeOff, Edit, Trash2, Download, Upload, Share2, Link,
  ExternalLink, Copy, Printer, Bookmark, Flag, Zap, Target,
  TrendingUp, BarChart3, PieChart, Activity, Layers, Grid, List,
  Layout, Maximize, Sun, Moon, Wifi, Lock, Unlock, Key,
  PhoneCall, MailOpen, Send, Paperclip, Hash, AtSign, Globe2,
  Map, Navigation, Compass, Truck, Car, Building, Landmark,
  DoorOpen, Warehouse, Factory, Trees, Mountain, Cloud,
  Umbrella, Thermometer, Droplets, Wind, Flame, Sparkles, Wand,
  Wand2, Gem, Crown, Medal, Gift, ShoppingBag, ShoppingCart,
  CreditCard, Wallet, Banknote, DollarSign, Percent, Calculator,
  Receipt, FileCheck, FilePlus, FolderOpen, Folder, Archive,
  Database, Server, Cpu, Code, Terminal, Smartphone, Tablet,
  Monitor, Laptop, Headphones, Speaker, Mic, Volume2,
  Play, Pause, SkipForward, Music, Radio, Tv, Film,
  CameraOff, ImagePlus, RotateCcw, RotateCw, RefreshCw, Repeat,
  Shuffle, Move, GripVertical, MoreHorizontal, MoreVertical, Ellipsis,
  CircleDot, Circle, Square, Triangle, Hexagon, Diamond,
  CheckCircle, XCircle, AlertCircle, AlertTriangle, Info, HelpCircle,
  Ban, ShieldCheck, ShieldAlert, Fingerprint, Scan, QrCode,
  LocateFixed, Pin, MapPinned, Route, Signpost, Waypoints,
  ClipboardList, ClipboardCheck, ListChecks, ListTodo, CalendarDays,
  CalendarRange, Timer, AlarmClock, Hourglass, History,
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Split, Columns3, Rows3, PanelLeft, PanelRight, SidebarOpen,
  Languages, BookOpen, GraduationCap, School, Library, PenTool,
  Palette, PaintBucket, Brush, Highlighter, Type, Underline,
  Bold, Italic, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, Indent, Outdent, Heading1, Heading2, Heading3,
  ListOrdered, Subscript, Superscript, Quote, Code2,
  Binary, Braces, Box, Package, PackageOpen, Boxes,
  Rocket, Plane, Train, Bus, Ship, Anchor,
  LifeBuoy, HardHat, Hammer, Wrench, Cog, Ruler,
  PencilRuler, DraftingCompass, Proportions, Scaling,
  Handshake, HandMetal, ThumbsUp, ThumbsDown, Clapperboard,
  PartyPopper, Baby, Dog, Cat, Bird, Fish,
  Flower2, Leaf, Clover, Sprout, Cherry,
  Apple, Pizza, Coffee, Wine, Beer, Cookie,
  Stethoscope, Pill, Syringe, HeartPulse, Bone, Brain,
  Accessibility, Armchair, Lamp, Sofa, Bath, DoorClosed,
  Fence, Fan, AirVent, Snowflake, SunMedium, Sunrise,
  Sunset, CloudRain, CloudSnow, CloudLightning, CloudFog,
  Earth, Satellite, Orbit, Palmtree,
  Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Building2, MapPin, Phone, Mail, Globe, Facebook, Instagram,
  Youtube, Linkedin, Twitter, MessageCircle, Star, Heart, Shield,
  Award, Trophy, Users, User, UserCheck, Settings, Search, Filter,
  Plus, Minus, X, Check, ArrowRight, ArrowLeft, ChevronRight, ChevronDown,
  Menu, Image, Camera, Video, FileText, Calendar, Clock, Bell,
  Eye, EyeOff, Edit, Trash2, Download, Upload, Share2, Link,
  ExternalLink, Copy, Printer, Bookmark, Flag, Zap, Target,
  TrendingUp, BarChart3, PieChart, Activity, Layers, Grid, List,
  Layout, Maximize, Sun, Moon, Wifi, Lock, Unlock, Key,
  PhoneCall, MailOpen, Send, Paperclip, Hash, AtSign, Globe2,
  Map, Navigation, Compass, Truck, Car, Building, Landmark,
  DoorOpen, Warehouse, Factory, Trees, Mountain, Cloud,
  Umbrella, Thermometer, Droplets, Wind, Flame, Sparkles, Wand,
  Wand2, Gem, Crown, Medal, Gift, ShoppingBag, ShoppingCart,
  CreditCard, Wallet, Banknote, DollarSign, Percent, Calculator,
  Receipt, FileCheck, FilePlus, FolderOpen, Folder, Archive,
  Database, Server, Cpu, Code, Terminal, Smartphone, Tablet,
  Monitor, Laptop, Headphones, Speaker, Mic, Volume2,
  Play, Pause, SkipForward, Music, Radio, Tv, Film,
  CameraOff, ImagePlus, RotateCcw, RotateCw, RefreshCw, Repeat,
  Shuffle, Move, GripVertical, MoreHorizontal, MoreVertical, Ellipsis,
  CircleDot, Circle, Square, Triangle, Hexagon, Diamond,
  CheckCircle, XCircle, AlertCircle, AlertTriangle, Info, HelpCircle,
  Ban, ShieldCheck, ShieldAlert, Fingerprint, Scan, QrCode,
  LocateFixed, Pin, MapPinned, Route, Signpost, Waypoints,
  ClipboardList, ClipboardCheck, ListChecks, ListTodo, CalendarDays,
  CalendarRange, Timer, AlarmClock, Hourglass, History,
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Split, Columns3, Rows3, PanelLeft, PanelRight, SidebarOpen,
  Languages, BookOpen, GraduationCap, School, Library, PenTool,
  Palette, PaintBucket, Brush, Highlighter, Type, Underline,
  Bold, Italic, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, Indent, Outdent, Heading1, Heading2, Heading3,
  ListOrdered, Subscript, Superscript, Quote, Code2,
  Binary, Braces, Box, Package, PackageOpen, Boxes,
  Rocket, Plane, Train, Bus, Ship, Anchor,
  LifeBuoy, HardHat, Hammer, Wrench, Cog, Ruler,
  PencilRuler, DraftingCompass, Proportions, Scaling,
  Handshake, HandMetal, ThumbsUp, ThumbsDown, Clapperboard,
  PartyPopper, Baby, Dog, Cat, Bird, Fish,
  Flower2, Leaf, Clover, Sprout, Cherry,
  Apple, Pizza, Coffee, Wine, Beer, Cookie,
  Stethoscope, Pill, Syringe, HeartPulse, Bone, Brain,
  Accessibility, Armchair, Lamp, Sofa, Bath, DoorClosed,
  Fence, Fan, AirVent, Snowflake, SunMedium, Sunrise,
  Sunset, CloudRain, CloudSnow, CloudLightning, CloudFog,
  Earth, Satellite, Orbit, Palmtree,
}

// ─── Icon name lists ───────────────────────────────────────────────
const ALL_ICON_NAMES = [
  'Home', 'Building2', 'MapPin', 'Phone', 'Mail', 'Globe', 'Facebook', 'Instagram',
  'Youtube', 'Linkedin', 'Twitter', 'MessageCircle', 'Star', 'Heart', 'Shield',
  'Award', 'Trophy', 'Users', 'User', 'UserCheck', 'Settings', 'Search', 'Filter',
  'Plus', 'Minus', 'X', 'Check', 'ArrowRight', 'ArrowLeft', 'ChevronRight', 'ChevronDown',
  'Menu', 'Image', 'Camera', 'Video', 'FileText', 'Calendar', 'Clock', 'Bell',
  'Eye', 'EyeOff', 'Edit', 'Trash2', 'Download', 'Upload', 'Share2', 'Link',
  'ExternalLink', 'Copy', 'Printer', 'Bookmark', 'Flag', 'Zap', 'Target',
  'TrendingUp', 'BarChart3', 'PieChart', 'Activity', 'Layers', 'Grid', 'List',
  'Layout', 'Maximize', 'Sun', 'Moon', 'Wifi', 'Lock', 'Unlock', 'Key',
  'PhoneCall', 'MailOpen', 'Send', 'Paperclip', 'Hash', 'AtSign', 'Globe2',
  'Map', 'Navigation', 'Compass', 'Truck', 'Car', 'Building', 'Landmark',
  'DoorOpen', 'Warehouse', 'Factory', 'Trees', 'Mountain', 'Cloud',
  'Umbrella', 'Thermometer', 'Droplets', 'Wind', 'Flame', 'Sparkles', 'Wand',
  'Wand2', 'Gem', 'Crown', 'Medal', 'Gift', 'ShoppingBag', 'ShoppingCart',
  'CreditCard', 'Wallet', 'Banknote', 'DollarSign', 'Percent', 'Calculator',
  'Receipt', 'FileCheck', 'FilePlus', 'FolderOpen', 'Folder', 'Archive',
  'Database', 'Server', 'Cpu', 'Code', 'Terminal', 'Smartphone', 'Tablet',
  'Monitor', 'Laptop', 'Headphones', 'Speaker', 'Mic', 'Volume2',
  'Play', 'Pause', 'SkipForward', 'Music', 'Radio', 'Tv', 'Film',
  'CameraOff', 'ImagePlus', 'RotateCcw', 'RotateCw', 'RefreshCw', 'Repeat',
  'Shuffle', 'Move', 'GripVertical', 'MoreHorizontal', 'MoreVertical', 'Ellipsis',
  'CircleDot', 'Circle', 'Square', 'Triangle', 'Hexagon', 'Diamond',
  'CheckCircle', 'XCircle', 'AlertCircle', 'AlertTriangle', 'Info', 'HelpCircle',
  'Ban', 'ShieldCheck', 'ShieldAlert', 'Fingerprint', 'Scan', 'QrCode',
  'LocateFixed', 'Pin', 'MapPinned', 'Route', 'Signpost', 'Waypoints',
  'ClipboardList', 'ClipboardCheck', 'ListChecks', 'ListTodo', 'CalendarDays',
  'CalendarRange', 'Timer', 'AlarmClock', 'Hourglass', 'History',
  'Undo2', 'Redo2', 'ZoomIn', 'ZoomOut', 'Maximize2', 'Minimize2',
  'Split', 'Columns3', 'Rows3', 'PanelLeft', 'PanelRight', 'SidebarOpen',
  'Languages', 'BookOpen', 'GraduationCap', 'School', 'Library', 'PenTool',
  'Palette', 'PaintBucket', 'Brush', 'Highlighter', 'Type', 'Underline',
  'Bold', 'Italic', 'Strikethrough', 'AlignLeft', 'AlignCenter', 'AlignRight',
  'AlignJustify', 'Indent', 'Outdent', 'Heading1', 'Heading2', 'Heading3',
  'ListOrdered', 'Subscript', 'Superscript', 'Quote', 'Code2',
  'Binary', 'Braces', 'Box', 'Package', 'PackageOpen', 'Boxes',
  'Rocket', 'Plane', 'Train', 'Bus', 'Ship', 'Anchor',
  'LifeBuoy', 'HardHat', 'Hammer', 'Wrench', 'Cog', 'Ruler',
  'PencilRuler', 'DraftingCompass', 'Proportions', 'Scaling',
  'Handshake', 'HandMetal', 'ThumbsUp', 'ThumbsDown', 'Clapperboard',
  'PartyPopper', 'Baby', 'Dog', 'Cat', 'Bird', 'Fish',
  'Flower2', 'Leaf', 'Clover', 'Sprout', 'Cherry',
  'Apple', 'Pizza', 'Coffee', 'Wine', 'Beer', 'Cookie',
  'Stethoscope', 'Pill', 'Syringe', 'HeartPulse', 'Bone', 'Brain',
  'Accessibility', 'Armchair', 'Lamp', 'Sofa', 'Bath', 'DoorClosed',
  'Fence', 'Fan', 'AirVent', 'Snowflake', 'SunMedium', 'Sunrise',
  'Sunset', 'CloudRain', 'CloudSnow', 'CloudLightning', 'CloudFog',
  'Earth', 'Satellite', 'Orbit', 'Palmtree',
]

const UNIQUE_ICONS = [...new Set(ALL_ICON_NAMES)]

// ─── Category definitions ──────────────────────────────────────────
const POPULAR_ICONS = [
  'Home', 'Building2', 'MapPin', 'Phone', 'Mail', 'Globe',
  'Star', 'Heart', 'Users', 'Settings', 'Search', 'Plus',
  'Check', 'X', 'Edit', 'Trash2', 'Eye', 'Bell',
  'Calendar', 'Clock', 'Shield', 'Award', 'TrendingUp', 'BarChart3',
  'MessageCircle', 'Share2', 'Download', 'Upload', 'Link', 'Bookmark',
  'Facebook', 'Instagram', 'Youtube', 'Linkedin', 'Twitter', 'Send',
  'ArrowRight', 'ChevronRight', 'ChevronDown', 'Menu', 'FileText', 'Image',
]

const BUSINESS_ICONS = [
  'TrendingUp', 'BarChart3', 'PieChart', 'Activity', 'DollarSign', 'CreditCard',
  'Wallet', 'Banknote', 'Receipt', 'Calculator', 'Percent',
  'Building', 'Building2', 'Landmark', 'Handshake', 'Award', 'Trophy',
  'Target', 'Zap', 'Rocket', 'Users', 'UserCheck', 'ClipboardList',
  'ClipboardCheck', 'ListChecks', 'ListTodo', 'FileCheck', 'FilePlus',
  'FolderOpen', 'Database', 'Server', 'Shield', 'ShieldCheck', 'Key',
  'Lock', 'Unlock', 'Gem', 'Crown', 'Medal', 'Star',
]

const MEDIA_ICONS = [
  'Image', 'Camera', 'Video', 'Film', 'Tv', 'Music',
  'Play', 'Pause', 'SkipForward', 'Radio', 'Headphones', 'Speaker',
  'Mic', 'Volume2', 'CameraOff', 'ImagePlus', 'Clapperboard',
  'Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Projector',
  'Image', 'Video', 'GalleryHorizontal', 'MonitorPlay', 'MonitorSpeaker',
  'Film', 'Sparkles', 'Wand', 'Wand2', 'SunMedium', 'Sunrise',
  'Sunset', 'Camera', 'CameraOff', 'ImagePlus', 'Film', 'Video',
]

const COMMUNICATION_ICONS = [
  'Phone', 'PhoneCall', 'Mail', 'MailOpen', 'Send', 'MessageCircle',
  'MessageSquare', 'Inbox', 'Paperclip', 'AtSign', 'Hash', 'Globe', 'Globe2',
  'Facebook', 'Instagram', 'Youtube', 'Linkedin', 'Twitter',
  'Share2', 'ExternalLink', 'Link', 'Rss', 'Bluetooth', 'Wifi',
  'Phone', 'PhoneCall', 'PhoneIncoming', 'PhoneOff',
  'Video', 'Camera', 'Mic',
  'Megaphone', 'Bell', 'BellRing', 'BellOff',
  'Mail', 'MailOpen', 'Send', 'Satellite', 'Signal',
]

const NAVIGATION_ICONS = [
  'MapPin', 'Map', 'MapPinned', 'Navigation', 'Compass',
  'LocateFixed', 'Pin', 'Route', 'Signpost', 'Waypoints',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
  'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown',
  'Move', 'CornerDownRight', 'CornerUpRight',
  'Home', 'DoorOpen', 'DoorClosed', 'Building', 'Building2',
  'Warehouse', 'Factory', 'Truck', 'Car', 'Bus', 'Train', 'Plane', 'Ship', 'Anchor',
  'Crosshair', 'Target',
  'Split', 'PanelLeft', 'PanelRight', 'SidebarOpen',
  'Menu', 'List', 'Layout', 'Grid', 'Layers',
]

// Build category map (exclude icons not in UNIQUE_ICONS)
function filterToValid(names: string[]): string[] {
  return [...new Set(names.filter(n => UNIQUE_ICONS.includes(n)))]
}

const CATEGORIES: Record<string, string[]> = {
  Popular: filterToValid(POPULAR_ICONS),
  Business: filterToValid(BUSINESS_ICONS),
  Media: filterToValid(MEDIA_ICONS),
  Communication: filterToValid(COMMUNICATION_ICONS),
  Navigation: filterToValid(NAVIGATION_ICONS),
  All: UNIQUE_ICONS,
}

// ─── Icon Display helper ──────────────────────────────────────────
function IconDisplay({ name, className }: { name: string; className?: string }) {
  const IconComponent = ICON_MAP[name]
  if (!IconComponent) return <span className="text-xs text-slate-500">{name}</span>
  return <IconComponent className={className || 'w-5 h-5'} />
}

// ─── Icon Grid sub-component ──────────────────────────────────────
function IconGrid({
  icons,
  selectedName,
  onSelect,
}: {
  icons: string[]
  selectedName: string
  onSelect: (name: string) => void
}) {
  return (
    <ScrollArea className="max-h-[320px]">
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-0.5 pb-2">
        {icons.map((iconName) => {
          const isSelected = selectedName === iconName
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onSelect(iconName)}
              title={iconName}
              className={`
                p-2 rounded-lg cursor-pointer flex flex-col items-center gap-1.5
                transition-all duration-150 group relative
                ${isSelected
                  ? 'border border-[#34D399] bg-[#1E6B3A]/20 ring-1 ring-[#34D399]/30'
                  : 'hover:bg-slate-800 border border-transparent hover:border-slate-700/50'
                }
              `}
            >
              <span className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${isSelected ? 'text-[#34D399]' : 'text-slate-400 group-hover:text-white'}`}>
                <IconDisplay name={iconName} className="w-4 h-4" />
              </span>
              <span className={`text-[9px] leading-tight truncate w-full text-center transition-colors ${isSelected ? 'text-[#34D399]' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {iconName}
              </span>
              {isSelected && (
                <Check className="absolute top-1 right-1 w-3 h-3 text-[#34D399]" />
              )}
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

// ─── Props ─────────────────────────────────────────────────────────
interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
  label?: string
}

// ─── Component ─────────────────────────────────────────────────────
export default function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('Popular')
  const [loaded, setLoaded] = React.useState(false)
  const searchRef = React.useRef<HTMLInputElement>(null)

  // Brief loading state for icons
  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 150)
    return () => clearTimeout(timer)
  }, [])

  // Focus search when popover opens, reset on close
  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
    setSearch('')
    setActiveTab('Popular')
  }, [open])

  // Filter icons by search query
  const getFilteredIcons = React.useCallback(
    (icons: string[]) => {
      if (!search.trim()) return icons
      const q = search.toLowerCase().trim()
      return icons.filter(name => name.toLowerCase().includes(q))
    },
    [search]
  )

  // The currently effective tab (search overrides to "All")
  const effectiveTab = search ? 'All' : activeTab
  const currentIcons = CATEGORIES[effectiveTab] ?? UNIQUE_ICONS
  const filteredIcons = getFilteredIcons(currentIcons)

  const handleSelect = (iconName: string) => {
    onChange(iconName)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const iconCount = filteredIcons.length

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="admin-input flex items-center gap-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white shadow-sm transition-colors hover:bg-slate-800 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#34D399]/30 focus:border-[#34D399]/50"
          >
            {value ? (
              <>
                <span className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-800 border border-slate-700">
                  <IconDisplay name={value} className="w-4 h-4 text-[#34D399]" />
                </span>
                <span className="flex-1 text-left text-slate-300 truncate text-xs">
                  {value}
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-800/50 border border-dashed border-slate-600">
                  <Sparkles className="w-4 h-4 text-slate-500" />
                </span>
                <span className="flex-1 text-left text-slate-500 text-sm">
                  Pick an icon...
                </span>
              </>
            )}
            <div className="flex items-center gap-1">
              {value && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(e as unknown as React.MouseEvent) }}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="Clear icon"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <span className="p-1 rounded text-slate-400">
                <svg
                  className="w-4 h-4 transition-transform duration-200"
                  style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[420px] sm:w-[520px] p-0 rounded-xl border-slate-700 bg-slate-900 shadow-2xl"
          align="start"
          sideOffset={8}
        >
          {/* Header with search */}
          <div className="p-3 border-b border-slate-700/70">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="admin-input w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-8 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#34D399]/30 focus:border-[#34D399]/50 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category tabs */}
          <div className="px-3 pt-2">
            <Tabs value={effectiveTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-950/60 border border-slate-800 rounded-lg h-8 w-full p-0.5">
                {Object.keys(CATEGORIES).map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    disabled={!!search}
                    className="text-xs px-2 py-1 rounded-md data-[state=active]:bg-slate-800 data-[state=active]:text-[#34D399] data-[state=active]:shadow-none text-slate-400 hover:text-slate-200 transition-colors flex-1 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(CATEGORIES).map(([cat]) => (
                <TabsContent key={cat} value={cat} className="mt-2">
                  {!loaded ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-6 h-6 text-[#34D399] animate-spin" />
                      <span className="text-sm text-slate-500">Loading icons...</span>
                    </div>
                  ) : iconCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <Search className="w-8 h-8 text-slate-600" />
                      <span className="text-sm text-slate-500">
                        No icons found for &ldquo;{search}&rdquo;
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="text-xs text-[#34D399] hover:underline mt-1"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <IconGrid
                      icons={filteredIcons}
                      selectedName={value}
                      onSelect={handleSelect}
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-700/70 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {iconCount} icon{iconCount !== 1 ? 's' : ''}
            </span>
            <span className="text-[11px] text-slate-600">
              Powered by Lucide
            </span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}