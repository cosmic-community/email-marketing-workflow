import CreateWorkflowForm from '@/components/CreateWorkflowForm'
import { getEmailTemplates, getEmailLists } from '@/lib/cosmic'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewWorkflowPage() {
  // Fetch templates and lists for the form
  const [templates, lists] = await Promise.all([
    getEmailTemplates(),
    getEmailLists()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Workflow</h1>
              <p className="text-gray-600 mt-1">
                Build automated email sequences for your subscribers
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateWorkflowForm 
          availableTemplates={templates}
          availableLists={lists}
        />
      </main>
    </div>
  )
}