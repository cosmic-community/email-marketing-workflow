// app/workflows/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getEmailWorkflow, getWorkflowEnrollments } from '@/lib/cosmic'
import WorkflowDetails from '@/components/WorkflowDetails'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = await params
  
  let workflow = null
  let enrollments = []

  try {
    workflow = await getEmailWorkflow(id)
    if (workflow) {
      enrollments = await getWorkflowEnrollments(id)
    }
  } catch (error) {
    console.error('Error fetching workflow:', error)
  }

  if (!workflow) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/workflows">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{workflow.metadata.name}</h1>
        {workflow.metadata.description && (
          <p className="text-gray-600 mt-2">{workflow.metadata.description}</p>
        )}
      </div>

      <WorkflowDetails workflow={workflow} enrollments={enrollments} />
    </div>
  )
}