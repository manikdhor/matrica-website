import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { seedDefaultTemplates } from '@/lib/whatsapp'

export async function POST() {
  const auth = await requirePermission('settings', true)
  if (auth instanceof Response) return auth

  try {
    // Check if projects already exist
    const existingProjects = await db.project.count()
    if (existingProjects > 0) {
      return NextResponse.json({ message: 'Database already seeded' })
    }

    // Seed projects
    const ventura = await db.project.create({
      data: {
        name: 'Ventura City',
        slug: 'ventura-city',
        status: 'ongoing',
        publishStatus: 'published',
        tagline: 'Where Modern Living Begins',
        summary: 'Ventura City is a residential land project in Purbachal, planned in line with RAJUK policy, beside RAJUK Purbachal New Town, with modern infrastructure.',
        cardImage: '/images/project-ventura.webp',
        heroImage: '/images/project-ventura.webp',
        locationArea: 'Purbachal',
        address: 'Purbachal, Dhaka, Bangladesh',
        featured: true,
        sortOrder: 1,
      },
    })

    const greenValley = await db.project.create({
      data: {
        name: 'Green Valley',
        slug: 'green-valley',
        status: 'ongoing',
        publishStatus: 'published',
        tagline: 'Nature Meets Luxury',
        summary: 'Green Valley combines natural surroundings with premium living, offering spacious plots in a serene environment.',
        cardImage: '/images/project-greenvalley.webp',
        heroImage: '/images/project-greenvalley.webp',
        locationArea: 'Purbachal',
        address: 'Purbachal, Dhaka, Bangladesh',
        featured: true,
        sortOrder: 2,
      },
    })

    const riverside = await db.project.create({
      data: {
        name: 'Riverside Estate',
        slug: 'riverside-estate',
        status: 'upcoming',
        publishStatus: 'published',
        tagline: 'Waterfront Living Redefined',
        summary: 'Riverside Estate offers an exclusive waterfront living experience with premium residential plots along the river.',
        cardImage: '/images/project-riverside.webp',
        heroImage: '/images/project-riverside.webp',
        locationArea: 'Purbachal',
        address: 'Purbachal, Dhaka, Bangladesh',
        featured: true,
        sortOrder: 3,
      },
    })

    const purbachalHeights = await db.project.create({
      data: {
        name: 'Purbachal Heights',
        slug: 'purbachal-heights',
        status: 'upcoming',
        publishStatus: 'published',
        tagline: 'Elevate Your Lifestyle',
        summary: 'Purbachal Heights offers elevated living with strategically located premium plots in the heart of Purbachal.',
        cardImage: '/images/project-skyline.webp',
        heroImage: '/images/project-skyline.webp',
        locationArea: 'Purbachal',
        address: 'Purbachal, Dhaka, Bangladesh',
        featured: true,
        sortOrder: 4,
      },
    })

    // Seed testimonials
    await db.testimonial.createMany({
      data: [
        {
          name: 'Md. Arif Rahman',
          designation: 'Business Owner',
          content: "Investing in Matrica's Ventura City was the best decision for our family. The location is perfect and the development quality exceeded our expectations.",
          rating: 5,
          featured: true,
          projectId: ventura.id,
          status: 'active',
          sortOrder: 1,
        },
        {
          name: 'Fatema Begum',
          designation: 'Doctor',
          content: 'The team at Matrica was transparent and professional throughout the process. We felt confident every step of the way.',
          rating: 5,
          featured: true,
          projectId: ventura.id,
          status: 'active',
          sortOrder: 2,
        },
        {
          name: 'Eng. Tanvir Ahmed',
          designation: 'Engineer',
          content: "Purbachal is the future of Dhaka, and Matrica is leading the way. I'm proud to be part of this community.",
          rating: 5,
          featured: true,
          projectId: greenValley.id,
          status: 'active',
          sortOrder: 3,
        },
      ],
    })

    // Seed WhatsApp templates
    await seedDefaultTemplates()

    return NextResponse.json({
      message: 'Database seeded successfully',
      projects: 4,
      testimonials: 3,
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}