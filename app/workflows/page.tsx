import { getEmailWorkflows } from '@/lib/cosmic'
import WorkflowsList from '@/components/WorkflowsList'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WorkflowsPage() {
  let workflows = []
  
  try {
    workflows = await getEmailWorkflows()
  } catch (error) {
    console.error('Error fetching workflows:', error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Workflows</h1>
          <p className="text-gray-600 mt-2">
            Automate your email marketing with multi-step workflows
          </p>
        </div>
        <Link href="/workflows/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </Link>
      </div>

      <WorkflowsList workflows={workflows} />
    </div>
  )
}