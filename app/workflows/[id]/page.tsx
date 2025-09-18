// app/workflows/[id]/page.tsx
import { getEmailWorkflow, getEmailTemplates } from '@/lib/cosmic'
import { notFound } from 'next/navigation'
import WorkflowDetails from '@/components/WorkflowDetails'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = await params
  
  const [workflow, templates] = await Promise.all([
    getEmailWorkflow(id),
    getEmailTemplates()
  ])

  if (!workflow) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WorkflowDetails workflow={workflow} templates={templates} />
    </div>
  )
}