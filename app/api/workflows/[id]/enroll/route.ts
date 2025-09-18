// app/api/workflows/[id]/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { enrollContactInWorkflow } from '@/lib/cosmic'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params
    const body = await request.json()
    
    // Validate required fields
    if (!body.contact_id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    // Enroll the contact
    const result = await enrollContactInWorkflow(workflowId, body.contact_id)

    // Revalidate relevant pages
    revalidatePath('/workflows')
    revalidatePath(`/workflows/${workflowId}`)
    revalidatePath('/contacts')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error enrolling contact in workflow:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enroll contact in workflow' },
      { status: 500 }
    )
  }
}