// app/workflows/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getEmailWorkflow, getEmailTemplates, getWorkflowEnrollments } from '@/lib/cosmic'
import WorkflowDetails from '@/components/WorkflowDetails'
import { EmailWorkflow, EmailTemplate, WorkflowEnrollment } from '@/types'

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = await params
  
  const [workflow, templates, enrollments] = await Promise.all([
    getEmailWorkflow(id),
    getEmailTemplates(),
    getWorkflowEnrollments(id)
  ])

  if (!workflow) {
    notFound()
  }

  const handleUpdate = async () => {
    // This will be handled by the component itself
  }

  const handleDelete = async () => {
    // This will be handled by the component itself  
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {workflow.metadata.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {workflow.metadata.description || 'Email workflow automation'}
          </p>
        </div>
      </div>

      <WorkflowDetails 
        workflow={workflow} 
        templates={templates}
        enrollments={enrollments}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  )
}