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
  Users, 
  Mail, 
  Clock, 
  TrendingUp,
  Plus,
  Settings,
  Eye
} from 'lucide-react'
import { EmailWorkflow, WorkflowEnrollment } from '@/types'
import EditWorkflowForm from './EditWorkflowForm'
import ContactEnrollmentModal from './ContactEnrollmentModal'
import ConfirmationModal from '@/components/ConfirmationModal'

interface WorkflowDetailsProps {
  workflow: EmailWorkflow
  enrollments: WorkflowEnrollment[]
}

export default function WorkflowDetails({ workflow, enrollments }: WorkflowDetailsProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showEnrollment, setShowEnrollment] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: 'Active' | 'Paused' | 'Draft') => {
    setActionLoading('status')
    try {
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
      console.error('Error updating workflow status:', error)
      alert('Failed to update workflow status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = async () => {
    setActionLoading('duplicate')
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
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    setActionLoading('delete')
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
      setActionLoading(null)
    }
  }

  const formatDelay = (days: number, hours: number, minutes: number) => {
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    return parts.join(' ') || '0m'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerDescription = () => {
    const { trigger_type, trigger_lists, trigger_tags, trigger_date } = workflow.metadata
    
    switch (trigger_type.value) {
      case 'Manual':
        return 'Manually triggered for selected contacts'
      case 'List Subscribe':
        return `Triggered when contacts join: ${trigger_lists?.join(', ') || 'No lists selected'}`
      case 'Tag Added':
        return `Triggered when contacts get tags: ${trigger_tags?.join(', ') || 'No tags selected'}`
      case 'Date Based':
        return `Triggered on: ${trigger_date || 'No date set'}`
      default:
        return 'Unknown trigger type'
    }
  }

  const activeEnrollments = enrollments.filter(e => e.metadata.status.value === 'Active').length
  const completedEnrollments = enrollments.filter(e => e.metadata.status.value === 'Completed').length

  if (isEditing) {
    return (
      <EditWorkflowForm 
        workflow={workflow}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => {
          setIsEditing(false)
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{workflow.metadata.name}</h1>
          <p className="text-gray-600 mt-2">{workflow.metadata.description || 'No description provided'}</p>
          <div className="flex items-center space-x-4 mt-4">
            <Badge className={getStatusColor(workflow.metadata.status.value)}>
              {workflow.metadata.status.value}
            </Badge>
            <Badge variant="outline">
              {workflow.metadata.trigger_type.value}
            </Badge>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {workflow.metadata.status.value === 'Draft' && (
            <Button 
              onClick={() => handleStatusChange('Active')}
              disabled={actionLoading === 'status'}
            >
              <Play className="w-4 h-4 mr-2" />
              Activate
            </Button>
          )}
          
          {workflow.metadata.status.value === 'Active' && (
            <Button 
              variant="outline"
              onClick={() => handleStatusChange('Paused')}
              disabled={actionLoading === 'status'}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          {workflow.metadata.trigger_type.value === 'Manual' && workflow.metadata.status.value === 'Active' && (
            <Button onClick={() => setShowEnrollment(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Enroll Contacts
            </Button>
          )}
          
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleDuplicate}
            disabled={actionLoading === 'duplicate'}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
          
          <ConfirmationModal
            title="Delete Workflow"
            description={`Are you sure you want to delete "${workflow.metadata.name}"? This action cannot be undone and will remove all enrollments.`}
            onConfirm={handleDelete}
            trigger={
              <Button 
                variant="outline" 
                className="text-red-600 hover:text-red-700"
                disabled={actionLoading === 'delete'}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflow.metadata.stats?.total_enrolled || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEnrollments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflow.metadata.stats?.total_emails_sent || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Steps ({workflow.metadata.steps.length})</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments ({enrollments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Trigger</h4>
                <p className="text-gray-600">{getTriggerDescription()}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Steps</h4>
                <p className="text-gray-600">
                  {workflow.metadata.steps.length} email{workflow.metadata.steps.length !== 1 ? 's' : ''} configured
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                <p className="text-gray-600">
                  {workflow.metadata.status.value === 'Active' && 'Workflow is active and processing enrollments'}
                  {workflow.metadata.status.value === 'Draft' && 'Workflow is in draft mode and not processing enrollments'}
                  {workflow.metadata.status.value === 'Paused' && 'Workflow is paused and not processing new enrollments'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <div className="space-y-4">
            {workflow.metadata.steps.map((step, index) => (
              <Card key={step.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                          {step.step_number}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">
                          Step {step.step_number}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Template: {step.template?.title || `Template ID: ${step.template_id}`}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Delay: {formatDelay(step.delay_days, step.delay_hours, step.delay_minutes)}
                          {index === 0 && ' (after enrollment)'}
                          {index > 0 && ' (after previous step)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={step.active ? "default" : "secondary"}>
                        {step.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-6">
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No enrollments yet</h3>
                  <p className="mt-2 text-gray-600">
                    {workflow.metadata.trigger_type.value === 'Manual' 
                      ? 'Use the "Enroll Contacts" button to manually add contacts to this workflow.'
                      : 'Contacts will be automatically enrolled when they meet the trigger criteria.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Contact ID: {enrollment.metadata.contact_id}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Current Step: {enrollment.metadata.current_step} of {workflow.metadata.steps.length}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Enrolled: {new Date(enrollment.metadata.enrolled_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(enrollment.metadata.status.value)}>
                          {enrollment.metadata.status.value}
                        </Badge>
                        {enrollment.metadata.next_send_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Next: {new Date(enrollment.metadata.next_send_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact Enrollment Modal */}
      {showEnrollment && (
        <ContactEnrollmentModal
          workflow={workflow}
          onClose={() => setShowEnrollment(false)}
          onEnrollmentComplete={() => {
            setShowEnrollment(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}