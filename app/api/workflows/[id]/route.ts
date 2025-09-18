// app/api/workflows/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getEmailWorkflow, updateEmailWorkflow, deleteEmailWorkflow } from '@/lib/cosmic'
import { revalidatePath } from 'next/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workflow = await getEmailWorkflow(id)
    
    if (!workflow) {
      return NextResponse.json(
        { error: 'Email workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: workflow })
  } catch (error) {
    console.error('Error fetching email workflow:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email workflow' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate required fields if provided
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json(
        { error: 'Workflow name cannot be empty' },
        { status: 400 }
      )
    }

    if (body.steps && (!Array.isArray(body.steps) || body.steps.length === 0)) {
      return NextResponse.json(
        { error: 'At least one workflow step is required' },
        { status: 400 }
      )
    }

    // Validate each step if steps are provided
    if (body.steps) {
      for (let i = 0; i < body.steps.length; i++) {
        const step = body.steps[i]
        if (!step.template_id) {
          return NextResponse.json(
            { error: `Step ${i + 1}: Template is required` },
            { status: 400 }
          )
        }
        if (step.delay_days === undefined && step.delay_hours === undefined && step.delay_minutes === undefined) {
          return NextResponse.json(
            { error: `Step ${i + 1}: At least one delay value is required` },
            { status: 400 }
          )
        }
      }
    }

    // Prepare update data
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.trigger_type !== undefined) updateData.trigger_type = body.trigger_type
    if (body.trigger_lists !== undefined) updateData.trigger_lists = body.trigger_lists
    if (body.trigger_tags !== undefined) updateData.trigger_tags = body.trigger_tags
    if (body.trigger_date !== undefined) updateData.trigger_date = body.trigger_date
    
    if (body.steps !== undefined) {
      updateData.steps = body.steps.map((step: any) => ({
        template_id: step.template_id,
        delay_days: step.delay_days || 0,
        delay_hours: step.delay_hours || 0,
        delay_minutes: step.delay_minutes || 0,
        active: step.active !== false,
      }))
    }

    // Update the workflow
    const result = await updateEmailWorkflow(id, updateData)

    // Revalidate relevant pages
    revalidatePath('/workflows')
    revalidatePath(`/workflows/${id}`)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error updating email workflow:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update email workflow' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Delete the workflow
    await deleteEmailWorkflow(id)

    // Revalidate relevant pages
    revalidatePath('/workflows')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting email workflow:', error)
    return NextResponse.json(
      { error: 'Failed to delete email workflow' },
      { status: 500 }
    )
  }
}