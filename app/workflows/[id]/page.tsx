// app/workflows/[id]/page.tsx
import { getEmailWorkflow, getWorkflowEnrollments } from '@/lib/cosmic'
import { notFound } from 'next/navigation'
import WorkflowDetails from '@/components/WorkflowDetails'
import { WorkflowEnrollment } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = await params
  
  const workflow = await getEmailWorkflow(id)
  
  if (!workflow) {
    notFound()
  }

  // Fetch enrollments with proper typing
  let enrollments: WorkflowEnrollment[] = []

  try {
    enrollments = await getWorkflowEnrollments(id)
  } catch (error) {
    console.error('Error fetching workflow enrollments:', error)
    // Continue with empty array - component will handle gracefully
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {workflow.metadata.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Email workflow details and enrollment status
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WorkflowDetails workflow={workflow} enrollments={enrollments} />
      </main>
    </div>
  )
}