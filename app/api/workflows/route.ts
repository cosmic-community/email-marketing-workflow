import { NextRequest, NextResponse } from 'next/server'
import { createEmailWorkflow, getEmailWorkflows } from '@/lib/cosmic'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    const workflows = await getEmailWorkflows()
    return NextResponse.json({ success: true, data: workflows })
  } catch (error) {
    console.error('Error fetching email workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Creating workflow with data:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      )
    }

    if (!body.trigger_type) {
      return NextResponse.json(
        { error: 'Trigger type is required' },
        { status: 400 }
      )
    }

    if (!body.steps || !Array.isArray(body.steps) || body.steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one workflow step is required' },
        { status: 400 }
      )
    }

    // Validate steps
    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i]
      if (!step.template_id || !step.template_id.trim()) {
        return NextResponse.json(
          { error: `Step ${i + 1} must have a template selected` },
          { status: 400 }
        )
      }
      
      // Ensure numeric values are properly typed
      step.delay_days = typeof step.delay_days === 'number' ? step.delay_days : 0
      step.delay_hours = typeof step.delay_hours === 'number' ? step.delay_hours : 0
      step.delay_minutes = typeof step.delay_minutes === 'number' ? step.delay_minutes : 0
      step.active = typeof step.active === 'boolean' ? step.active : true
    }

    // Ensure arrays are properly initialized
    const trigger_lists = Array.isArray(body.trigger_lists) ? body.trigger_lists : []
    const trigger_tags = Array.isArray(body.trigger_tags) ? body.trigger_tags : []

    // Create the workflow with proper error handling
    const result = await createEmailWorkflow({
      name: body.name.trim(),
      description: body.description || '',
      trigger_type: body.trigger_type,
      trigger_lists,
      trigger_tags,
      trigger_date: body.trigger_date || '',
      steps: body.steps
    })

    // Revalidate the workflows page
    revalidatePath('/workflows')

    console.log('Workflow created successfully:', result.id)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creating email workflow:', error)
    
    // Provide more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { error: `Failed to create email workflow: ${errorMessage}` },
      { status: 500 }
    )
  }
}