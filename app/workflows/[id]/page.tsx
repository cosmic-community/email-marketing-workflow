// app/workflows/[id]/page.tsx
import { notFound } from 'next/navigation'
import WorkflowDetails from '@/components/WorkflowDetails'
import { getEmailWorkflow } from '@/lib/cosmic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: PageProps) {
  const { id } = await params
  
  try {
    const workflow = await getEmailWorkflow(id)
    
    if (!workflow) {
      notFound()
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <WorkflowDetails workflow={workflow} />
      </div>
    )
  } catch (error) {
    console.error('Error loading workflow:', error)
    notFound()
  }
}