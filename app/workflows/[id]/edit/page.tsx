// app/workflows/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { getEmailWorkflow, getEmailTemplates, getEmailLists } from '@/lib/cosmic'
import EditWorkflowForm from '@/components/EditWorkflowForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const { id } = await params
  
  let workflow = null
  let templates = []
  let lists = []

  try {
    workflow = await getEmailWorkflow(id)
    templates = await getEmailTemplates()
    lists = await getEmailLists()
  } catch (error) {
    console.error('Error fetching data:', error)
  }

  if (!workflow) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/workflows/${id}`}>
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflow
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Workflow</h1>
        <p className="text-gray-600 mt-2">
          Update your automated email sequence
        </p>
      </div>

      <EditWorkflowForm workflow={workflow} templates={templates} lists={lists} />
    </div>
  )
}