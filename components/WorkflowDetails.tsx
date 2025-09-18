'use client'

import { useState } from 'react'
import { EmailWorkflow, WorkflowEnrollment } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Settings,
  Calendar,
  Tag,
  UserPlus,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TimeAgo from '@/components/TimeAgo'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { ContactEnrollmentModal } from '@/components/ContactEnrollmentModal'

interface WorkflowDetailsProps {
  workflow: EmailWorkflow
  enrollments: WorkflowEnrollment[]
}

export function WorkflowDetails({ workflow, enrollments }: WorkflowDetailsProps) {
  const router = useRouter()
  const [actionLoading, setActionLoading] = useState(false)
  const [enrollmentModal, setEnrollmentModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  const handleStatusToggle = async () => {
    const newStatus = workflow.metadata.status.value === 'Active' ? 'Paused' : 'Active'
    
    try {
      setActionLoading(true)
      
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
      setActionLoading(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      setActionLoading(true)
      
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
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      
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
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'Completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerTypeColor = (triggerType: string) => {
    switch (triggerType) {
      case 'Manual':
        return 'bg-purple-100 text-purple-800'
      case 'List Subscribe':
        return 'bg-blue-100 text-blue-800'
      case 'Tag Added':
        return 'bg-green-100 text-green-800'
      case 'Date Based':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Failed':
        return 'bg-red-100 text-red-800'
      case 'Unsubscribed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDelay = (days: number, hours: number, minutes: number) => {
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    return parts.length > 0 ? parts.join(' ') : 'Immediate'
  }

  const activeEnrollments = enrollments.filter(e => e.metadata.status.value === 'Active')
  const completedEnrollments = enrollments.filter(e => e.metadata.status.value === 'Completed')

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{workflow.metadata.name}</h1>
                <Badge className={getStatusColor(workflow.metadata.status.value)}>
                  {workflow.metadata.status.value}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Badge variant="outline" className={getTriggerTypeColor(workflow.metadata.trigger_type.value)}>
                  {workflow.metadata.trigger_type.value}
                </Badge>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {workflow.metadata.steps.length} steps
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {enrollments.length} enrolled
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Created <TimeAgo date={workflow.created_at} />
                </span>
              </div>

              {workflow.metadata.description && (
                <p className="text-gray-600 mt-2">{workflow.metadata.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEnrollmentModal(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll Contacts
              </Button>
              
              <Button
                variant={workflow.metadata.status.value === 'Active' ? 'destructive' : 'default'}
                size="sm"
                onClick={handleStatusToggle}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : workflow.metadata.status.value === 'Active' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {workflow.metadata.status.value === 'Draft' ? 'Activate' : 'Resume'}
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" asChild>
                <Link href={`/workflows/${workflow.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                disabled={actionLoading}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModal(true)}
                className="text-red-600 hover:text-red-700"
                disabled={actionLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Enrolled</p>
                  <p className="text-3xl font-bold text-blue-600">{enrollments.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-3xl font-bold text-orange-600">{activeEnrollments.length}</p>
                </div>
                <Play className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{completedEnrollments.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {enrollments.length > 0 
                      ? Math.round((completedEnrollments.length / enrollments.length) * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="steps" className="space-y-6">
          <TabsList>
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="steps">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {workflow.metadata.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-medium">
                      {step.step_number}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Step {step.step_number}</span>
                        <Badge variant={step.active ? "default" : "secondary"} className="text-xs">
                          {step.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Template ID: {step.template_id}
                      </p>
                      <p className="text-sm text-gray-500">
                        Delay: {formatDelay(step.delay_days, step.delay_hours, step.delay_minutes)}
                      </p>
                    </div>

                    {index < workflow.metadata.steps.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <CardTitle>Contact Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments yet</h3>
                    <p className="text-gray-600 mb-4">Start by enrolling contacts into this workflow</p>
                    <Button onClick={() => setEnrollmentModal(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Enroll Contacts
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <div>
                            <p className="font-medium">Contact ID: {enrollment.metadata.contact_id}</p>
                            <p className="text-sm text-gray-600">
                              Step {enrollment.metadata.current_step} • Enrolled <TimeAgo date={enrollment.metadata.enrolled_date} />
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getEnrollmentStatusColor(enrollment.metadata.status.value)}>
                            {enrollment.metadata.status.value}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Workflow Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Trigger Configuration</h4>
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <p className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Type:</span>
                      <Badge variant="outline" className={getTriggerTypeColor(workflow.metadata.trigger_type.value)}>
                        {workflow.metadata.trigger_type.value}
                      </Badge>
                    </p>

                    {workflow.metadata.trigger_type.value === 'List Subscribe' && workflow.metadata.trigger_lists && (
                      <p className="text-sm">
                        <span className="font-medium">Lists:</span> {workflow.metadata.trigger_lists.length} selected
                      </p>
                    )}

                    {workflow.metadata.trigger_type.value === 'Tag Added' && workflow.metadata.trigger_tags && (
                      <div className="text-sm">
                        <span className="font-medium">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {workflow.metadata.trigger_tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {workflow.metadata.trigger_type.value === 'Date Based' && workflow.metadata.trigger_date && (
                      <p className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Date:</span>
                        {workflow.metadata.trigger_date}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Workflow Information</h4>
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Created:</span> {new Date(workflow.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Last Modified:</span> {new Date(workflow.metadata.last_modified).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Steps:</span> {workflow.metadata.steps.length}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Active Steps:</span> {workflow.metadata.steps.filter(s => s.active).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ContactEnrollmentModal
        isOpen={enrollmentModal}
        onClose={() => setEnrollmentModal(false)}
        workflowId={workflow.id}
        workflowName={workflow.metadata.name}
      />

      <ConfirmationModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Workflow"
        message={`Are you sure you want to delete "${workflow.metadata.name}"? This will also remove all enrollments and cannot be undone.`}
        confirmButtonText="Delete Workflow"
        isDestructive={true}
        isLoading={actionLoading}
      />
    </>
  )
}