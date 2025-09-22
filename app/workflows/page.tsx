import { getEmailWorkflows } from '@/lib/cosmic'
import WorkflowsList from '@/components/WorkflowsList'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { EmailWorkflow } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WorkflowsPage() {
  // Fetch workflows with proper typing
  let workflows: EmailWorkflow[] = []

  try {
    workflows = await getEmailWorkflows()
  } catch (error) {
    console.error('Error fetching workflows:', error)
    // Continue with empty array - component will handle gracefully
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Email Workflows
              </h1>
              <p className="text-gray-600 mt-1">
                Create automated email sequences ({workflows.length} total)
              </p>
            </div>
            <Link href="/workflows/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WorkflowsList workflows={workflows} />
      </main>
    </div>
  )
}