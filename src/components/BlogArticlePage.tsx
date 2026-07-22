'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
import DOMPurify from 'dompurify'
import {
  ChevronRight,
  Clock,
  ArrowRight,
  User,
  MessageCircle,
  Facebook,
  Twitter,
  Link2,
  List,
  ChevronDown,
  Home,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useSiteSettings } from '@/lib/use-site-settings'
import { usePublicData, seedPublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import type { PublicBlogPostPayload } from '@/app/api/blog/[slug]/route'
import type { PublicBlogListPayload } from '@/app/api/blog/route'

interface BlogPostData {
  slug: string
  title: string
  excerpt: string
  category: string
  image: string
  date: string
  readTime: string
  author: string
  authorBio: string
  headings: string[]
  content: React.ReactNode | ((cn: string) => React.ReactNode)
}

const allPosts: Record<string, BlogPostData> = {
  'why-purbachal-best-investment-2025': {
    slug: 'why-purbachal-best-investment-2025',
    title: "Why Purbachal is Dhaka's Best Investment in 2025",
    excerpt:
      'Purbachal New Town continues to outperform all other Dhaka suburbs in land value appreciation.',
    category: 'Investment',
    image: '/images/project-ventura.webp',
    date: 'Mar 15, 2025',
    readTime: '7 min read',
    author: 'MATRICA Team',
    authorBio:
      'MATRICA REAL ESTATE LTD is a premium land development company with over 12 years of experience in Purbachal, Dhaka. Our team of experts provides insights to help investors make informed decisions.',
    headings: [
      'The Rise of Purbachal New Town',
      'Why 2025 Is the Ideal Time to Invest',
      'Making the Right Investment Decision',
    ],
    content: (
      <>
        <h2 id="the-rise-of-purbachal-new-town" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          The Rise of Purbachal New Town
        </h2>
        <p className="leading-relaxed mb-6">
          Over the past decade, Purbachal New Town has transformed from a planned
          satellite city into one of Dhaka&apos;s most sought-after residential
          destinations. With the government&apos;s continued investment in
          infrastructure — including the Dhaka-Purbachal Expressway, dedicated
          water supply systems, and upcoming metro rail extensions — the area has
          seen consistent land value appreciation of 15-20% annually, outpacing
          every other suburb in the greater Dhaka region.
        </p>
        <p className="leading-relaxed mb-6">
          The RAJUK-approved projects in Purbachal offer buyers a rare combination
          of legal certainty, modern urban planning, and proximity to Dhaka&apos;s
          central business districts. Unlike many other areas where land
          documentation remains murky, Purbachal benefits from a structured
          development authority that ensures proper zoning, road networks, and
          utility infrastructure.
        </p>

        <div className="bg-[#FFFFFF] border-l-4 border-[#1E6B3A] rounded-r-lg p-5 sm:p-6 my-8">
          <h3 className="text-[#1E6B3A] font-bold text-base mb-3">
            Key Investment Facts
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Average annual land value appreciation: 15-20%
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Dhaka-Purbachal Expressway reduces travel time to 20 minutes
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              300-foot main road and dedicated utility networks
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Upcoming metro rail extension by 2027
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              All MATRICA projects fully RAJUK approved
            </li>
          </ul>
        </div>

        <div className="gold-line my-6" />
        <h2 id="why-2025-is-the-ideal-time-to-invest" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Why 2025 Is the Ideal Time to Invest
        </h2>
        <p className="leading-relaxed mb-6">
          With the expressway now operational and several major institutional
          developments — including government offices, educational institutions,
          and healthcare facilities — either completed or in advanced stages of
          construction, Purbachal is transitioning from an emerging area to a
          mature residential hub. This inflection point makes 2025 particularly
          attractive for investors, as property values are expected to accelerate
          further once all planned infrastructure is fully operational.
        </p>
        <p className="leading-relaxed mb-6">
          For buyers seeking RAJUK-approved plots with clear documentation,
          flexible payment plans, and the backing of an experienced developer,
          MATRICA&apos;s projects in Purbachal — Ventura City and Green Valley —
          represent compelling opportunities that combine immediate livability
          with long-term investment potential.
        </p>

        <div className="gold-line my-6" />
        <h2 id="making-the-right-investment-decision" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Making the Right Investment Decision
        </h2>
        <p className="leading-relaxed mb-6">
          Successful real estate investment requires thorough due diligence. We
          recommend every potential buyer visit the project site, verify all
          documentation, and consult with our experienced advisors who can provide
          detailed information about plot specifications, payment options, and
          future development plans. A site visit costs nothing but can save you
          from costly mistakes.
        </p>
        <p className="leading-relaxed">
          At MATRICA, we believe in complete transparency. Every cost is
          communicated upfront, every document is RAJUK approved, and every client
          receives personalized guidance throughout their investment journey.
          Contact us today to schedule a free site visit and discover why
          Purbachal is Dhaka&apos;s most promising real estate destination.
        </p>
      </>
    ),
  },
  'complete-guide-buying-land-bangladesh': {
    slug: 'complete-guide-buying-land-bangladesh',
    title: 'Complete Guide to Buying Land in Bangladesh',
    excerpt:
      'Everything you need to know about purchasing land in Bangladesh, from legal requirements to due diligence best practices.',
    category: 'Guide',
    image: '/images/project-greenvalley.webp',
    date: 'Feb 28, 2025',
    readTime: '8 min read',
    author: 'MATRICA Team',
    authorBio:
      'MATRICA REAL ESTATE LTD is a premium land development company with over 12 years of experience in Purbachal, Dhaka. Our team of experts provides insights to help investors make informed decisions.',
    headings: [
      'Understanding the Land Market in Bangladesh',
      'Step-by-Step Legal Process',
      'Due Diligence Checklist',
      'Financing and Payment Options',
    ],
    content: (
      <>
        <h2 id="understanding-the-land-market-in-bangladesh" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Understanding the Land Market in Bangladesh
        </h2>
        <p className="leading-relaxed mb-6">
          Bangladesh has one of the most dynamic land markets in South Asia, driven by rapid urbanization, a growing middle class, and limited supply of properly zoned residential land in major cities. Dhaka, in particular, has seen land prices triple over the past decade, making land acquisition both a significant investment opportunity and a decision that demands careful research and planning.
        </p>
        <p className="leading-relaxed mb-6">
          The legal framework governing land transactions in Bangladesh is based on a combination of the Registration Act of 1908, the Transfer of Property Act of 1882, and the State Acquisition and Tenancy Act of 1950. While these laws provide a structured process, the complexity of land records, the prevalence of disputed ownership, and the involvement of multiple government agencies mean that buyers must exercise extraordinary caution at every stage of the process.
        </p>
        <p className="leading-relaxed mb-6">
          For first-time buyers, the sheer volume of paperwork and the unfamiliarity with local customs can be overwhelming. This guide aims to demystify the process, providing a clear, step-by-step roadmap from initial research to final registration.
        </p>

        <div className="bg-[#FFFFFF] border-l-4 border-[#1E6B3A] rounded-r-lg p-5 sm:p-6 my-8">
          <h3 className="text-[#1E6B3A] font-bold text-base mb-3">
            Key Facts About Land Purchase in Bangladesh
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              All land transfers must be registered at the Sub-Registrar&apos;s office
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Mutation must be completed within 3 months of registration
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              RAJUK approval required for any development in Dhaka metropolitan area
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Stamp duty and registration fees typically total 7-8% of property value
            </li>
          </ul>
        </div>

        <div className="gold-line my-6" />
        <h2 id="step-by-step-legal-process" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Step-by-Step Legal Process
        </h2>
        <p className="leading-relaxed mb-6">
          The land purchase process in Bangladesh begins with a thorough title search. This involves examining the chain of ownership through a series of registered deeds, sometimes going back several decades. A competent lawyer will verify that the seller has legitimate ownership, that there are no outstanding mortgages or liens, and that the land is not subject to any government acquisition or litigation.
        </p>
        <p className="leading-relaxed mb-6">
          Once the title search is complete and the buyer is satisfied, a sale agreement (Baynaama) is executed between the parties. This agreement typically includes the sale price, payment schedule, and a timeline for final registration. A portion of the purchase price, usually 10-20%, is paid as earnest money at this stage. The final registration is then completed at the Sub-Registrar&apos;s office, where both parties must appear with their witnesses.
        </p>
        <p className="leading-relaxed mb-6">
          After registration, the buyer must complete the mutation process with the local land revenue office. This updates the government records to reflect the new ownership and is essential for paying property taxes and establishing legal title in official records. Failure to complete mutation can lead to complications when selling or developing the land in the future.
        </p>

        <div className="gold-line my-6" />
        <h2 id="due-diligence-checklist" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Due Diligence Checklist
        </h2>
        <p className="leading-relaxed mb-6">
          Before committing to any land purchase in Bangladesh, buyers should verify several critical documents. The most important is the certified copy of the latest registered deed, which establishes the current owner&apos;s right to sell. Additionally, buyers should request the current tax receipt (Khajna), the mutation certificate, and any approved layout plan if the land is part of a housing project.
        </p>
        <p className="leading-relaxed mb-6">
          For lands in the Dhaka metropolitan area, RAJUK approval is mandatory for any development activity. Buyers should verify that the project or plot has obtained the necessary RAJUK clearance and that the layout plan matches the actual site conditions. Many unscrupulous developers operate without proper approvals, leading to demolition orders, legal battles, and significant financial losses for buyers.
        </p>

        <div className="gold-line my-6" />
        <h2 id="financing-and-payment-options" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Financing and Payment Options
        </h2>
        <p className="leading-relaxed mb-6">
          While cash purchases remain the most common method for land transactions in Bangladesh, several banks and financial institutions now offer land purchase loans. These typically cover 50-70% of the property value, with repayment periods of 5 to 15 years. Interest rates vary between 9-13% depending on the lender and the borrower&apos;s credit profile.
        </p>
        <p className="leading-relaxed mb-6">
          Reputable developers like MATRICA offer flexible installment plans that reduce the upfront financial burden. These plans typically involve a down payment followed by monthly or quarterly installments over 2 to 5 years, making land ownership accessible to a broader range of buyers. Before committing to any financing arrangement, buyers should carefully review the terms, including any penalties for late payment and the consequences of default.
        </p>
      </>
    ),
  },
  'purbachal-infrastructure-update-2025': {
    slug: 'purbachal-infrastructure-update-2025',
    title: 'Purbachal New Town: Infrastructure Update 2025',
    excerpt:
      'A comprehensive look at the latest infrastructure developments transforming Purbachal into Dhaka\'s next major urban center.',
    category: 'Infrastructure',
    image: '/images/project-skyline.webp',
    date: 'Feb 10, 2025',
    readTime: '6 min read',
    author: 'MATRICA Team',
    authorBio:
      'MATRICA REAL ESTATE LTD is a premium land development company with over 12 years of experience in Purbachal, Dhaka. Our team of experts provides insights to help investors make informed decisions.',
    headings: [
      'The Dhaka-Purbachal Expressway: Now Fully Operational',
      'Water Supply and Sanitation Progress',
      'Road Networks and Connectivity',
      'Looking Ahead: Metro Rail and Beyond',
    ],
    content: (
      <>
        <h2 id="the-dhaka-purbachal-expressway-now-fully-operational" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          The Dhaka-Purbachal Expressway: Now Fully Operational
        </h2>
        <p className="leading-relaxed mb-6">
          The Dhaka-Purbachal Expressway, long considered the most critical infrastructure project for the region, is now fully operational. This 16-kilometer toll road connects Purbachal New Town directly to Dhaka&apos;s Kuran Bazar intersection, reducing travel time from the previous 90-minute journey along the Bhulta-Narayanganj route to just 20-25 minutes during normal traffic hours. The expressway features six lanes, modern tolling systems, and dedicated service roads along its entire length.
        </p>
        <p className="leading-relaxed mb-6">
          The impact on property values has been immediate and significant. Since the expressway opening, land prices in areas within 2 kilometers of the route have appreciated by 18-25%, with MATRICA&apos;s projects among the primary beneficiaries due to their strategic proximity to key interchanges. Real estate analysts expect this appreciation trend to continue as more commercial and institutional developments take root along the corridor.
        </p>
        <p className="leading-relaxed mb-6">
          For residents of MATRICA&apos;s Ventura City and Green Valley projects, the expressway means seamless connectivity to Dhaka&apos;s major commercial districts including Gulshan, Banani, and Motijheel. This has transformed Purbachal from a peripheral satellite town into a genuine extension of Dhaka&apos;s urban core.
        </p>

        <div className="bg-[#FFFFFF] border-l-4 border-[#1E6B3A] rounded-r-lg p-5 sm:p-6 my-8">
          <h3 className="text-[#1E6B3A] font-bold text-base mb-3">
            2025 Infrastructure Milestones
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Dhaka-Purbachal Expressway fully operational since January 2025
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              300-foot main boulevard 80% complete, full paving by mid-2025
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Dedicated WASA water treatment plant at 60% completion
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Underground electricity cabling covering 70% of residential sectors
            </li>
          </ul>
        </div>

        <div className="gold-line my-6" />
        <h2 id="water-supply-and-sanitation-progress" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Water Supply and Sanitation Progress
        </h2>
        <p className="leading-relaxed mb-6">
          One of the most significant challenges for any new urban development in Bangladesh is ensuring a reliable water supply. Purbachal New Town is addressing this with a dedicated WASA water treatment plant currently under construction on the Shitalakshya River. The plant, designed to process 50 million gallons per day, is expected to be partially operational by late 2025 and fully commissioned by early 2026.
        </p>
        <p className="leading-relaxed mb-6">
          In the meantime, RAJUK-approved projects like those developed by MATRICA have implemented interim water solutions including deep tube wells, overhead reservoirs, and water treatment systems. These measures ensure that current residents have access to clean, safe water while the permanent municipal infrastructure is being completed. The underground drainage and sewage network is also progressing well, with main trunk lines already laid across several sectors.
        </p>

        <div className="gold-line my-6" />
        <h2 id="road-networks-and-connectivity" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Road Networks and Connectivity
        </h2>
        <p className="leading-relaxed mb-6">
          Purbachal&apos;s road network is designed to a standard rarely seen in Bangladesh. The centerpiece is the 300-foot (91-meter) main boulevard that runs through the heart of the new town, providing a grand arterial connection between the expressway and the residential sectors. As of early 2025, approximately 80% of this road has been paved, with the remaining sections expected to be completed by mid-2025.
        </p>
        <p className="leading-relaxed mb-6">
          Secondary and tertiary roads within RAJUK-approved projects are already fully developed. MATRICA&apos;s projects feature wide, tree-lined internal roads with proper drainage, street lighting, and pedestrian walkways. The difference in road quality between RAJUK-approved developments and unauthorized projects is stark and represents one of the most compelling reasons to choose a compliant developer.
        </p>

        <div className="gold-line my-6" />
        <h2 id="looking-ahead-metro-rail-and-beyond" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Looking Ahead: Metro Rail and Beyond
        </h2>
        <p className="leading-relaxed mb-6">
          The Bangladesh government has formally approved the extension of Dhaka Metro Rail Line 1 to Purbachal New Town, with construction expected to begin in 2026. This line will provide a rapid transit connection from Purbachal to the capital&apos;s central business districts, further reducing travel times and boosting property values across the entire region.
        </p>
        <p className="leading-relaxed mb-6">
          Additional planned infrastructure includes a dedicated bus rapid transit corridor, several new educational institutions, a 500-bed hospital, and a central commercial district designed to attract corporate offices and retail establishments. These developments collectively signal that Purbachal is not just a residential satellite town but is being positioned as a comprehensive urban center in its own right. For investors and homebuyers, the message is clear: the infrastructure foundation being laid today will support significant value growth for decades to come.
        </p>
      </>
    ),
  },
  'things-check-before-buying-plot': {
    slug: 'things-check-before-buying-plot',
    title: '10 Things to Check Before Buying a Plot',
    excerpt:
      'A practical checklist every land buyer in Bangladesh should follow to avoid costly mistakes and ensure a secure investment.',
    category: 'Tips',
    image: '/images/project-riverside.webp',
    date: 'Jan 20, 2025',
    readTime: '5 min read',
    author: 'MATRICA Team',
    authorBio:
      'MATRICA REAL ESTATE LTD is a premium land development company with over 12 years of experience in Purbachal, Dhaka. Our team of experts provides insights to help investors make informed decisions.',
    headings: [
      'Why Due Diligence Matters More Than Ever',
      'Title Verification and Legal Clearance',
      'RAJUK Approval and Zoning Compliance',
      'Physical Verification and Site Visit',
    ],
    content: (
      <>
        <h2 id="why-due-diligence-matters-more-than-ever" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Why Due Diligence Matters More Than Ever
        </h2>
        <p className="leading-relaxed mb-6">
          The Bangladesh land market, while offering tremendous investment potential, is also fraught with risks that can turn a dream purchase into a financial nightmare. Every year, thousands of buyers lose significant sums to fraudulent sellers, disputed titles, or plots that cannot be legally developed. The consequences range from being unable to build on the land to facing demolition orders years after construction.
        </p>
        <p className="leading-relaxed mb-6">
          The good news is that virtually all of these risks can be mitigated through proper due diligence. By following a systematic checklist before making any payment, buyers can protect themselves and ensure that their investment is secure. Here are the ten most critical things to verify before buying any plot in Bangladesh.
        </p>

        <div className="bg-[#FFFFFF] border-l-4 border-[#1E6B3A] rounded-r-lg p-5 sm:p-6 my-8">
          <h3 className="text-[#1E6B3A] font-bold text-base mb-3">
            Essential Verification Checklist
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Verify RAJUK approval status and layout plan authenticity
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Conduct a complete title search through a qualified lawyer
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Confirm the plot dimensions match the registered deed
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Check for any pending litigation or government acquisition
            </li>
          </ul>
        </div>

        <div className="gold-line my-6" />
        <h2 id="title-verification-and-legal-clearance" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Title Verification and Legal Clearance
        </h2>
        <p className="leading-relaxed mb-6">
          The single most important step in any land purchase is verifying the seller&apos;s legal right to transfer the property. This requires examining the complete chain of title through successive registered deeds, ideally going back at least 30 years. A qualified property lawyer should conduct this search and provide a written opinion on the clarity of the title. Pay special attention to any gaps in the chain, as these often indicate unregistered transfers or inherited property where not all heirs have consented to the sale.
        </p>
        <p className="leading-relaxed mb-6">
          In addition to the title search, buyers should verify that the property tax records are up to date and that the current mutation certificate reflects the seller as the registered owner. Discrepancies between the deed and the mutation records can signal pending legal issues that may complicate or invalidate the transaction.
        </p>

        <div className="gold-line my-6" />
        <h2 id="rajuk-approval-and-zoning-compliance" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          RAJUK Approval and Zoning Compliance
        </h2>
        <p className="leading-relaxed mb-6">
          For any plot within the Dhaka metropolitan area, RAJUK approval is not optional — it is a legal requirement for development. Before purchasing, verify that the plot is part of an approved layout plan and that the approval is current and valid. Some developers obtain approval for a master plan but then sell individual plots that don&apos;t conform to the approved layout. Buyers should cross-reference the specific plot location against the approved plan filed with RAJUK.
        </p>
        <p className="leading-relaxed mb-6">
          Zoning regulations determine what can be built on a plot, including building height limits, setback requirements, and permissible land use. A plot zoned for residential use cannot be used for commercial purposes, and vice versa. Understanding these restrictions before purchase prevents costly surprises when it&apos;s time to build. MATRICA&apos;s projects all come with valid RAJUK approvals and clear zoning classifications, giving buyers complete peace of mind.
        </p>

        <div className="gold-line my-6" />
        <h2 id="physical-verification-and-site-visit" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Physical Verification and Site Visit
        </h2>
        <p className="leading-relaxed mb-6">
          No amount of document verification can replace a thorough physical site visit. Buyers should visit the plot at different times of the day to assess accessibility, surrounding development, and any potential issues such as flooding risk, proximity to undesirable facilities, or encroachments by neighboring properties. During the monsoon season, many areas in the Dhaka periphery experience significant waterlogging, which can render plots unusable for months.
        </p>
        <p className="leading-relaxed mb-6">
          For buyers considering plots in Purbachal, MATRICA offers complimentary site visits with guided tours of Ventura City and Green Valley. These visits include detailed presentations on project infrastructure, development timelines, and investment projections. A well-informed buyer is a protected buyer, and we encourage every prospective client to see the project firsthand before making any commitment.
        </p>
      </>
    ),
  },
  'matrica-launches-green-valley': {
    slug: 'matrica-launches-green-valley',
    title: 'MATRICA Launches Green Valley: Purbachal\'s Premium Residential Project',
    excerpt:
      'MATRICA REAL ESTATE introduces Green Valley, a thoughtfully designed residential community in the heart of Purbachal New Town.',
    category: 'News',
    image: '/images/project-greenvalley.webp',
    date: 'Jan 5, 2025',
    readTime: '5 min read',
    author: 'MATRICA Team',
    authorBio:
      'MATRICA REAL ESTATE LTD is a premium land development company with over 12 years of experience in Purbachal, Dhaka. Our team of experts provides insights to help investors make informed decisions.',
    headings: [
      'Introducing Green Valley',
      'Strategic Location and Connectivity',
      'World-Class Infrastructure',
      'Investment Opportunity',
    ],
    content: (cn: string) => (
      <>
        <h2 id="introducing-green-valley" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Introducing Green Valley
        </h2>
        <p className="leading-relaxed mb-6">
          {cn} is proud to announce the official launch of Green Valley, our newest premium residential project in Purbachal New Town. Building on the success of Ventura City, Green Valley has been designed to offer a harmonious blend of modern urban living and natural serenity. The project spans over 50 bighas of RAJUK-approved land, featuring meticulously planned residential plots ranging from 3 to 7 kathas.
        </p>
        <p className="leading-relaxed mb-6">
          What sets Green Valley apart is its emphasis on green spaces and community living. Over 30% of the project area is dedicated to parks, gardens, water bodies, and walking trails, creating an environment that promotes health, relaxation, and a strong sense of community. The master plan includes a central lake, a children&apos;s play area, a community center, and a mosque, all connected by tree-lined avenues.
        </p>

        <div className="bg-[#FFFFFF] border-l-4 border-[#1E6B3A] rounded-r-lg p-5 sm:p-6 my-8">
          <h3 className="text-[#1E6B3A] font-bold text-base mb-3">
            Green Valley at a Glance
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              50+ bighas of fully RAJUK-approved residential land
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Plot sizes: 3, 5, and 7 kathas with flexible payment plans
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              30% of total area dedicated to green spaces and amenities
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Direct access to 300-foot Purbachal main boulevard
            </li>
          </ul>
        </div>

        <div className="gold-line my-6" />
        <h2 id="strategic-location-and-connectivity" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Strategic Location and Connectivity
        </h2>
        <p className="leading-relaxed mb-6">
          Green Valley is strategically located in Sector 4 of Purbachal New Town, just 3 minutes from the Dhaka-Purbachal Expressway interchange. This prime location ensures that residents can reach Dhaka&apos;s central business districts within 25 minutes, while enjoying the clean air, open spaces, and planned infrastructure that only a properly developed satellite town can offer.
        </p>
        <p className="leading-relaxed mb-6">
          The project site is adjacent to the planned metro rail corridor, which is expected to further enhance connectivity when completed. Nearby facilities include the Purbachal Central Business District, several educational institutions currently under construction, and the upcoming 500-bed government hospital. Green Valley residents will benefit from being at the intersection of Purbachal&apos;s most important infrastructure corridors.
        </p>

        <div className="gold-line my-6" />
        <h2 id="world-class-infrastructure" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          World-Class Infrastructure
        </h2>
        <p className="leading-relaxed mb-6">
          MATRICA has invested heavily in the infrastructure of Green Valley to ensure that residents can begin building their dream homes without delay. All internal roads have been constructed with proper base courses, paving, and drainage systems. Underground electricity cabling eliminates the visual clutter of overhead wires, while a dedicated water supply system with overhead tanks ensures consistent water pressure throughout the project.
        </p>
        <p className="leading-relaxed mb-6">
          Security is a top priority, with the project featuring a gated entry point, CCTV surveillance, and 24-hour security personnel. Street lighting along all roads ensures safety and visibility after dark. The underground storm water drainage system has been designed to handle heavy monsoon rainfall, a critical feature that many competing projects lack.
        </p>

        <div className="gold-line my-6" />
        <h2 id="investment-opportunity" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Investment Opportunity
        </h2>
        <p className="leading-relaxed mb-6">
          With plot prices in Purbachal expected to appreciate 20-30% over the next three years due to ongoing infrastructure development, Green Valley represents an exceptional investment opportunity. MATRICA is offering introductory pricing with flexible payment plans that include 0% interest installments over 36 months, making it accessible for both end-users and investors.
        </p>
        <p className="leading-relaxed mb-6">
          Early buyers will benefit the most, as prices are adjusted upward as each development phase reaches completion. MATRICA&apos;s track record with Ventura City — where early investors have seen returns exceeding 40% — provides confidence that Green Valley will deliver similar or better results. Contact our sales team to schedule a site visit and learn more about available plots and pricing.
        </p>
      </>
    ),
  },
  'rajuk-approval-process-guide': {
    slug: 'rajuk-approval-process-guide',
    title: 'RAJUK Approval Process: What Buyers Need to Know',
    excerpt:
      'Understanding the RAJUK approval process is essential for any land purchase in Dhaka. Here\'s what every buyer should know.',
    category: 'Guide',
    image: '/images/project-ventura.webp',
    date: 'Jan 5, 2025',
    readTime: '6 min read',
    author: 'MATRICA Team',
    authorBio:
      'MATRICA REAL ESTATE LTD is a premium land development company with over 12 years of experience in Purbachal, Dhaka. Our team of experts provides insights to help investors make informed decisions.',
    headings: [
      'What Is RAJUK and Why Does It Matter?',
      'The Layout Plan Approval Process',
      'How Buyers Can Verify RAJUK Approval',
      'Building Plan Approval and Construction',
    ],
    content: (
      <>
        <h2 id="what-is-rajuk-and-why-does-it-matter" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          What Is RAJUK and Why Does It Matter?
        </h2>
        <p className="leading-relaxed mb-6">
          RAJUK (Rajdhani Unnayan Kartripakkha), the Capital Development Authority of Bangladesh, is the government agency responsible for planning, regulating, and authorizing all development activities within the Dhaka metropolitan area and its surrounding zones, including Purbachal New Town. Any land development, building construction, or subdivision of plots in this region requires RAJUK approval, making it the single most important regulatory clearance for real estate in the country.
        </p>
        <p className="leading-relaxed mb-6">
          For buyers, RAJUK approval is the strongest indicator that a project or plot is legitimate, properly planned, and legally developable. Without it, buyers face the risk of demolition orders, inability to obtain utility connections, and significant difficulty in selling or mortgaging the property in the future. Despite these serious consequences, many developers in the Purbachal area operate without proper RAJUK clearance, putting unwary buyers at substantial risk.
        </p>
        <p className="leading-relaxed mb-6">
          Understanding the RAJUK approval process empowers buyers to make informed decisions and distinguish between genuine, legally compliant projects and unauthorized developments that may seem attractive due to lower prices but carry hidden dangers.
        </p>

        <div className="bg-[#FFFFFF] border-l-4 border-[#1E6B3A] rounded-r-lg p-5 sm:p-6 my-8">
          <h3 className="text-[#1E6B3A] font-bold text-base mb-3">
            RAJUK Approval Types
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Layout Plan Approval — required for subdividing land into plots
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Building Construction Approval — required before any building work
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Environmental Clearance — mandatory for projects above a threshold size
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E6B3A] mt-0.5">&#9670;</span>
              Occupancy Certificate — issued after construction meets approved standards
            </li>
          </ul>
        </div>

        <div className="gold-line my-6" />
        <h2 id="the-layout-plan-approval-process" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          The Layout Plan Approval Process
        </h2>
        <p className="leading-relaxed mb-6">
          The layout plan approval is the first and most fundamental RAJUK clearance that any land developer must obtain. This process involves submitting a detailed site plan showing the proposed subdivision of land into individual plots, along with road networks, drainage systems, utility corridors, and green spaces. RAJUK evaluates the plan against its Detailed Area Plan (DAP) to ensure compliance with zoning regulations, building codes, and urban planning standards.
        </p>
        <p className="leading-relaxed mb-6">
          The review process typically takes 60-90 days and involves multiple stages including preliminary scrutiny, technical review by RAJUK engineers, and a final approval committee meeting. Developers must submit comprehensive documentation including land ownership records, topographical surveys, soil test reports, and environmental impact assessments. Any deviation from the approved layout plan is strictly prohibited and can result in cancellation of the approval.
        </p>

        <div className="gold-line my-6" />
        <h2 id="how-buyers-can-verify-rajuk-approval" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          How Buyers Can Verify RAJUK Approval
        </h2>
        <p className="leading-relaxed mb-6">
          Verifying a project&apos;s RAJUK approval status is straightforward but requires initiative on the buyer&apos;s part. The most reliable method is to visit the RAJUK office in person and request verification of the approved layout plan for the specific project. Buyers should bring the project name, developer name, and ideally a copy of the approval document provided by the developer. RAJUK maintains a public registry of all approved projects, and this information can be cross-referenced against the developer&apos;s claims.
        </p>
        <p className="leading-relaxed mb-6">
          Buyers should also verify that the specific plot they are purchasing corresponds to a plot shown on the approved layout plan. Some unscrupulous developers show buyers a valid RAJUK approval for a portion of their land while selling plots in unapproved areas. This bait-and-switch tactic is unfortunately common in the Purbachal area and can have devastating consequences for buyers. MATRICA encourages all prospective buyers to independently verify our RAJUK approvals — we have nothing to hide and everything to gain from your confidence in our projects.
        </p>

        <div className="gold-line my-6" />
        <h2 id="building-plan-approval-and-construction" className="text-2xl sm:text-3xl font-bold text-[#131B16] mt-10 mb-5 pl-4 border-l-2 border-[#1E6B3A]/30">
          Building Plan Approval and Construction
        </h2>
        <p className="leading-relaxed mb-6">
          After purchasing a plot with valid RAJUK layout approval, the next regulatory step is obtaining building plan approval before beginning any construction. This requires submitting detailed architectural and structural drawings prepared by a licensed architect and engineer. RAJUK reviews the plans for compliance with the National Building Code, including structural safety, fire safety, ventilation requirements, and setback regulations.
        </p>
        <p className="leading-relaxed mb-6">
          The building approval process typically takes 45-60 days and requires payment of government fees based on the proposed construction area. Once approved, construction must proceed in accordance with the approved plans. Any modifications require a formal amendment approval from RAJUK. Upon completion, an occupancy certificate must be obtained, which confirms that the building has been constructed according to the approved plans and is safe for habitation. This certificate is essential for obtaining utility connections and for any future sale or mortgage of the property.
        </p>
      </>
    ),
  },
}

