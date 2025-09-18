// app/workflows/[id]/page.tsx
import { getEmailWorkflow, getWorkflowEnrollments } from '@/lib/cosmic'
import { WorkflowDetails } from '@/components/WorkflowDetails'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = await params
  
  const workflow = await getEmailWorkflow(id)
  
  if (!workflow) {
    notFound()
  }

  const enrollments = await getWorkflowEnrollments(id)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/workflows" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workflows
        </Link>
      </div>

      <WorkflowDetails workflow={workflow} enrollments={enrollments} />
    </div>
  )
}