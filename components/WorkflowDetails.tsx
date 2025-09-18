'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Edit,
  Play,
  Pause,
  Copy,
  Trash2,
  Clock,
  Mail,
  Users,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Tag,
  List,
  Settings,
  Loader2
} from 'lucide-react'
import { EmailWorkflow, EmailTemplate, WorkflowEnrollment } from '@/types'
import { ContactEnrollmentModal } from '@/components/ContactEnrollmentModal'
import TimeAgo from '@/components/TimeAgo'

interface WorkflowDetailsProps {
  workflow: EmailWorkflow
  templates: EmailTemplate[]
}

interface ConfirmationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  title: string
  message: string
  confirmText: string
  isLoading: boolean
  variant?: "default" | "destructive"
}

function ConfirmationModal({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  message,
  confirmText,
  isLoading,
  variant = "default"
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function WorkflowDetails({ workflow, templates }: WorkflowDetailsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)

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
        return <Settings className="w-4 h-4" />
      case 'List Subscribe':
        return <List className="w-4 h-4" />
      case 'Tag Added':
        return <Tag className="w-4 h-4" />
      case 'Date Based':
        return <Calendar className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template ? template.metadata.name : 'Unknown Template'
  }

  const formatDelay = (days: number, hours: number, minutes: number) => {
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    return parts.join(' ') || 'Immediate'
  }

  const handleStatusToggle = async () => {
    setIsLoading(true)
    try {
      const newStatus = workflow.metadata.status.value === 'Active' ? 'Paused' : 'Active'
      
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${newStatus.toLowerCase()} workflow`)
      }

      router.refresh()
    } catch (error) {
      console.error('Error toggling workflow status:', error)
      alert(`Failed to ${workflow.metadata.status.value === 'Active' ? 'pause' : 'activate'} workflow`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate workflow')
      }

      const result = await response.json()
      setShowDuplicateModal(false)
      router.push(`/workflows/${result.data.id}`)
      router.refresh()
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
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete workflow')
      }

      setShowDeleteModal(false)
      router.push('/workflows')
      router.refresh()
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete workflow')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workflow.metadata.name}</h1>
            {workflow.metadata.description && (
              <p className="text-gray-600 mt-1">{workflow.metadata.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(workflow.metadata.status.value)}>
              {workflow.metadata.status.value}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/workflows/${workflow.id}/edit`)}
              disabled={isLoading}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant={workflow.metadata.status.value === 'Active' ? 'secondary' : 'default'}
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Enrolled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workflow.metadata.stats?.total_enrolled || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workflow.metadata.stats?.total_completed || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workflow.metadata.stats?.total_emails_sent || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workflow.metadata.stats?.completion_rate || '0%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trigger Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getTriggerIcon(workflow.metadata.trigger_type.value)}
              Trigger Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Trigger Type</p>
                <p className="text-gray-900">{workflow.metadata.trigger_type.value}</p>
              </div>
              
              {workflow.metadata.trigger_date && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Trigger Date</p>
                  <p className="text-gray-900">{new Date(workflow.metadata.trigger_date).toLocaleDateString()}</p>
                </div>
              )}

              {workflow.metadata.trigger_lists && workflow.metadata.trigger_lists.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Trigger Lists</p>
                  <div className="flex flex-wrap gap-1">
                    {workflow.metadata.trigger_lists.map((listId, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        List {listId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {workflow.metadata.trigger_tags && workflow.metadata.trigger_tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Trigger Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {workflow.metadata.trigger_tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Workflow Steps ({workflow.metadata.steps.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEnrollModal(true)}
                disabled={workflow.metadata.status.value !== 'Active'}
              >
                <Users className="w-4 h-4 mr-2" />
                Enroll Contacts
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflow.metadata.steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No steps configured yet.</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => router.push(`/workflows/${workflow.id}/edit`)}
                >
                  Add Steps
                </Button>
              </div>
            ) : (
              workflow.metadata.steps.map((step, index) => (
                <div key={step.id} className="relative">
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${step.active 
                          ? 'bg-blue-100 text-blue-600 border-2 border-blue-200' 
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                        }
                      `}>
                        {index + 1}
                      </div>
                      {index < workflow.metadata.steps.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200 mt-2" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Card className={`${step.active ? 'border-blue-200' : 'border-gray-200 opacity-60'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <h4 className="font-medium text-gray-900">
                                  {getTemplateName(step.template_id)}
                                </h4>
                                {!step.active && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>
                                  Delay: {formatDelay(step.delay_days, step.delay_hours, step.delay_minutes)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Workflow Details */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Created</p>
                <TimeAgo date={workflow.created_at} />
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Last Modified</p>
                <TimeAgo date={workflow.metadata.last_modified} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDuplicateModal(true)}
                disabled={isLoading}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Workflow
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ContactEnrollmentModal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        workflowId={workflow.id}
        workflowName={workflow.metadata.name}
      />

      <ConfirmationModal
        isOpen={showDuplicateModal}
        onOpenChange={setShowDuplicateModal}
        onConfirm={handleDuplicate}
        title="Duplicate Workflow"
        message="This will create a copy of this workflow with all steps and settings."
        confirmText="Duplicate"
        isLoading={isLoading}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        title="Delete Workflow"
        message="Are you sure you want to delete this workflow? This action cannot be undone and will remove all associated enrollments."
        confirmText="Delete"
        isLoading={isLoading}
        variant="destructive"
      />
    </>
  )
}