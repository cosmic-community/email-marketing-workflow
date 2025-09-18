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
    
    const duplicatedWorkflow = await duplicateEmailWorkflow(id)
    
    revalidatePath('/workflows')
    
    return NextResponse.json({ 
      success: true, 
      data: duplicatedWorkflow 
    })
  } catch (error) {
    console.error('Error duplicating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate workflow' },
      { status: 500 }
    )
  }
}