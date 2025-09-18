import { NextRequest, NextResponse } from 'next/server'
import { getEmailWorkflows, createEmailWorkflow } from '@/lib/cosmic'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    const workflows = await getEmailWorkflows()
    return NextResponse.json({ success: true, data: workflows })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      )
    }

    if (!body.steps || !Array.isArray(body.steps) || body.steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one workflow step is required' },
        { status: 400 }
      )
    }

    if (!body.trigger_type) {
      return NextResponse.json(
        { error: 'Trigger type is required' },
        { status: 400 }
      )
    }

    // Create the workflow
    const result = await createEmailWorkflow({
      name: body.name,
      description: body.description || '',
      trigger_type: body.trigger_type,
      trigger_lists: body.trigger_lists || [],
      trigger_tags: body.trigger_tags || [],
      trigger_date: body.trigger_date || '',
      steps: body.steps
    })

    // Revalidate workflows page
    revalidatePath('/workflows')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}