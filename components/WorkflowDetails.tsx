'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash2, 
  Plus, 
  Users, 
  Clock, 
  Mail,
  ArrowLeft,
  Activity,
  Target,
  Calendar,
  Settings,
  BarChart3,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { EmailWorkflow, EmailTemplate, WorkflowEnrollment } from '@/types'
import EditWorkflowForm from '@/components/EditWorkflowForm'
import { ContactEnrollmentModal } from '@/components/ContactEnrollmentModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import TimeAgo from '@/components/TimeAgo'

interface WorkflowDetailsProps {
  workflow: EmailWorkflow
  templates: EmailTemplate[]
}

export default function WorkflowDetails({ workflow, templates }: WorkflowDetailsProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [enrollments, setEnrollments] = useState<WorkflowEnrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)

  // Fetch enrollments
  const fetchEnrollments = async () => {
    setLoadingEnrollments(true)
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/enrollments`)
      if (response.ok) {
        const result = await response.json()
        setEnrollments(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setLoadingEnrollments(false)
    }
  }

  const handleToggleStatus = async () => {
    setIsToggling(true)
    try {
      const newStatus = workflow.metadata.status.value === 'Active' ? 'Paused' : 'Active'
      
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow status')
      }

      router.refresh()
    } catch (error) {
      console.error('Error toggling workflow status:', error)
      alert('Failed to update workflow status')
    } finally {
      setIsToggling(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate workflow')
      }

      const result = await response.json()
      router.push(`/workflows/${result.data.id}`)
    } catch (error) {
      console.error('Error duplicating workflow:', error)
      alert('Failed to duplicate workflow')
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete workflow')
      }

      router.push('/workflows')
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete workflow')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'Completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'List Subscribe':
        return <UserPlus className="w-4 h-4" />
      case 'Tag Added':
        return <Target className="w-4 h-4" />
      case 'Date Based':
        return <Calendar className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const formatDelayText = (days: number, hours: number, minutes: number) => {
    const parts = []
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
    return parts.length > 0 ? parts.join(', ') : 'Immediate'
  }

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template?.metadata.name || 'Template Not Found'
  }

  const getStepStatus = (stepNumber: number, enrollment: WorkflowEnrollment) => {
    const stepHistory = enrollment.metadata.step_history || []
    const stepRecord = stepHistory.find(s => s.step_number === stepNumber)
    
    if (stepRecord) {
      return stepRecord.status
    }
    
    if (enrollment.metadata.current_step > stepNumber) {
      return 'Completed'
    }
    
    if (enrollment.metadata.current_step === stepNumber) {
      return 'Current'
    }
    
    return 'Pending'
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'Sent':
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Current':
        return 'bg-blue-100 text-blue-800'
      case 'Failed':
        return 'bg-red-100 text-red-800'
      case 'Skipped':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EditWorkflowForm 
          workflow={workflow} 
          templates={templates}
          onClose={() => setIsEditing(false)} 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/workflows')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workflows
              </Button>
              
              <div className="border-l border-gray-300 h-6"></div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-blue-600" />
                  {workflow.metadata.name}
                  <Badge className={getStatusColor(workflow.metadata.status.value)}>
                    {workflow.metadata.status.value}
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">
                  {workflow.metadata.description || 'No description provided'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEnrollmentModal(true)}
                className="flex items-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll Contact
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={isToggling}
                className="flex items-center"
              >
                {isToggling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : workflow.metadata.status.value === 'Active' ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {workflow.metadata.status.value === 'Active' ? 'Pause' : 'Activate'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="flex items-center"
              >
                {isDuplicating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Duplicate
              </Button>
              
              <ConfirmationModal
                title="Delete Workflow"
                description={`Are you sure you want to delete "${workflow.metadata.name}"? This will also remove all enrollments. This action cannot be undone.`}
                onConfirm={handleDelete}
                confirmText="Delete Workflow"
                variant="destructive"
                isLoading={isDeleting}
                trigger={
                  <Button
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="enrollments" onClick={() => !enrollments.length && fetchEnrollments()}>
              Enrollments
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Workflow Configuration */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Trigger Type</label>
                        <div className="flex items-center gap-2 mt-1">
                          {getTriggerIcon(workflow.metadata.trigger_type.value)}
                          <span className="text-sm text-gray-900">
                            {workflow.metadata.trigger_type.value}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Steps</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {workflow.metadata.steps.length} step{workflow.metadata.steps.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {workflow.metadata.trigger_lists && workflow.metadata.trigger_lists.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Trigger Lists</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {workflow.metadata.trigger_lists.map((listId, index) => (
                            <Badge key={index} variant="outline">
                              List: {listId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {workflow.metadata.trigger_tags && workflow.metadata.trigger_tags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Trigger Tags</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {workflow.metadata.trigger_tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {workflow.metadata.trigger_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Trigger Date</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(workflow.metadata.trigger_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(workflow.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Modified</label>
                        <p className="text-sm text-gray-900 mt-1">
                          <TimeAgo date={workflow.metadata.last_modified} />
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Statistics */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Enrolled</span>
                        <span className="text-sm font-medium">
                          {workflow.metadata.stats?.total_enrolled || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed</span>
                        <span className="text-sm font-medium">
                          {workflow.metadata.stats?.total_completed || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="text-sm font-medium">
                          {workflow.metadata.stats?.completion_rate || '0%'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Emails Sent</span>
                        <span className="text-sm font-medium">
                          {workflow.metadata.stats?.total_emails_sent || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Steps Tab */}
          <TabsContent value="steps">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Workflow Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflow.metadata.steps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Step {step.step_number}</Badge>
                          <h3 className="font-medium">{getTemplateName(step.template_id)}</h3>
                          {!step.active && (
                            <Badge variant="outline" className="text-yellow-600">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Delay: {formatDelayText(step.delay_days, step.delay_hours, step.delay_minutes)}
                        </div>
                      </div>
                      
                      {step.template && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-3">
                          <div className="text-sm">
                            <div className="font-medium mb-1">Subject: {step.template.metadata.subject}</div>
                            <div className="text-gray-600">
                              Type: {step.template.metadata.template_type.value}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enrollments Tab */}
          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Contact Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEnrollments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Loading enrollments...</span>
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No contacts enrolled yet</p>
                    <Button onClick={() => setShowEnrollmentModal(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Enroll First Contact
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Current Step
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Enrolled Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Next Send
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {enrollments.map((enrollment) => (
                          <tr key={enrollment.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.metadata.contact?.metadata.first_name}{' '}
                                {enrollment.metadata.contact?.metadata.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {enrollment.metadata.contact?.metadata.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusColor(enrollment.metadata.status.value)}>
                                {enrollment.metadata.status.value}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Step {enrollment.metadata.current_step}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(enrollment.metadata.enrolled_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {enrollment.metadata.next_send_date 
                                ? new Date(enrollment.metadata.next_send_date).toLocaleDateString()
                                : '-'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Detailed analytics coming soon</p>
                  <p className="text-sm text-gray-400">
                    Track open rates, click rates, and conversion metrics for each step
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Contact Enrollment Modal */}
      <ContactEnrollmentModal
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        workflowId={workflow.id}
        workflowName={workflow.metadata.name}
        onEnrollmentComplete={() => {
          fetchEnrollments()
          router.refresh()
        }}
      />
    </div>
  )
}