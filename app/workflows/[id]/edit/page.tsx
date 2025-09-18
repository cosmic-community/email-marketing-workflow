// app/workflows/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { getEmailWorkflow, getEmailTemplates } from '@/lib/cosmic'
import EditWorkflowForm from '@/components/EditWorkflowForm'
import { EmailWorkflow, EmailTemplate } from '@/types'

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const { id } = await params
  
  const [workflow, templates] = await Promise.all([
    getEmailWorkflow(id),
    getEmailTemplates()
  ])

  if (!workflow) {
    notFound()
  }

  const handleSave = () => {
    // This will be handled by the form component itself via router.push
  }

  const handleCancel = () => {
    // This will be handled by the form component itself via router.push
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Workflow</h1>
          <p className="text-gray-600 mt-1">
            Modify your automated email sequence
          </p>
        </div>
      </div>

      <EditWorkflowForm 
        workflow={workflow} 
        templates={templates}
      />
    </div>
  )
}