'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  Pause, 
  Clock, 
  Mail, 
  Users, 
  TrendingUp,
  Calendar,
  Tag,
  List,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserPlus
} from 'lucide-react'
import { EmailWorkflow, EmailTemplate, WorkflowEnrollment } from '@/types'
import ConfirmationModal from '@/components/ConfirmationModal'
import ContactEnrollmentModal from '@/components/ContactEnrollmentModal'
import TimeAgo from '@/components/TimeAgo'

interface WorkflowDetailsProps {
  workflow: EmailWorkflow
  templates: EmailTemplate[]
  enrollments: WorkflowEnrollment[]
  onUpdate: () => void
  onDelete: () => void
}

export default function WorkflowDetails({ 
  workflow, 
  templates, 
  enrollments, 
  onUpdate, 
  onDelete 
}: WorkflowDetailsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)

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
      case 'Manual':
        return <UserPlus className="w-4 h-4" />
      case 'List Subscribe':
        return <List className="w-4 h-4" />
      case 'Tag Added':
        return <Tag className="w-4 h-4" />
      case 'Date Based':
        return <Calendar className="w-4 h-4" />
      default:
        return <Play className="w-4 h-4" />
    }
  }

  const formatDelay = (step: any) => {
    const parts = []
    if (step.delay_days > 0) parts.push(`${step.delay_days}d`)
    if (step.delay_hours > 0) parts.push(`${step.delay_hours}h`)  
    if (step.delay_minutes > 0) parts.push(`${step.delay_minutes}m`)
    return parts.join(' ') || '0m'
  }

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template?.metadata.name || 'Unknown Template'
  }

  const getTemplateSubject = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template?.metadata.subject || ''
  }

  const handleStatusToggle = async () => {
    setIsLoading(true)
    try {
      const newStatus = workflow.metadata.status.value === 'Active' ? 'Paused' : 'Active'
      
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow status')
      }

      router.refresh()
      onUpdate()
    } catch (error) {
      console.error('Error updating workflow status:', error)
      alert('Failed to update workflow status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/duplicate`, {
        method: 'POST'
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
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete workflow')
      }

      router.push('/workflows')
      onDelete()
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete workflow')
    } finally {
      setIsLoading(false)
    }
  }

  const activeEnrollments = enrollments.filter(e => e.metadata.status.value === 'Active')
  const completedEnrollments = enrollments.filter(e => e.metadata.status.value === 'Completed')

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(workflow.metadata.status.value)}>
            {workflow.metadata.status.value}
          </Badge>
          <div className="flex items-center space-x-2 text-gray-600">
            {getTriggerIcon(workflow.metadata.trigger_type.value)}
            <span className="text-sm">{workflow.metadata.trigger_type.value}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEnrollmentModal(true)}
            disabled={isLoading}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Enroll Contact
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleStatusToggle}
            disabled={isLoading}
          >
            {isLoading ? (
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
            onClick={handleDuplicate}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Duplicate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/workflows/${workflow.id}/edit`)}
            disabled={isLoading}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>

          <ConfirmationModal
            title="Delete Workflow"
            description={`Are you sure you want to delete "${workflow.metadata.name}"? This action cannot be undone and will remove all enrollments.`}
            onConfirm={handleDelete}
            confirmText="Delete"
            variant="destructive"
            isLoading={isLoading}
            isOpen={false}
            onOpenChange={() => {}}
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="text-red-600 hover:text-red-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Enrolled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workflow.metadata.stats?.total_enrolled || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workflow.metadata.stats?.total_completed || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workflow.metadata.stats?.completion_rate || '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {workflow.metadata.stats?.total_emails_sent || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Steps */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Workflow Steps ({workflow.metadata.steps.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.metadata.steps.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No steps configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflow.metadata.steps.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                          {step.step_number}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {getTemplateName(step.template_id)}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={step.active ? "default" : "secondary"}>
                              {step.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        
                        {getTemplateSubject(step.template_id) && (
                          <p className="text-sm text-gray-600 mt-1">
                            Subject: {getTemplateSubject(step.template_id)}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Delay: {formatDelay(step)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Workflow Info */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm font-medium">
                  <TimeAgo date={workflow.created_at} />
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Last Modified</p>
                <p className="text-sm font-medium">
                  <TimeAgo date={workflow.metadata.last_modified} />
                </p>
              </div>

              {workflow.metadata.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-sm">{workflow.metadata.description}</p>
                </div>
              )}

              {workflow.metadata.trigger_date && (
                <div>
                  <p className="text-sm text-gray-600">Trigger Date</p>
                  <p className="text-sm font-medium">
                    {new Date(workflow.metadata.trigger_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Enrollments</span>
                <Badge variant="outline">{enrollments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No enrollments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.slice(0, 5).map(enrollment => (
                    <div key={enrollment.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{enrollment.title}</p>
                        <p className="text-xs text-gray-500">
                          Step {enrollment.metadata.current_step}
                        </p>
                      </div>
                      <Badge 
                        variant={enrollment.metadata.status.value === 'Active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {enrollment.metadata.status.value}
                      </Badge>
                    </div>
                  ))}
                  
                  {enrollments.length > 5 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      And {enrollments.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Enrollment Modal */}
      <ContactEnrollmentModal
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        workflowId={workflow.id}
        workflowName={workflow.metadata.name}
      />
    </div>
  )
}