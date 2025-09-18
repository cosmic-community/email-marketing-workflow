import { NextRequest, NextResponse } from 'next/server'
import { getEmailWorkflows, createEmailWorkflow } from '@/lib/cosmic'
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
    
    // Validate required fields
    if (!body.name) {
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

    // Validate each step
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

    // Create the workflow
    const result = await createEmailWorkflow({
      name: body.name,
      description: body.description || '',
      trigger_type: body.trigger_type,
      trigger_lists: body.trigger_lists || [],
      trigger_tags: body.trigger_tags || [],
      trigger_date: body.trigger_date || '',
      steps: body.steps.map((step: any) => ({
        template_id: step.template_id,
        delay_days: step.delay_days || 0,
        delay_hours: step.delay_hours || 0,
        delay_minutes: step.delay_minutes || 0,
        active: step.active !== false,
      })),
    })

    // Revalidate the workflows page
    revalidatePath('/workflows')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creating email workflow:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create email workflow' },
      { status: 500 }
    )
  }
}