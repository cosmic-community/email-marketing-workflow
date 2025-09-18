// app/api/workflows/[id]/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { enrollContactInWorkflow } from '@/lib/cosmic'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!body.contact_ids || !Array.isArray(body.contact_ids)) {
      return NextResponse.json(
        { error: 'Contact IDs array is required' },
        { status: 400 }
      )
    }

    const results = {
      enrolled: 0,
      errors: [] as string[]
    }

    // Enroll each contact
    for (const contactId of body.contact_ids) {
      try {
        await enrollContactInWorkflow(id, contactId)
        results.enrolled++
      } catch (error) {
        console.error(`Error enrolling contact ${contactId}:`, error)
        results.errors.push(
          `Failed to enroll contact ${contactId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
    }

    revalidatePath(`/workflows/${id}`)
    
    return NextResponse.json({ 
      success: true, 
      data: results,
      message: `Enrolled ${results.enrolled} contacts${results.errors.length > 0 ? ` with ${results.errors.length} errors` : ''}`
    })
  } catch (error) {
    console.error('Error enrolling contacts in workflow:', error)
    return NextResponse.json(
      { error: 'Failed to enroll contacts' },
      { status: 500 }
    )
  }
}