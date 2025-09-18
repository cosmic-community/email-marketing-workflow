import { Suspense } from 'react'
import { WorkflowsList } from '@/components/WorkflowsList'
import { Button } from '@/components/ui/button'
import { Plus, Workflow } from 'lucide-react'
import Link from 'next/link'

export default function WorkflowsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Workflow className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Workflows</h1>
            <p className="text-gray-600">Automate multi-step email sequences with customizable timing</p>
          </div>
        </div>
        <Link href="/workflows/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Workflow
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading workflows...</div>}>
        <WorkflowsList />
      </Suspense>
    </div>
  )
}