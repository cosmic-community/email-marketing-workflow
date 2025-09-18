// app/api/workflows/[id]/duplicate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { duplicateEmailWorkflow } from '@/lib/cosmic'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Duplicate the workflow
    const result = await duplicateEmailWorkflow(id)

    // Revalidate the workflows page
    revalidatePath('/workflows')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error duplicating email workflow:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate email workflow' },
      { status: 500 }
    )
  }
}