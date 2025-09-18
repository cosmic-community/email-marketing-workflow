import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import CreateWorkflowForm from '@/components/CreateWorkflowForm'
import { getEmailTemplates, getEmailLists } from '@/lib/cosmic'

export const dynamic = 'force-dynamic'

export default async function NewWorkflowPage() {
  let templates = []
  let lists = []

  try {
    templates = await getEmailTemplates()
    lists = await getEmailLists()
  } catch (error) {
    console.error('Error fetching data:', error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/workflows">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Workflow</h1>
        <p className="text-gray-600 mt-2">
          Set up automated email sequences to nurture your contacts
        </p>
      </div>

      <CreateWorkflowForm templates={templates} lists={lists} />
    </div>
  )
}