const defaultPost: BlogPostData = {
  slug: '',
  title: 'Article Not Found',
  excerpt: '',
  category: '',
  image: '/images/project-ventura.webp',
  date: '',
  readTime: '',
  author: 'MATRICA Team',
  authorBio: '',
  headings: [],
  content: (
    <div className="text-center py-12">
      <p className="text-[#4A564E] text-lg mb-6">
        The article you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/blog">
        <Button className="btn-gold bg-[#1E6B3A] text-[#FFFFFF] hover:bg-[#166B34]">
          Back to Blog
        </Button>
      </Link>
    </div>
  ),
}

const relatedPosts = [
  {
    slug: 'purbachal-infrastructure-update-2025',
    title: 'Purbachal New Town: Infrastructure Update 2025',
    category: 'Purbachal',
    image: '/images/project-skyline.webp',
    date: 'Feb 10, 2025',
    readTime: '6 min read',
  },
  {
    slug: 'rajuk-approval-process-guide',
    title: 'RAJUK Approval Process: What Buyers Need to Know',
    category: 'Investment',
    image: '/images/project-ventura.webp',
    date: 'Jan 5, 2025',
    readTime: '6 min read',
  },
  {
    slug: 'complete-guide-buying-land-bangladesh',
    title: 'Complete Guide to Buying Land in Bangladesh',
    category: 'Buying Guide',
    image: '/images/project-greenvalley.webp',
    date: 'Feb 28, 2025',
    readTime: '8 min read',
  },
]

