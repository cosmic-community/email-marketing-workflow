// app/workflows/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getEmailWorkflow, getEmailTemplates } from '@/lib/cosmic'
import EditWorkflowForm from '@/components/EditWorkflowForm'

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const { id } = await params
  
  try {
    const [workflow, templates] = await Promise.all([
      getEmailWorkflow(id),
      getEmailTemplates()
    ])

    if (!workflow) {
      notFound()
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Workflow</h1>
          <p className="text-gray-600 mt-1">
            Modify your automated email workflow settings and steps
          </p>
        </div>

        <EditWorkflowForm
          workflow={workflow}
          templates={templates}
          onSave={() => redirect('/workflows')}
          onCancel={() => redirect('/workflows')}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading workflow:', error)
    notFound()
  }
}