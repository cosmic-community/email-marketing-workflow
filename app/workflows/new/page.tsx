import { getEmailTemplates, getEmailLists } from '@/lib/cosmic'
import CreateWorkflowForm from '@/components/CreateWorkflowForm'
import { EmailTemplate, EmailList } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewWorkflowPage() {
  // Fetch templates and lists with proper typing
  let templates: EmailTemplate[] = []
  let lists: EmailList[] = []

  try {
    templates = await getEmailTemplates()
    lists = await getEmailLists()
  } catch (error) {
    console.error('Error fetching templates or lists:', error)
    // Continue with empty arrays - components will handle gracefully
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Workflow
            </h1>
            <p className="text-gray-600 mt-1">
              Set up an automated email sequence
            </p>
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