import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import WorkflowsList from '@/components/WorkflowsList'
import { getEmailWorkflows } from '@/lib/cosmic'

function WorkflowsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="border rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

async function WorkflowsContent() {
  try {
    const workflows = await getEmailWorkflows()
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Workflows</h1>
            <p className="text-gray-600 mt-1">
              Automate your email sequences and nurture campaigns
            </p>
          </div>
          <Link href="/workflows/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </Link>
        </div>

        <WorkflowsList workflows={workflows} />
      </div>
    )
  } catch (error) {
    console.error('Error loading workflows:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load workflows
          </h2>
          <p className="text-gray-600 mb-4">
            There was an error loading your workflows. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<WorkflowsPageSkeleton />}>
      <WorkflowsContent />
    </Suspense>
  )
}