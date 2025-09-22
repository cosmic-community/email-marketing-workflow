// app/workflows/[id]/edit/page.tsx
import { getEmailWorkflow, getEmailTemplates, getEmailLists } from '@/lib/cosmic'
import EditWorkflowForm from '@/components/EditWorkflowForm'
import { notFound } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const { id } = await params
  
  // Fetch workflow, templates, and lists in parallel
  const [workflow, templates, lists] = await Promise.all([
    getEmailWorkflow(id),
    getEmailTemplates(),
    getEmailLists()
  ])

  if (!workflow) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Workflow</h1>
              <p className="text-gray-600 mt-1">
                Modify your email automation sequence
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EditWorkflowForm 
          workflow={workflow} 
          availableTemplates={templates}
          availableLists={lists}
        />
      </main>
    </div>
  )
}