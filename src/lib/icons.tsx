/**
 * Shared icon resolver — maps a stored icon-name string (as chosen in the
 * admin IconPicker) to a lucide component, usable on both server and client
 * render paths. Admin editors store `icon: "Trees"`; the frontend renders it
 * via <Icon name="Trees" />.
 */
import {
  Home, Building2, Building, MapPin, Phone, Mail, Globe, Globe2, Facebook, Instagram,
  Youtube, Linkedin, Twitter, MessageCircle, Star, Heart, HeartPulse, Shield, ShieldCheck,
  Award, Trophy, Users, User, UserCheck, BadgeCheck, Settings, Search, Filter,
  Check, CheckCircle, ArrowRight, Calendar, CalendarDays, Clock, Bell,
  Eye, Download, Upload, Zap, Target, TrendingUp, Layers, Grid, Map, MapIcon,
  Navigation, Compass, Truck, Car, Landmark, Warehouse, Factory, Trees, Mountain,
  Droplets, Wind, Flame, Sparkles, Gem, Crown, Medal, Gift, ShoppingBag, ShoppingCart,
  CreditCard, Wallet, Banknote, DollarSign, Percent, Calculator, Receipt, FileCheck,
  FileText, LayoutGrid, BookOpen, GraduationCap, School, Library, Stethoscope, Pill,
  Baby, Dog, Bird, Flower2, Leaf, Sprout, Coffee, KeyRound, Key, Lock, Footprints,
  Plane, Train, Bus, Ship, Anchor, Rocket, HardHat, Hammer, Wrench, Cog, Ruler,
  Handshake, ThumbsUp, PartyPopper, Waypoints, Route, Signpost, Bath, Fence, Fan,
  Snowflake, Sun, Wifi, HelpCircle, Info, Package, Boxes, Trees as Park,
} from 'lucide-react'
import { createElement } from 'react'
import type { LucideIcon } from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  Home, Building2, Building, MapPin, Phone, Mail, Globe, Globe2, Facebook, Instagram,
  Youtube, Linkedin, Twitter, MessageCircle, Star, Heart, HeartPulse, Shield, ShieldCheck,
  Award, Trophy, Users, User, UserCheck, BadgeCheck, Settings, Search, Filter,
  Check, CheckCircle, ArrowRight, Calendar, CalendarDays, Clock, Bell,
  Eye, Download, Upload, Zap, Target, TrendingUp, Layers, Grid, Map, MapIcon,
  Navigation, Compass, Truck, Car, Landmark, Warehouse, Factory, Trees, Mountain,
  Droplets, Wind, Flame, Sparkles, Gem, Crown, Medal, Gift, ShoppingBag, ShoppingCart,
  CreditCard, Wallet, Banknote, DollarSign, Percent, Calculator, Receipt, FileCheck,
  FileText, LayoutGrid, BookOpen, GraduationCap, School, Library, Stethoscope, Pill,
  Baby, Dog, Bird, Flower2, Leaf, Sprout, Coffee, KeyRound, Key, Lock, Footprints,
  // alias for the old registry name FootprintsIcon
  FootprintsIcon: Footprints,
  Plane, Train, Bus, Ship, Anchor, Rocket, HardHat, Hammer, Wrench, Cog, Ruler,
  Handshake, ThumbsUp, PartyPopper, Waypoints, Route, Signpost, Bath, Fence, Fan,
  Snowflake, Sun, Wifi, HelpCircle, Info, Package, Boxes, Park,
}

export function getIcon(name?: string | null): LucideIcon {
  if (name && ICONS[name]) return ICONS[name]
  return MapPin
}

/** Render an icon by its stored name. Falls back to MapPin for unknown names. */
export function Icon({ name, className }: { name?: string | null; className?: string }) {
  return createElement(getIcon(name), { className })
}
