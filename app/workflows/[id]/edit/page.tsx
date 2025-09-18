// app/workflows/[id]/edit/page.tsx
import { getEmailWorkflow } from '@/lib/cosmic'
import { EditWorkflowForm } from '@/components/EditWorkflowForm'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const { id } = await params
  
  const workflow = await getEmailWorkflow(id)
  
  if (!workflow) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link 
          href={`/workflows/${id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workflow
        </Link>
        
        <div className="flex items-center gap-3">
          <Edit className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Workflow</h1>
            <p className="text-gray-600">Modify your email sequence and timing</p>
          </div>
        </div>
      </div>

      <EditWorkflowForm workflow={workflow} />
    </div>
  )
}