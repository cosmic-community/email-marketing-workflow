import { CreateWorkflowForm } from '@/components/CreateWorkflowForm'
import { ArrowLeft, Workflow } from 'lucide-react'
import Link from 'next/link'

export default function NewWorkflowPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/workflows" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workflows
        </Link>
        
        <div className="flex items-center gap-3">
          <Workflow className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Workflow</h1>
            <p className="text-gray-600">Set up an automated email sequence with custom timing</p>
          </div>
        </div>
      </div>

      <CreateWorkflowForm />
    </div>
  )
}