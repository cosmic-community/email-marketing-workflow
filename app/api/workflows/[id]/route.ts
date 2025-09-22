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
    
    // Validate required fields
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json(
        { error: 'Workflow name cannot be empty' },
        { status: 400 }
      )
    }

    if (body.steps && body.steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one workflow step is required' },
        { status: 400 }
      )
    }

    // Validate steps if provided
    if (body.steps) {
      for (const step of body.steps) {
        if (!step.template_id) {
          return NextResponse.json(
            { error: 'Each step must have a template selected' },
            { status: 400 }
          )
        }
      }
    }

    // Update the workflow
    const result = await updateEmailWorkflow(id, {
      name: body.name,
      description: body.description,
      trigger_type: body.trigger_type,
      trigger_lists: body.trigger_lists,
      trigger_tags: body.trigger_tags,
      trigger_date: body.trigger_date,
      steps: body.steps,
      status: body.status
    })

    // Revalidate relevant pages
    revalidatePath('/workflows')
    revalidatePath(`/workflows/${id}`)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error updating email workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update email workflow' },
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