const slugifyText = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* Admin-authored rich text is trusted-ish, but strip anything executable
   before rendering it with dangerouslySetInnerHTML. */
function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return ''
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button'],
    FORBID_ATTR: ['style'],
  })
}

/* Extract h2 headings for the TOC and stamp slug ids onto them so the
   existing TOC anchors + IntersectionObserver keep working. */
function processDbContent(content: string): { html: string; headings: string[] } {
  const headings: string[] = []
  const html = sanitizeHtml(content).replace(
    /<h2([^>]*)>([\s\S]*?)<\/h2>/gi,
    (match, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, '').trim()
      if (!text) return match
      headings.push(text)
      const cleanAttrs = attrs.replace(/\sid\s*=\s*(?:"[^"]*"|'[^']*')/i, '')
      return `<h2 id="${slugifyText(text)}"${cleanAttrs}>${inner}</h2>`
    }
  )
  return { html, headings }
}

export default function BlogArticlePage({ slug, initialPost }: { slug: string; initialPost?: unknown }) {
  const s = useSiteSettings()
  const t = useT()

  // Server-fetched (page.tsx already queried it for metadata/JSON-LD) — seed
  // the shared cache so the article renders on first paint instead of an
  // empty state waiting on a client /api/blog/[slug] round-trip.
  if (initialPost) seedPublicData(`/api/blog/${encodeURIComponent(slug)}`, initialPost)

  // DB-driven post (admin-managed) — hardcoded posts stay as fallback
  const { data: detailData, loaded: detailLoaded } =
    usePublicData<PublicBlogPostPayload>(`/api/blog/${encodeURIComponent(slug)}`)
  const { data: listData } = usePublicData<PublicBlogListPayload>('/api/blog')

  const dbPost = useMemo<BlogPostData | null>(() => {
    const raw = detailData?.post
    if (!raw) return null
    const { html, headings } = processDbContent(raw.content)
    return {
      slug: raw.slug,
      title: raw.title,
      excerpt: raw.excerpt,
      category: raw.category,
      image: raw.image || '/images/project-chandrachaya.webp',
      date: formatDate(raw.date),
      readTime: raw.readTime,
      author: raw.author,
      authorBio: '', // falls back to company tagline below
      headings,
      content: (
        <div
          className="prose-db"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ),
    }
  }, [detailData])

  // While the DB lookup is in flight and no hardcoded post matches,
  // render a blank placeholder instead of flashing "Article Not Found".
  const loadingPost: BlogPostData = { ...defaultPost, title: '', content: null }
  const post =
    dbPost || allPosts[slug] || (detailLoaded ? defaultPost : loadingPost)
  const isNotFound = !dbPost && !allPosts[slug] && detailLoaded

  // Related articles: other published DB posts when available
  const dbRelated = listData?.posts
    ?.filter((p) => p.slug !== slug)
    .slice(0, 3)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      image: p.image || '/images/project-chandrachaya.webp',
      date: formatDate(p.date),
      readTime: p.readTime,
    }))
  const related = dbRelated && dbRelated.length > 0 ? dbRelated : relatedPosts
  const dynamicAuthor = post.author ? post.author.replace('MATRICA', s.companyName.split(' ').slice(0, 2).join(' ')) : s.companyName
  const dynamicAuthorBio = post.authorBio ? post.authorBio.replace('MATRICA REAL ESTATE LTD', s.companyName) : s.companyTagline
  const authorInitial = dynamicAuthor.charAt(0)
  const topRef = useRef<HTMLDivElement>(null)
  const articleRef = useRef<HTMLElement>(null)
  const isInView = useInView(topRef, { once: true, margin: '-80px' })

  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeHeading, setActiveHeading] = useState('')
  const [tocOpen, setTocOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return
      const rect = articleRef.current.getBoundingClientRect()
      const articleTop = rect.top + window.scrollY
      const articleHeight = rect.height
      const scrollY = window.scrollY
      const progress = Math.min(
        Math.max((scrollY - articleTop + window.innerHeight * 0.4) / articleHeight, 0),
        1
      )
      setScrollProgress(progress * 100)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // IntersectionObserver for TOC active heading
  useEffect(() => {
    if (post.headings.length === 0) return
    const headingElements = post.headings
      .map((h) => {
        const id = h
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
        return document.getElementById(id)
      })
      .filter(Boolean) as Element[]

    if (headingElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    headingElements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [post.headings])

  // Set initial active heading
  const initialHeadingId = post.headings.length > 0
    ? post.headings[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : ''

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      toast.success(t('pages.blogArticle.toastLinkCopied'))
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      toast.error(t('pages.blogArticle.toastCopyFailed'))
    }
  }, [])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const encodedTitle = encodeURIComponent(post.title)
  const encodedUrl = encodeURIComponent(shareUrl)

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  return (
    <main className="min-h-screen page-enter">
      {/* Drop cap + blockquote styles */}
      <style>{`
        .prose-custom > p:first-child::first-letter {
          float: left;
          font-size: 3.5em;
          line-height: 0.8;
          padding-right: 0.1em;
          color: #1E6B3A;
          font-weight: 700;
          margin-top: 0.05em;
        }
        .prose-custom blockquote,
        .prose-custom > div > blockquote {
          border-left: 3px solid #1E6B3A;
          padding-left: 1.25rem;
          font-style: italic;
          background: rgba(30, 107, 58, 0.05);
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        /* DB-authored rich text (admin RichTextEditor output has bare tags) */
        .prose-db h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #131B16;
          margin: 2.5rem 0 1.25rem;
          padding-left: 1rem;
          border-left: 2px solid rgba(30, 107, 58, 0.3);
          line-height: 1.25;
        }
        @media (min-width: 640px) {
          .prose-db h2 { font-size: 1.875rem; }
        }
        .prose-db h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #131B16;
          margin: 2rem 0 1rem;
        }
        .prose-db p {
          line-height: 1.75;
          margin-bottom: 1.5rem;
        }
        .prose-db ul,
        .prose-db ol {
          margin: 0 0 1.5rem 1.5rem;
        }
        .prose-db ul { list-style: disc; }
        .prose-db ol { list-style: decimal; }
        .prose-db li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        .prose-db a {
          color: #1E6B3A;
          text-decoration: underline;
        }
        .prose-db img {
          border-radius: 0.75rem;
          margin: 1.5rem 0;
          max-width: 100%;
          height: auto;
        }
        .prose-db strong { color: #131B16; }
        .prose-db blockquote {
          border-left: 3px solid #1E6B3A;
          padding-left: 1.25rem;
          font-style: italic;
          background: rgba(30, 107, 58, 0.05);
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          border-radius: 0 0.5rem 0.5rem 0;
          margin-bottom: 1.5rem;
        }
      `}</style>

      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[3px] z-50 transition-[width] duration-150 ease-out"
        style={{
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, #1E6B3A, #166B34)',
          boxShadow: '0 0 8px rgba(30, 107, 58, 0.6), 0 0 20px rgba(30, 107, 58, 0.3)',
        }}
      />

      {/* Hero */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 bg-[#FBFAF7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" ref={topRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            {/* Enhanced Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-[#4A564E] mb-6">
              <Link href="/" className="hover:text-[#1E6B3A] transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                {t('pages.blogArticle.breadcrumbHome')}
              </Link>
              <span className="text-[#1E6B3A]/60">›</span>
              <Link href="/blog" className="hover:text-[#1E6B3A] transition-colors">
                {t('pages.blogArticle.breadcrumbBlog')}
              </Link>
              <span className="text-[#1E6B3A]/60">›</span>
              <span className="text-[#1E6B3A] line-clamp-1 max-w-[200px] sm:max-w-xs">
                {isNotFound ? t('pages.blogArticle.notFoundTitle') : post.title}
              </span>
            </nav>

            {/* Category Badge */}
            <Badge className="bg-[#1E6B3A] text-[#FFFFFF] text-xs font-semibold mb-4">
              {post.category}
            </Badge>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#131B16] mb-6 leading-tight">
              {isNotFound ? t('pages.blogArticle.notFoundTitle') : post.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1E6B3A]/20 border border-[#1E6B3A]/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#1E6B3A]" />
                </div>
                <div>
                  <p className="text-[#131B16] text-sm font-medium">
                    {dynamicAuthor}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[#4A564E]">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-[#4A564E] uppercase tracking-wider mb-3 font-medium">
                {t('pages.blogArticle.shareArticle')}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-[#4A564E] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('pages.blogArticle.shareWhatsApp')}</span>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-[#4A564E] hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition-all"
                >
                  <Facebook className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('pages.blogArticle.shareFacebook')}</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-[#4A564E] hover:border-[#1A202C]/20 hover:bg-[#1A202C]/5 hover:text-[#131B16] transition-all"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('pages.blogArticle.shareX')}</span>
                </a>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-[#4A564E] hover:border-[#1E6B3A]/40 hover:bg-[#1E6B3A]/10 hover:text-[#1E6B3A] transition-all"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{copiedLink ? t('pages.blogArticle.copied') : t('pages.blogArticle.copyLink')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="gold-line" />

      {/* Featured Image */}
      <section className="py-8 md:py-12 bg-[#FBFAF7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-2xl overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="w-full aspect-[16/9] object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Body with TOC sidebar */}
      <section className="pb-16 bg-[#FBFAF7]" ref={articleRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="flex-1 min-w-0 max-w-3xl">
              {/* Mobile TOC */}
              {post.headings.length > 0 && (
                <div className="lg:hidden mb-8">
                  <button
                    onClick={() => setTocOpen(!tocOpen)}
                    className="w-full flex items-center justify-between bg-white/50 border border-gray-200 rounded-xl p-4 text-[#131B16] hover:border-[#1E6B3A]/30 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <List className="w-4 h-4 text-[#1E6B3A]" />
                      {t('pages.blogArticle.tableOfContents')}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#4A564E] transition-transform duration-200 ${tocOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {tocOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white/50 border border-t-0 border-gray-200 rounded-b-xl p-4"
                    >
                      <nav className="space-y-2">
                        {post.headings.map((heading, i) => {
                          const id = slugify(heading)
                          return (
                            <a
                              key={i}
                              href={`#${id}`}
                              onClick={() => setTocOpen(false)}
                              className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${
                                (activeHeading || initialHeadingId) === id
                                  ? 'text-[#1E6B3A] border-l-2 border-[#1E6B3A] bg-[#1E6B3A]/5 font-medium'
                                  : 'text-[#4A564E] hover:text-[#4A564E] border-l-2 border-transparent'
                              }`}
                            >
                              {heading}
                            </a>
                          )
                        })}
                      </nav>
                    </motion.div>
                  )}
                </div>
              )}

              <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="prose-custom"
              >
                {isNotFound ? (
                  <div className="text-center py-12">
                    <p className="text-[#4A564E] text-lg mb-6">
                      {t('pages.blogArticle.notFoundMessage')}
                    </p>
                    <Link href="/blog">
                      <Button className="btn-gold bg-[#1E6B3A] text-[#FFFFFF] hover:bg-[#166B34]">
                        {t('pages.blogArticle.backToBlog')}
                      </Button>
                    </Link>
                  </div>
                ) : typeof post.content === 'function' ? (post.content as (cn: string) => React.ReactNode)(s.companyName) : post.content}
              </motion.article>

              {/* Enhanced Author Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mt-12 glass-card gold-border-card rounded-xl p-6 sm:p-8"
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#1E6B3A] to-[#A08840] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FFFFFF] font-bold text-xl sm:text-2xl">
                      {authorInitial}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#131B16] font-bold text-base sm:text-lg mb-1.5">
                      {dynamicAuthor}
                    </p>
                    <p className="text-[#4A564E] text-sm leading-relaxed mb-3">
                      {dynamicAuthorBio}
                    </p>
                    {post.slug && (
                      <Link
                        href="/blog"
                        className="inline-flex items-center gap-1.5 text-sm text-[#1E6B3A] hover:text-[#166B34] transition-colors font-medium"
                      >
                        {t('pages.blogArticle.viewAllPosts')}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Lead Capture CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mt-10 bg-gradient-to-br from-[#1E6B3A]/10 to-[#FFFFFF] border border-[#1E6B3A]/20 rounded-xl p-6 sm:p-8 text-center"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-[#131B16] mb-2">
                  {t('pages.blogArticle.ctaTitle')}
                </h3>
                <p className="text-[#4A564E] text-sm mb-6">
                  {t('pages.blogArticle.ctaSubtitle')}
                </p>
                <Link href="/contact">
                  <Button className="btn-gold bg-[#1E6B3A] text-[#FFFFFF] hover:bg-[#166B34] font-semibold">
                    {t('pages.blogArticle.contactUs')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Desktop TOC Sidebar */}
            {post.headings.length > 0 && (
              <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
                <div className="sticky top-24">
                  <div className="bg-[#FFFFFF]/50 border border-border rounded-xl p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-[#131B16] mb-4">
                      <List className="w-4 h-4 text-[#1E6B3A]" />
                      {t('pages.blogArticle.tableOfContents')}
                    </h4>
                    <nav className="space-y-1">
                      {post.headings.map((heading, i) => {
                        const id = slugify(heading)
                        return (
                          <a
                            key={i}
                            href={`#${id}`}
                            className={`block text-sm py-2 px-3 rounded-lg transition-all duration-200 ${
                              (activeHeading || initialHeadingId) === id
                                ? 'text-[#1E6B3A] border-l-2 border-[#1E6B3A] bg-[#1E6B3A]/5 font-medium'
                                : 'text-[#4A564E] hover:text-[#4A564E] border-l-2 border-transparent hover:border-[#64748B]/30'
                            }`}
                          >
                            {heading}
                          </a>
                        )
                      })}
                    </nav>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* Related Posts */}
      <section className="py-16 md:py-20 bg-[#FBFAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-[#131B16] mb-2 text-center">
              {t('pages.blogArticle.relatedArticles')}
            </h2>
            <div className="gold-line max-w-[80px] mx-auto mt-4 mb-10" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((rp, index) => (
              <motion.div
                key={rp.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link href={`/blog/${rp.slug}`} className="group block h-full">
                  <article className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-[#1E6B3A]/30 transition-colors h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={rp.image}
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-[#1E6B3A] text-[#FFFFFF] text-xs font-semibold">
                          {rp.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold text-[#131B16] mb-2 group-hover:text-[#1E6B3A] transition-colors line-clamp-2">
                        {rp.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#4A564E] mt-auto pt-4 border-t border-border">
                        <span>{rp.date}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rp.readTime}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}