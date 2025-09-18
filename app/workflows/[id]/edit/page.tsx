// app/workflows/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { getEmailWorkflow, getEmailTemplates } from '@/lib/cosmic'
import EditWorkflowForm from '@/components/EditWorkflowForm'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  // CRITICAL: In Next.js 15+, params are now Promises and MUST be awaited
  const { id } = await params

  const [workflow, templates] = await Promise.all([
    getEmailWorkflow(id),
    getEmailTemplates()
  ])

  if (!workflow) {
    notFound()
  }

  const handleSave = () => {
    // This will be handled by the form component
    console.log('Workflow saved')
  }

  const handleCancel = () => {
    // This will be handled by the form component
    console.log('Edit cancelled')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href={`/workflows/${id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Workflow
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Edit Workflow
                </h1>
                <p className="text-gray-600 mt-1">
                  Modify your email automation workflow
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EditWorkflowForm
          workflow={workflow}
          templates={templates}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </main>
    </div>
  )
}