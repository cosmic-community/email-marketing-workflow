// app/workflows/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getEmailWorkflow, getEmailTemplates } from '@/lib/cosmic'
import WorkflowDetails from '@/components/WorkflowDetails'

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  // IMPORTANT: In Next.js 15+, params are now Promises and MUST be awaited
  const { id } = await params
  
  const [workflow, templates] = await Promise.all([
    getEmailWorkflow(id),
    getEmailTemplates()
  ])

  if (!workflow) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <WorkflowDetails workflow={workflow} templates={templates} />
    </div>
  )
}