// app/workflows/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getEmailWorkflow } from '@/lib/cosmic'
import EditWorkflowForm from '@/components/EditWorkflowForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditWorkflowPage({ params }: PageProps) {
  // CRITICAL: In Next.js 15+, params are now Promises and MUST be awaited
  const { id } = await params
  
  try {
    const workflow = await getEmailWorkflow(id)
    
    if (!workflow) {
      notFound()
    }

    const handleCancel = () => {
      redirect(`/workflows/${id}`)
    }

    const handleSave = () => {
      redirect(`/workflows/${id}`)
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Workflow</h1>
          <p className="text-gray-600">Update your email workflow settings and steps</p>
        </div>
        
        <EditWorkflowForm 
          workflow={workflow}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading workflow:', error)
    notFound()
  }
}