/**
 * Seed the database with the content the public frontend currently ships
 * as hardcoded fallbacks, so every admin module shows the live site's data.
 *
 * Idempotent: existing rows (matched by slug / unique key / exact title)
 * are left alone — safe to re-run.
 *
 * Run: node scripts/seed-frontend-data.mjs
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── Hero slides (src/components/HeroSection.tsx) ───────────────────────
const HERO_SLIDES = [
  '/images/hero-slide-1.webp',
  '/images/hero-slide-2.webp',
  '/images/hero-slide-3.webp',
].map((img, i) => ({
  title: 'Transforming land into landmarks',
  subtitle: null,
  description:
    'RAJUK-approved residential plots across 500+ bigha in Purbachal — planned with the patience a permanent address deserves.',
  imageUrl: img,
  backgroundImage: img,
  label: 'Purbachal · Dhaka',
  cta1Text: 'Explore Projects',
  cta1Href: '/projects',
  cta2Text: 'Book a Site Visit',
  cta2Href: '/site-visit',
  enabled: true,
  status: 'active',
  sortOrder: i,
}))

// ─── FAQs (src/components/FAQSection.tsx) ────────────────────────────────
const FAQS = [
  ['Is Matrica RAJUK approved?', 'Yes, all our projects including Chandra Chaya and Ventura City are fully approved by RAJUK. You will receive all legal documents including RAJUK approval, mutation papers, and registered deeds.'],
  ['What plot sizes are available?', 'We offer residential plots in 3 Katha, 5 Katha, and 10 Katha sizes across both our projects. Custom combinations are also available for larger requirements.'],
  ['Do you offer installment payment plans?', 'Absolutely! We offer flexible EMI plans with 0% interest for up to 36 months. You can also choose from our down payment options starting from just 20% of the total price.'],
  ['How do I book a site visit?', 'You can book a free site visit through our website, by calling us, or via WhatsApp. We provide complimentary pickup from our Gulshan-2 office. No obligation, no pressure.'],
  ['What is the current status of development?', 'Both Chandra Chaya (500 Bigha) and Ventura City are ongoing projects with active development. Road construction, utility connections, and landscaping are progressing on schedule.'],
  ["Is Purbachal a good investment?", "Purbachal is Dhaka's largest planned residential area with government investment in infrastructure including the Purbachal Expressway, water treatment plant, and central park. Property values have appreciated 200-300% over the last decade."],
].map(([question, answer], i) => ({ question, answer, category: 'general', sortOrder: i, enabled: true, status: 'active' }))

// ─── Projects (src/lib/projects-data.tsx) — full deep content ─────────────
const DOCS = (slug) => [
  { docType: 'layout-plan', label: 'Layout Plan', fileUrl: `/docs/${slug}/layout-plan.pdf` },
  { docType: 'location-map', label: 'Location Map', fileUrl: `/docs/${slug}/location-map.pdf` },
  { docType: 'brochure', label: 'Project Brochure', fileUrl: `/docs/${slug}/brochure.pdf` },
]

const PROJECTS = [
  {
    name: 'Chandra Chaya',
    slug: 'chandra-chaya',
    status: 'ongoing',
    publishStatus: 'published',
    tagline: 'A 500-bigha master-planned community beside Zinda Park — planned around green corridors and generous roads.',
    summary: '500 Bigha Area · 3, 5 & 10 Katha Plots · 60\', 30\', 25\' Roads',
    description: 'Chandra Chaya is a flagship 500-bigha residential land development beside Zinda Park, adjacent to Sector 21 of the Purbachal RAJUK project and the Asian Highway. Plots come in 3, 5, and 10 katha, served by a road network of 25, 30, and 60 feet. Every plot is RAJUK-approved, with documentation you can verify before committing a single taka.',
    heroImage: '/images/project-chandrachaya.webp',
    cardImage: '/images/project-chandrachaya.webp',
    logo: '/images/chandra-chaya-logo.webp',
    mapImage: '/images/maps/chandra-chaya-location-map.webp',
    mapsQuery: 'Zinda Park Purbachal Dhaka',
    locationArea: 'Next to Zinda Park, Adjacent to Sector 21, Purbachal',
    address: 'Next to Zinda Park, Adjacent to Sector 21, Purbachal, Dhaka',
    plotSizes: '3 · 5 · 10 Katha',
    cardHighlights: JSON.stringify(['500 Bigha Area', '3, 5 & 10 Katha Plots', "60', 30', 25' Roads"]),
    featured: true,
    sortOrder: 0,
    highlights: [
      { title: 'Beside Zinda Park', detail: '150 acres of parkland as your permanent neighbour.' },
      { title: 'On the Asian Highway', detail: 'direct arterial access — no feeder-road dependency.' },
      { title: 'Adjacent to RAJUK Sector 21', detail: 'inside the planned growth path of Purbachal New Town.' },
      { title: 'Green corridors by design', detail: 'parks, water bodies, and walking tracks in the master plan.' },
    ],
    specs: [
      { label: 'Total Area', value: '500 Bigha' },
      { label: 'Plot Sizes', value: '3 · 5 · 10 Katha' },
      { label: 'Roads', value: "25' · 30' · 60'" },
      { label: 'Approval', value: 'RAJUK' },
    ],
    stages: [
      { label: 'RAJUK approval', stage: 'Complete' },
      { label: 'Land development', stage: 'Underway' },
      { label: 'Road network', stage: 'Underway' },
      { label: 'Utility infrastructure', stage: 'Planned' },
    ],
    amenities: [
      { icon: 'Trees', label: 'Parks & Green Spaces' },
      { icon: 'Landmark', label: 'Mosque' },
      { icon: 'GraduationCap', label: 'Educational Institutions' },
      { icon: 'Heart', label: 'Healthcare Facilities' },
      { icon: 'ShoppingBag', label: 'Commercial Zone' },
      { icon: 'Footprints', label: 'Walking & Jogging Tracks' },
      { icon: 'Droplets', label: 'Water Bodies' },
      { icon: 'Crown', label: 'Community Center' },
      { icon: 'Baby', label: "Children's Playground" },
      { icon: 'Eye', label: 'CCTV Surveillance' },
    ],
    distances: [
      { place: 'Zinda Park', value: 'Adjacent' },
      { place: 'Asian Highway', value: 'On the highway' },
      { place: 'Purbachal Sector 21', value: 'Adjacent' },
      { place: '300-ft Purbachal Expressway', value: '~10 min' },
      { place: 'Hazrat Shahjalal Airport', value: '~12 km' },
      { place: 'Gulshan-2', value: '~15 km' },
    ],
    landmarks: [
      { icon: 'Trees', name: 'Zinda Park', minutes: 2, angle: 210, ring: 0 },
      { icon: 'ShoppingBag', name: 'Jamuna Future Park', minutes: 10, angle: 150, ring: 1 },
      { icon: 'GraduationCap', name: "American Int'l School", minutes: 15, angle: 60, ring: 1 },
      { icon: 'Droplets', name: 'Purbachal Central Park', minutes: 12, angle: 250, ring: 1 },
      { icon: 'Stethoscope', name: 'Evercare Hospital', minutes: 20, angle: 20, ring: 2 },
      { icon: 'Plane', name: "Shahjalal Int'l Airport", minutes: 25, angle: 120, ring: 2 },
      { icon: 'Building2', name: 'Dhaka City Center', minutes: 25, angle: 200, ring: 2 },
      { icon: 'Landmark', name: 'Kanchan Bridge', minutes: 8, angle: 320, ring: 1 },
    ],
    faqs: [
      { question: 'Is every plot RAJUK-approved?', answer: 'Yes. The full 500 bigha carries RAJUK approval, and we hand you the papers — approval, mutation, registered deed — for independent verification before any payment.' },
      { question: 'What plot sizes are available?', answer: '3, 5, and 10 katha. Corner and park-facing plots are limited; visit early for first pick.' },
      { question: 'Can I pay in installments?', answer: 'Yes — structured installment plans are available against a written payment schedule. Every payment is receipted.' },
      { question: 'How do I visit the site?', answer: 'Book a free guided visit — we pick you up from our Gulshan-2 office, walk the land with you, and there is no obligation afterwards.' },
    ],
    images: [
      { url: '/images/project-chandrachaya.webp', sortOrder: 0 },
      { url: '/images/project-ventura.webp', sortOrder: 1 },
    ],
    documents: DOCS('chandra-chaya'),
  },
  {
    name: 'Ventura City',
    slug: 'ventura-city',
    status: 'ongoing',
    publishStatus: 'published',
    tagline: 'Where modern living begins — 300+ RAJUK-approved plots with wide internal roads in the heart of Purbachal.',
    summary: '300+ Plots · 3, 5 & 10 Katha Plots · 40\' · 60\' Roads',
    description: 'Ventura City is a residential land development of over 100 bigha in central Purbachal, planned on modern urban principles: 40- and 60-foot internal roads, dedicated green space, and full utility infrastructure. All plots are RAJUK-approved with clear, verifiable documentation.',
    heroImage: '/images/project-ventura.webp',
    cardImage: '/images/project-ventura.webp',
    logo: '/images/ventura-city-logo.webp',
    mapImage: '/images/maps/ventura-city-location-map.webp',
    mapsQuery: 'Purbachal New Town Dhaka',
    locationArea: 'Purbachal, Dhaka',
    address: 'Purbachal, Dhaka',
    plotSizes: '3 · 5 · 10 Katha',
    cardHighlights: JSON.stringify(['300+ Plots', '3, 5 & 10 Katha Plots', "40' · 60' Roads"]),
    totalPlots: 300,
    featured: true,
    sortOrder: 1,
    highlights: [
      { title: 'Central Purbachal', detail: "in the heart of Dhaka's planned eastward expansion." },
      { title: 'Wide internal roads', detail: '40 and 60 feet — planned for the neighbourhood it will become.' },
      { title: 'Full utilities planned', detail: 'electricity, water, and gas lines in the master plan.' },
      { title: 'Gated community', detail: 'controlled entry with round-the-clock security planned.' },
    ],
    specs: [
      { label: 'Total Area', value: '100+ Bigha' },
      { label: 'Plots', value: '300+' },
      { label: 'Roads', value: "40' · 60'" },
      { label: 'Approval', value: 'RAJUK' },
    ],
    stages: [
      { label: 'RAJUK approval', stage: 'Complete' },
      { label: 'Land development', stage: 'Underway' },
      { label: 'Road network', stage: 'Underway' },
      { label: 'Utility infrastructure', stage: 'Planned' },
    ],
    amenities: [
      { icon: 'Trees', label: 'Parks & Gardens' },
      { icon: 'Landmark', label: 'Mosque' },
      { icon: 'GraduationCap', label: 'School' },
      { icon: 'Heart', label: 'Hospital' },
      { icon: 'ShoppingBag', label: 'Shopping Center' },
      { icon: 'Footprints', label: 'Jogging Track' },
      { icon: 'Droplets', label: 'Lake' },
      { icon: 'Crown', label: 'Club House' },
      { icon: 'Baby', label: 'Playground' },
      { icon: 'Eye', label: 'CCTV Security' },
    ],
    distances: [
      { place: '300-ft Purbachal Expressway', value: '~5 min' },
      { place: 'Kanchan Bridge', value: '~10 min' },
      { place: 'Hazrat Shahjalal Airport', value: '~12 km' },
      { place: 'Bashundhara R/A', value: '~8 km' },
      { place: 'Gulshan-2', value: '~15 km' },
    ],
    landmarks: [
      { icon: 'MapPin', name: '300-ft Expressway', minutes: 5, angle: 230, ring: 0 },
      { icon: 'Landmark', name: 'Kanchan Bridge', minutes: 10, angle: 320, ring: 1 },
      { icon: 'ShoppingBag', name: 'Jamuna Future Park', minutes: 12, angle: 150, ring: 1 },
      { icon: 'GraduationCap', name: "American Int'l School", minutes: 15, angle: 60, ring: 1 },
      { icon: 'Building2', name: 'Bashundhara R/A', minutes: 18, angle: 200, ring: 2 },
      { icon: 'Stethoscope', name: 'Evercare Hospital', minutes: 20, angle: 20, ring: 2 },
      { icon: 'Plane', name: "Shahjalal Int'l Airport", minutes: 25, angle: 120, ring: 2 },
      { icon: 'Trees', name: 'Purbachal Central Park', minutes: 8, angle: 260, ring: 1 },
    ],
    faqs: [
      { question: 'Is every plot RAJUK-approved?', answer: 'Yes. All plots carry RAJUK approval, and the documentation is yours to verify independently before any payment.' },
      { question: 'What plot sizes are available?', answer: '3, 5, and 10 katha, including a limited number of corner plots.' },
      { question: 'Can I pay in installments?', answer: 'Yes — structured installment plans are available against a written payment schedule. Every payment is receipted.' },
      { question: 'How do I visit the site?', answer: 'Book a free guided visit — we pick you up from our Gulshan-2 office, walk the land with you, and there is no obligation afterwards.' },
    ],
    images: [
      { url: '/images/project-ventura.webp', sortOrder: 0 },
      { url: '/images/project-chandrachaya.webp', sortOrder: 1 },
    ],
    documents: DOCS('ventura-city'),
  },
]

// ─── Payment plans (src/components/PaymentPlans.tsx) ─────────────────────
const PAYMENT_PLANS = [
  { name: 'Starter Plot', startingPrice: '৳12 Lakh', size: '3 Katha', badge: null, popular: false, sortOrder: 0,
    features: JSON.stringify(['3 Katha residential plot', '20% down payment', '36-month 0% EMI', 'RAJUK-approved documents', 'Free registration support']) },
  { name: 'Standard Plot', startingPrice: '৳15 Lakh', size: '5 Katha', badge: 'Most Popular', popular: true, sortOrder: 1,
    features: JSON.stringify(['5 Katha residential plot', '20% down payment', '36-month 0% EMI', 'RAJUK-approved documents', 'Free registration support', 'Priority plot selection']) },
  { name: 'Premium Plot', startingPrice: '৳45 Lakh', size: '10 Katha', badge: null, popular: false, sortOrder: 2,
    features: JSON.stringify(['10 Katha residential plot', '20% down payment', '36-month 0% EMI', 'RAJUK-approved documents', 'Free registration support', 'Corner / park-facing priority']) },
]

// ─── Header/footer/mobile menu ───────────────────────────────────────────
const MOBILE_MENU = [
  { label: 'Home', href: '/', icon: 'Home', location: 'mobile', sortOrder: 0 },
  { label: 'Projects', href: '/projects', icon: 'Building2', location: 'mobile', sortOrder: 1 },
  { label: 'Book Visit', href: '/site-visit', icon: 'Calendar', location: 'mobile', sortOrder: 2 },
  { label: 'Gallery', href: '/gallery', icon: 'Grid', location: 'mobile', sortOrder: 3 },
  { label: 'Contact', href: '/contact', icon: 'Phone', location: 'mobile', sortOrder: 4 },
]

// ─── Blog teasers (src/components/LatestBlogPosts.tsx) ───────────────────
// Seeded as DRAFTS: the public blog article pages have rich hardcoded
// fallback articles; publishing thin excerpt-only posts would replace them
// with worse content. Admin can flesh these out and publish.
const BLOG_POSTS = [
  {
    title: "Why Purbachal is Dhaka's Best Investment Destination in 2025",
    slug: 'why-purbachal-best-investment-2025',
    excerpt: 'Discover why thousands of families are choosing Purbachal for their dream home. From infrastructure growth to property appreciation, we break down the numbers.',
    category: 'Investment Guide',
    featuredImage: '/images/project-chandrachaya.webp',
    publishedAt: new Date('2025-01-15'),
  },
  {
    title: 'Complete Guide to Buying a Residential Plot in Bangladesh',
    slug: 'complete-guide-buying-land-bangladesh',
    excerpt: 'From RAJUK approval to registration — everything you need to know before investing in a residential plot. Avoid common mistakes with our expert tips.',
    category: "Buyer's Guide",
    featuredImage: '/images/project-ventura.webp',
    publishedAt: new Date('2024-12-28'),
  },
  {
    title: 'RAJUK Approval Process: A Complete Guide for Buyers in Bangladesh',
    slug: 'rajuk-approval-process-guide',
    excerpt: 'Understanding RAJUK approval is crucial when buying property in Dhaka. Our step-by-step guide covers everything from layout plan verification to final approval.',
    category: "Buyer's Guide",
    featuredImage: '/images/project-chandrachaya.webp',
    publishedAt: new Date('2024-12-10'),
  },
].map((p) => ({ ...p, status: 'draft', authorName: 'Matrica Team', content: `<p>${p.excerpt}</p>` }))

// ─── Team (src/components/AboutPage.tsx) ─────────────────────────────────
const TEAM = [
  {
    name: 'Md. Abul Kalam Azad',
    designation: 'Chairman',
    category: 'management',
    isLeadership: true,
    bio: 'Land is the one purchase a family makes with its whole heart. We refuse to treat it as anything less.',
    message: [
      'I have watched too many families in this country hand over their life savings against a promise written in the air — a plot with unclear papers, a road that never arrives, a handover date that moves every year. MATRICA was founded on a simple refusal: we will not be that company.',
      'We are new, and I consider that our greatest discipline. A new company has no old reputation to hide behind. Every deed we register, every road we build, every date we keep — or miss — will be public record. That pressure is exactly what a buyer deserves from us.',
      'My commitment to you is plain: papers you can verify before you pay, infrastructure you can walk on before handover, and a company that answers its phone after the sale. Judge us on the record we are writing now.',
    ].join('\n\n'),
    sortOrder: 0,
  },
  {
    name: 'Engr. Selim Reza',
    designation: 'Managing Director',
    category: 'management',
    isLeadership: true,
    bio: 'Approvals first. Infrastructure first. Sales last. That order is the whole company.',
    message: [
      'Most land projects in Bangladesh sell first and solve later. We inverted the sequence. Before the first plot of Chandra Chaya or Ventura City was offered to anyone, the RAJUK approvals were secured and the master plan was fixed — road widths, drainage, green corridors, all of it.',
      'As an engineer, I hold the development to the same standard I would demand for my own family’s plot: 25 to 60 foot roads built to specification, utilities laid before handover, and a delivery ledger we update as work proceeds — not a brochure promise.',
      'When you visit the site, bring your own surveyor, your own lawyer, your own questions. A project done right has nothing to fear from scrutiny. That is the standard, and it does not bend.',
    ].join('\n\n'),
    sortOrder: 1,
  },
  { name: 'Ms. Nadia Rahman', designation: 'Director', category: 'management', isLeadership: false, sortOrder: 2 },
  { name: 'Md. Kamal Hossain', designation: 'Head of Operations', category: 'management', isLeadership: false, sortOrder: 3 },
]

// ─── Gallery (project imagery) ───────────────────────────────────────────
const GALLERY = [
  {
    name: 'Chandra Chaya', slug: 'chandra-chaya', cover: '/images/project-chandrachaya.webp', sortOrder: 0,
    items: [
      { title: 'Chandra Chaya', caption: 'Master-planned community beside Zinda Park', fileUrl: '/images/project-chandrachaya.webp', sortOrder: 0 },
      { title: 'Green corridors', caption: 'Parks and water bodies in the master plan', fileUrl: '/images/project-ventura.webp', sortOrder: 1 },
    ],
  },
  {
    name: 'Ventura City', slug: 'ventura-city', cover: '/images/project-ventura.webp', sortOrder: 1,
    items: [
      { title: 'Ventura City', caption: 'Wide internal roads in central Purbachal', fileUrl: '/images/project-ventura.webp', sortOrder: 0 },
      { title: 'Development progress', caption: 'Infrastructure before handover', fileUrl: '/images/project-chandrachaya.webp', sortOrder: 1 },
    ],
  },
]

// ─── Content sections (Why Choose Us / How It Works / Stats / About) ─────
const CONTENT_SECTIONS = [
  {
    sectionKey: 'why_choose_us',
    title: 'Built on land. Measured in trust.',
    subtitle: 'The Company',
    config: JSON.stringify({
      features: [
        { icon: 'ShieldCheck', title: 'RAJUK approved, fully documented', description: 'approval papers, mutation, and registered deed in your hand.' },
        { icon: 'MapPin', title: 'Prime Purbachal locations', description: 'beside Zinda Park and the 300-ft Purbachal Expressway.' },
        { icon: 'Building2', title: 'Infrastructure before handover', description: 'roads, drainage, and utilities built first — not promised later.' },
        { icon: 'BadgeCheck', title: 'Transparent pricing', description: 'no hidden charges — the quoted price is the final price.' },
      ],
    }),
    sortOrder: 0,
  },
  {
    sectionKey: 'how_it_works',
    title: 'From first visit to registered deed',
    subtitle: 'The Process',
    config: JSON.stringify({
      steps: [
        { number: 1, icon: 'Search', title: 'Browse Projects', description: 'Explore our RAJUK-approved projects in Purbachal with detailed plot information and availability.' },
        { number: 2, icon: 'Calendar', title: 'Book a Visit', description: 'Schedule a complimentary guided tour with free transport from our Gulshan-2 office.' },
        { number: 3, icon: 'MapPin', title: 'Select Your Plot', description: 'Choose from available 3, 5, or 10 Katha residential plots in prime locations.' },
        { number: 4, icon: 'KeyRound', title: 'Own Your Land', description: 'Complete simple registration, choose your payment plan, and receive your deed.' },
      ],
    }),
    sortOrder: 1,
  },
  {
    sectionKey: 'stats_section',
    title: 'Stats Section',
    config: JSON.stringify({
      stats: [
        { value: '500+', label: 'Bigha Under Development' },
        { value: '2', label: 'Master-Planned Projects' },
        { value: '100%', label: 'RAJUK-Approved Plots' },
        { value: '40 ft', label: 'Wide Internal Roads' },
      ],
    }),
    sortOrder: 2,
  },
  {
    sectionKey: 'about_partners',
    title: 'Approvals & Utilities',
    config: JSON.stringify({
      partners: [
        { name: 'RAJUK', icon: 'Building2' },
        { name: 'Dhaka WASA', icon: 'Droplets' },
        { name: 'DPDC', icon: 'Zap' },
        { name: 'Titas Gas', icon: 'Flame' },
      ],
    }),
    sortOrder: 3,
  },
  {
    sectionKey: 'about_timeline',
    title: 'Our Journey',
    config: JSON.stringify({
      items: [
        { year: 'Day One', title: 'Founded on a Simple Premise', description: 'MATRICA REAL ESTATE LTD was established to do land development the hard way: papers first, promises second.' },
        { year: 'The Land', title: '500+ Bigha Assembled', description: 'Land acquired and consolidated beside Zinda Park and central Purbachal — chosen for connectivity, not convenience.' },
        { year: 'The Papers', title: 'RAJUK Approvals Secured', description: 'Every plot in both projects approved before a single one was offered for sale.' },
        { year: 'Now', title: 'Infrastructure Underway', description: 'Roads 25–40 ft wide, drainage, utilities, and green corridors being built across Chandra Chaya and Ventura City.' },
        { year: 'Ahead', title: 'First Handovers', description: 'Plot handovers with registration support — each one published to our public delivery record.' },
      ],
    }),
    sortOrder: 4,
  },
  {
    sectionKey: 'about_stats',
    title: 'About Page Stats',
    config: JSON.stringify({
      stats: [
        { value: 500, suffix: '+', label: 'Bigha Under Development' },
        { value: 2, suffix: '', label: 'Master-Planned Projects' },
        { value: 100, suffix: '%', label: 'RAJUK-Approved Plots' },
        { value: 3, suffix: '', label: 'Plot Sizes — 3, 5 & 10 Katha' },
      ],
    }),
    sortOrder: 5,
  },
  // ── Section headers (eyebrow = subtitle, heading = title, sub = content) ──
  { sectionKey: 'stats_header', subtitle: 'The Numbers', title: "We're new. Our standards aren't.", content: 'No borrowed history. Just verifiable approvals, plots you can walk, and a delivery record we publish as we build.', sortOrder: 10 },
  { sectionKey: 'featured_projects', subtitle: 'Our Projects', title: 'Every address. One standard.', content: null, sortOrder: 11 },
  { sectionKey: 'gallery_preview', subtitle: 'The Land', title: "See what we're building", content: null, sortOrder: 12 },
  { sectionKey: 'testimonials_section', subtitle: 'Our Word', title: 'Built on land. Measured in trust.', content: 'Everything we do now becomes our record. Judge us on it.', sortOrder: 13 },
  { sectionKey: 'faq_section', subtitle: 'The Answers', title: 'Everything you need to know', content: 'Still have questions? Reach out — we answer plainly.', sortOrder: 14 },
  { sectionKey: 'blog_section', subtitle: 'The Journal', title: 'From our blog', content: null, sortOrder: 15 },
  { sectionKey: 'neighborhood_guide', subtitle: 'The Location', title: 'Everything you need, within reach', content: null, sortOrder: 16 },
  // ── Page heros / CTAs ──
  { sectionKey: 'projects_hero', subtitle: 'Our Projects', title: 'Two addresses. One standard.', content: 'RAJUK-approved residential plots across Purbachal, planned for the life you will build on them.', sortOrder: 20 },
  { sectionKey: 'projects_cta', subtitle: null, title: "Can't find what you're looking for?", content: 'Talk to our team — we will help you find the right plot.', sortOrder: 21 },
  { sectionKey: 'blog_hero', subtitle: 'The Journal', title: 'Notes from the field', content: 'Guides, updates, and honest takes on land, law, and living in Purbachal.', sortOrder: 22 },
  { sectionKey: 'blog_newsletter', subtitle: null, title: 'Stay Updated', content: 'Get our latest articles and project updates delivered to your inbox. No spam, unsubscribe anytime.', sortOrder: 23 },
  { sectionKey: 'gallery_hero', subtitle: 'The Land', title: "See what we're building", content: 'A look at our projects, infrastructure, and the neighbourhoods taking shape.', sortOrder: 24 },
  { sectionKey: 'gallery_cta', subtitle: null, title: 'Want to see these projects in person?', content: 'Book a free site visit — we will walk the land with you.', sortOrder: 25 },
  { sectionKey: 'contact_hero', subtitle: 'Get in Touch', title: 'We are here to help', content: 'Questions about a plot, a visit, or paperwork? Reach out and we will respond within 24 hours.', sortOrder: 26 },
  { sectionKey: 'about_hero', subtitle: 'The Company', title: 'Built on land. Measured in trust.', content: 'A new land developer holding itself to an old-fashioned standard: papers first, promises second.', sortOrder: 27 },
  // ── About prose ──
  { sectionKey: 'about_story', subtitle: 'Our Story', title: 'New Name. Old-Fashioned Rigor.', content: 'MATRICA REAL ESTATE LTD is a new company, and we treat that as our discipline, not our disadvantage.\n\nWe have no old reputation to hide behind. Every deed we register, every road we build, every date we keep — or miss — becomes public record.\n\nOur promise is plain: papers you can verify before you pay, infrastructure you can walk before handover, and a company that answers its phone after the sale.', image: '/images/project-chandrachaya.webp', sortOrder: 28 },
  { sectionKey: 'about_mission', title: 'Our Mission', content: 'To transform undeveloped land into thriving, well-planned communities — with RAJUK-approved plots, honest documentation, and infrastructure built before handover.', sortOrder: 29 },
  { sectionKey: 'about_vision', title: 'Our Vision', content: "To be Bangladesh's most trusted land developer, judged not on marketing but on a public record of approvals kept and deeds delivered.", sortOrder: 30 },
  { sectionKey: 'about_values', title: 'What We Stand For', config: JSON.stringify({ values: [
    { icon: 'ShieldCheck', title: 'Integrity', description: 'Papers you can verify before you pay.' },
    { icon: 'Sparkles', title: 'Innovation', description: 'Master planning built on modern urban principles.' },
    { icon: 'BadgeCheck', title: 'Quality', description: 'Roads and utilities built to specification.' },
    { icon: 'Eye', title: 'Transparency', description: 'A delivery ledger we publish as we build.' },
    { icon: 'Leaf', title: 'Sustainability', description: 'Green corridors and water bodies by design.' },
    { icon: 'Users', title: 'Community', description: 'Neighbourhoods planned for the life lived in them.' },
  ] }), sortOrder: 31 },
  // ── Cookie consent ──
  { sectionKey: 'cookie_consent', title: 'We value your privacy', content: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.', config: JSON.stringify({ categories: [
    { key: 'essential', label: 'Essential', description: 'Required for the site to function. Always on.', locked: true },
    { key: 'analytics', label: 'Analytics', description: 'Help us understand how visitors use the site.', locked: false },
    { key: 'marketing', label: 'Marketing', description: 'Used to deliver relevant content and offers.', locked: false },
  ] }), sortOrder: 32 },
  // ── Property search filter options ──
  { sectionKey: 'property_search', title: 'Property Search', config: JSON.stringify({
    types: ['Residential Plot', 'Commercial Plot', 'Any'],
    budgets: ['Under 20 Lakh', '20–50 Lakh', '50 Lakh–1 Crore', 'Above 1 Crore'],
    plotSizes: ['3 Katha', '5 Katha', '10 Katha'],
  }), sortOrder: 33 },
]

// ─── Runner ──────────────────────────────────────────────────────────────
async function main() {
  const log = (label, n) => console.log(`${label}: ${n} created`)

  // Hero slides — skip if any exist
  if ((await db.heroSlide.count()) === 0) {
    await db.heroSlide.createMany({ data: HERO_SLIDES })
    log('HeroSlide', HERO_SLIDES.length)
  } else console.log('HeroSlide: exists, skipped')

  // FAQs — skip if any exist
  if ((await db.fAQ.count()) === 0) {
    await db.fAQ.createMany({ data: FAQS })
    log('FAQ', FAQS.length)
  } else console.log('FAQ: exists, skipped')

  // Projects — upsert by slug, then backfill deep child collections when empty
  let projCreated = 0, projUpdated = 0
  for (const p of PROJECTS) {
    const { highlights, specs, stages, amenities, distances, landmarks, faqs, images, documents, ...data } = p
    let project = await db.project.findUnique({ where: { slug: p.slug } })
    if (!project) {
      project = await db.project.create({ data })
      projCreated++
    } else {
      // Backfill new scalar fields that older seeds did not set
      await db.project.update({ where: { id: project.id }, data: {
        logo: project.logo ?? data.logo,
        mapImage: project.mapImage ?? data.mapImage,
        mapsQuery: project.mapsQuery ?? data.mapsQuery,
        cardHighlights: project.cardHighlights ?? data.cardHighlights,
      } })
      projUpdated++
    }
    const pid = project.id
    // Highlights: existing seed created title-only rows; add detail if missing.
    const hlCount = await db.projectHighlight.count({ where: { projectId: pid } })
    if (hlCount === 0) {
      await db.projectHighlight.createMany({ data: highlights.map((h, i) => ({ projectId: pid, title: h.title, detail: h.detail, sortOrder: i })) })
    }
    const seedChild = async (model, count, rows) => {
      if ((await count({ where: { projectId: pid } })) === 0 && rows.length)
        await model.createMany({ data: rows.map((r, i) => ({ ...r, projectId: pid, sortOrder: r.sortOrder ?? i })) })
    }
    await seedChild(db.projectSpec, db.projectSpec.count.bind(db.projectSpec), specs)
    await seedChild(db.projectStage, db.projectStage.count.bind(db.projectStage), stages)
    await seedChild(db.projectAmenity, db.projectAmenity.count.bind(db.projectAmenity), amenities)
    await seedChild(db.projectDistance, db.projectDistance.count.bind(db.projectDistance), distances)
    await seedChild(db.projectLandmark, db.projectLandmark.count.bind(db.projectLandmark), landmarks)
    await seedChild(db.projectFaq, db.projectFaq.count.bind(db.projectFaq), faqs)
    await seedChild(db.projectImage, db.projectImage.count.bind(db.projectImage), images)
    if ((await db.projectDocument.count({ where: { projectId: pid } })) === 0)
      await db.projectDocument.createMany({ data: documents.map((d) => ({ ...d, projectId: pid })) })
  }
  console.log(`Project: ${projCreated} created, ${projUpdated} backfilled`)

  // Blog — upsert by slug (drafts)
  let blogCreated = 0
  for (const b of BLOG_POSTS) {
    const existing = await db.blogPost.findUnique({ where: { slug: b.slug } })
    if (existing) continue
    await db.blogPost.create({ data: b })
    blogCreated++
  }
  log('BlogPost (drafts)', blogCreated)

  // Team — match by exact name
  let teamCreated = 0
  for (const t of TEAM) {
    const existing = await db.teamMember.findFirst({ where: { name: t.name } })
    if (existing) continue
    await db.teamMember.create({ data: { ...t, status: 'active' } })
    teamCreated++
  }
  log('TeamMember', teamCreated)

  // Gallery — upsert categories by slug
  let galCreated = 0
  for (const g of GALLERY) {
    const existing = await db.galleryCategory.findUnique({ where: { slug: g.slug } })
    if (existing) continue
    const { items, ...cat } = g
    await db.galleryCategory.create({
      data: { ...cat, enabled: true, items: { create: items.map((it) => ({ ...it, mediaType: 'image', enabled: true })) } },
    })
    galCreated++
  }
  log('GalleryCategory', galCreated)

  // Content sections — upsert by sectionKey, never overwrite admin edits
  let csCreated = 0
  for (const s of CONTENT_SECTIONS) {
    const existing = await db.contentSection.findUnique({ where: { sectionKey: s.sectionKey } })
    if (existing) continue
    await db.contentSection.create({ data: { ...s, enabled: true } })
    csCreated++
  }
  log('ContentSection', csCreated)

  // Payment plans — skip if any exist
  if ((await db.paymentPlan.count()) === 0) {
    await db.paymentPlan.createMany({ data: PAYMENT_PLANS })
    log('PaymentPlan', PAYMENT_PLANS.length)
  } else console.log('PaymentPlan: exists, skipped')

  // Mobile menu — skip if any mobile items exist
  if ((await db.menuItem.count({ where: { location: 'mobile' } })) === 0) {
    await db.menuItem.createMany({ data: MOBILE_MENU.map((m) => ({ ...m, enabled: true, target: '_self' })) })
    log('MenuItem (mobile)', MOBILE_MENU.length)
  } else console.log('MenuItem (mobile): exists, skipped')

  // Settings — create only when the key is absent (never clobber admin edits)
  const SETTINGS = {
    social_twitter: '', social_tiktok: '', social_telegram: '',
    whatsapp_default_message: 'Hi, I would like to know more about your Purbachal projects.',
    site_url: 'https://matrica.com.bd',
    footer_about: 'is a premier land development company delivering RAJUK-approved residential plots in Purbachal, Dhaka.',
    footer_credit: 'Design and Developed by YouthFire IT',
    footer_credit_url: 'https://youthfireit.com',
    footer_colophon: 'Purbachal, Dhaka · RAJUK-Approved Developments',
    emi_default_rate: '9.5',
    emi_default_tenure: '5',
    sla_hours: '2',
    privacy_updated: 'July 2025',
    terms_updated: 'July 2025',
    chat_quick_replies: JSON.stringify(['Book a Plot', 'Site Visit', 'Project Details', 'Contact Sales']),
  }
  let setCreated = 0
  for (const [key, value] of Object.entries(SETTINGS)) {
    const existing = await db.setting.findUnique({ where: { key } })
    if (existing) continue
    await db.setting.create({ data: { key, value } })
    setCreated++
  }
  log('Setting', setCreated)

  // Social links — migrate from existing social_* settings when table is empty
  if ((await db.socialLink.count()) === 0) {
    const SOCIAL = [
      ['facebook', 'Facebook', 'Facebook'], ['instagram', 'Instagram', 'Instagram'],
      ['youtube', 'Youtube', 'YouTube'], ['linkedin', 'Linkedin', 'LinkedIn'],
      ['whatsapp', 'MessageCircle', 'WhatsApp'], ['twitter', 'Twitter', 'Twitter'],
      ['tiktok', 'Globe', 'TikTok'], ['telegram', 'Send', 'Telegram'],
    ]
    const rows = []
    for (let i = 0; i < SOCIAL.length; i++) {
      const [platform, icon, label] = SOCIAL[i]
      const s = await db.setting.findUnique({ where: { key: `social_${platform}` } })
      if (s?.value) rows.push({ platform, url: s.value, icon, label, enabled: true, sortOrder: i })
    }
    if (rows.length) {
      await db.socialLink.createMany({ data: rows })
      log('SocialLink', rows.length)
    } else console.log('SocialLink: no social_* settings to migrate, skipped')
  } else console.log('SocialLink: exists, skipped')

  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
