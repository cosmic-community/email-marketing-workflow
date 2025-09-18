'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Play, 
  Pause, 
  Users, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Copy,
  Trash2,
  UserPlus,
  Filter,
  RefreshCw,
  Loader2,
  Eye,
  Calendar
} from 'lucide-react'
import { EmailWorkflow, WorkflowEnrollment, EmailContact } from '@/types'
import ContactEnrollmentModal from '@/components/ContactEnrollmentModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import TimeAgo from '@/components/TimeAgo'

interface WorkflowDetailsProps {
  workflow: EmailWorkflow
}

export default function WorkflowDetails({ workflow }: WorkflowDetailsProps) {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<WorkflowEnrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch enrollments
  useEffect(() => {
    fetchEnrollments()
  }, [workflow.id])

  const fetchEnrollments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/workflows/${workflow.id}/enrollments`)
      
      if (response.ok) {
        const result = await response.json()
        setEnrollments(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter enrollments based on status
  const filteredEnrollments = enrollments.filter(enrollment => {
    if (statusFilter === 'all') return true
    return enrollment.metadata.status.key === statusFilter
  })

  // Calculate stats
  const stats = {
    totalEnrolled: enrollments.length,
    active: enrollments.filter(e => e.metadata.status.key === 'active').length,
    completed: enrollments.filter(e => e.metadata.status.key === 'completed').length,
    failed: enrollments.filter(e => e.metadata.status.key === 'failed').length,
    unsubscribed: enrollments.filter(e => e.metadata.status.key === 'unsubscribed').length,
    completionRate: enrollments.length > 0 
      ? `${Math.round((enrollments.filter(e => e.metadata.status.key === 'completed').length / enrollments.length) * 100)}%`
      : '0%'
  }

  const handleStatusChange = async (newStatus: 'Draft' | 'Active' | 'Paused' | 'Completed') => {
    setActionLoading('status')
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus
        })
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
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    setActionLoading('delete')
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'DELETE'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Paused': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'unsubscribed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEnrollmentComplete = () => {
    fetchEnrollments() // Refresh the enrollments
    setShowEnrollmentModal(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{workflow.metadata.name}</h1>
          {workflow.metadata.description && (
            <p className="text-gray-600 mt-2">{workflow.metadata.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <Badge className={getStatusColor(workflow.metadata.status.value)}>
              {workflow.metadata.status.value}
            </Badge>
            <span className="text-sm text-gray-500">
              Trigger: {workflow.metadata.trigger_type.value}
            </span>
            <span className="text-sm text-gray-500">
              {workflow.metadata.steps.length} steps
            </span>
            <span className="text-sm text-gray-500">
              Updated <TimeAgo date={workflow.metadata.last_modified} />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {workflow.metadata.status.value === 'Draft' && (
            <Button
              onClick={() => handleStatusChange('Active')}
              disabled={actionLoading === 'status'}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading === 'status' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Activate
            </Button>
          )}
          
          {workflow.metadata.status.value === 'Active' && (
            <Button
              onClick={() => handleStatusChange('Paused')}
              disabled={actionLoading === 'status'}
              variant="outline"
            >
              {actionLoading === 'status' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Pause className="w-4 h-4 mr-2" />
              )}
              Pause
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => router.push(`/workflows/${workflow.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>

          <Button
            variant="outline"
            onClick={handleDuplicate}
            disabled={actionLoading === 'duplicate'}
          >
            {actionLoading === 'duplicate' ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Duplicate
          </Button>

          <ConfirmationModal
            title="Delete Workflow"
            description="Are you sure you want to delete this workflow? This will also remove all enrollments. This action cannot be undone."
            onConfirm={handleDelete}
            trigger={
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={actionLoading === 'delete'}
              >
                {actionLoading === 'delete' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEnrolled}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Play className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completionRate}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="steps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="steps">Workflow Steps</TabsTrigger>
          <TabsTrigger value="enrollments">
            Enrollments ({enrollments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Steps</CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.metadata.steps.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No steps configured</h3>
                  <p className="mb-4">Add steps to define your workflow automation.</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/workflows/${workflow.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Configure Steps
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflow.metadata.steps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold flex-shrink-0">
                          {step.step_number}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              Step {step.step_number}
                              {!step.active && (
                                <Badge variant="secondary" className="ml-2">Inactive</Badge>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              {step.delay_days}d {step.delay_hours}h {step.delay_minutes}m delay
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <p>Template ID: {step.template_id}</p>
                            {step.template && (
                              <div className="mt-1">
                                <p className="font-medium">{step.template.metadata.name}</p>
                                <p className="text-xs text-gray-500">
                                  Subject: {step.template.metadata.subject}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Enrollments</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchEnrollments}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => setShowEnrollmentModal(true)}
                    size="sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enroll Contacts
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEnrollments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">
                    {statusFilter === 'all' ? 'No enrollments yet' : `No ${statusFilter} enrollments`}
                  </h3>
                  <p className="mb-4">
                    {statusFilter === 'all'
                      ? 'Start by enrolling contacts in this workflow.'
                      : 'Try changing the status filter to see other enrollments.'
                    }
                  </p>
                  {statusFilter === 'all' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowEnrollmentModal(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Enroll Contacts
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Contact ID: {enrollment.metadata.contact_id}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>Step {enrollment.metadata.current_step}</span>
                            <span>Enrolled <TimeAgo date={enrollment.metadata.enrolled_date} /></span>
                            {enrollment.metadata.next_send_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Next: {new Date(enrollment.metadata.next_send_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Badge className={getEnrollmentStatusColor(enrollment.metadata.status.key)}>
                          {enrollment.metadata.status.value}
                        </Badge>
                      </div>
                      
                      {enrollment.metadata.step_history.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Step History</h5>
                          <div className="space-y-1">
                            {enrollment.metadata.step_history.map((history, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Step {history.step_number}</span>
                                <span>•</span>
                                <span>{history.status}</span>
                                <span>•</span>
                                <span>{new Date(history.sent_date).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Enrollment Modal */}
      <ContactEnrollmentModal
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        workflowId={workflow.id}
        workflowName={workflow.metadata.name}
        onEnrollmentComplete={handleEnrollmentComplete}
      />
    </div>
  )
}