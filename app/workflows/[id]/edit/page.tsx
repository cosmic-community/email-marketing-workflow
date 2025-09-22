// app/workflows/[id]/edit/page.tsx
import { getEmailWorkflow, getEmailTemplates, getEmailLists } from '@/lib/cosmic'
import { notFound } from 'next/navigation'
import EditWorkflowForm from '@/components/EditWorkflowForm'
import { EmailTemplate, EmailList } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const { id } = await params
  
  const workflow = await getEmailWorkflow(id)
  
  if (!workflow) {
    notFound()
  }

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
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Workflow
              </h1>
            </div>
            <p className="text-gray-600 mt-1">
              Modify your email automation sequence
            </p>
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