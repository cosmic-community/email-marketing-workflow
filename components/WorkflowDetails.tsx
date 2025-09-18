'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EmailWorkflow, WorkflowEnrollment, EmailContact } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Edit, 
  Play, 
  Pause, 
  Users, 
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  Calendar,
  Target,
  TrendingUp,
  UserPlus
} from 'lucide-react'
import TimeAgo from './TimeAgo'
import ContactEnrollmentModal from './ContactEnrollmentModal'

interface WorkflowDetailsProps {
  workflow: EmailWorkflow
  enrollments: WorkflowEnrollment[]
}

export default function WorkflowDetails({ workflow, enrollments }: WorkflowDetailsProps) {
  const [showEnrollModal, setShowEnrollModal] = useState(false)

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

  const handleStatusToggle = async () => {
    const newStatus = workflow.metadata.status.value === 'Active' ? 'Paused' : 'Active'
    
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow status')
      }

      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error('Error updating workflow status:', error)
      alert('Failed to update workflow status. Please try again.')
    }
  }

  const activeEnrollments = enrollments.filter(e => e.metadata.status.value === 'Active')
  const completedEnrollments = enrollments.filter(e => e.metadata.status.value === 'Completed')
  const completionRate = enrollments.length > 0 
    ? Math.round((completedEnrollments.length / enrollments.length) * 100) 
    : 0

  return (
    <>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href={`/workflows/${workflow.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Workflow
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleStatusToggle}
            className={workflow.metadata.status.value === 'Active' ? 'text-yellow-600' : 'text-green-600'}
          >
            {workflow.metadata.status.value === 'Active' ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Workflow
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Activate Workflow
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowEnrollModal(true)}
            disabled={workflow.metadata.status.value !== 'Active'}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Enroll Contacts
          </Button>
        </div>

        {/* Status and Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enrollments.length}</p>
                  <p className="text-sm text-gray-600">Total Enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedEnrollments.length}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completionRate}%</p>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-4">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{workflow.metadata.stats?.total_emails_sent || 0}</p>
                  <p className="text-sm text-gray-600">Emails Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="steps">Workflow Steps</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workflow Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(workflow.metadata.status.value)}>
                        {workflow.metadata.status.value}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Trigger Type</label>
                    <div className="mt-1 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{workflow.metadata.trigger_type.value}</span>
                    </div>
                  </div>

                  {workflow.metadata.trigger_lists && workflow.metadata.trigger_lists.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Trigger Lists</label>
                      <div className="mt-1">
                        <span className="text-sm">{workflow.metadata.trigger_lists.join(', ')}</span>
                      </div>
                    </div>
                  )}

                  {workflow.metadata.trigger_tags && workflow.metadata.trigger_tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Trigger Tags</label>
                      <div className="mt-1">
                        <span className="text-sm">{workflow.metadata.trigger_tags.join(', ')}</span>
                      </div>
                    </div>
                  )}

                  {workflow.metadata.trigger_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Trigger Date</label>
                      <div className="mt-1 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{workflow.metadata.trigger_date}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <div className="mt-1 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      <TimeAgo date={workflow.created_at} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Modified</label>
                    <div className="mt-1 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      <TimeAgo date={workflow.metadata.last_modified} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Enrollments</CardTitle>
                </CardHeader>
                <CardContent>
                  {enrollments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No enrollments yet</p>
                  ) : (
                    <div className="space-y-3">
                      {enrollments.slice(0, 5).map((enrollment) => (
                        <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Contact {enrollment.metadata.contact_id}</p>
                              <p className="text-xs text-gray-500">
                                Step {enrollment.metadata.current_step} of {workflow.metadata.steps.length}
                              </p>
                            </div>
                          </div>
                          <Badge className={getEnrollmentStatusColor(enrollment.metadata.status.value)}>
                            {enrollment.metadata.status.value}
                          </Badge>
                        </div>
                      ))}
                      {enrollments.length > 5 && (
                        <p className="text-center text-sm text-gray-500">
                          And {enrollments.length - 5} more...
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="steps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Steps ({workflow.metadata.steps.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflow.metadata.steps.map((step, index) => (
                    <div key={step.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{step.step_number}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Step {step.step_number}</h4>
                          <Badge variant={step.active ? 'default' : 'secondary'}>
                            {step.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Template: {step.template_id}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Delay: {step.delay_days}d {step.delay_hours}h {step.delay_minutes}m
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Enrollments ({enrollments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No contacts enrolled yet</p>
                    <Button 
                      onClick={() => setShowEnrollModal(true)}
                      className="mt-4"
                      disabled={workflow.metadata.status.value !== 'Active'}
                    >
                      Enroll First Contact
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">Contact {enrollment.metadata.contact_id}</p>
                            <p className="text-sm text-gray-500">
                              Enrolled <TimeAgo date={enrollment.metadata.enrolled_date} />
                            </p>
                            <p className="text-sm text-gray-500">
                              Current step: {enrollment.metadata.current_step} of {workflow.metadata.steps.length}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className={getEnrollmentStatusColor(enrollment.metadata.status.value)}>
                            {enrollment.metadata.status.value}
                          </Badge>
                          {enrollment.metadata.next_send_date && (
                            <p className="text-xs text-gray-500">
                              Next: <TimeAgo date={enrollment.metadata.next_send_date} />
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ContactEnrollmentModal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        workflowId={workflow.id}
        workflowName={workflow.metadata.name}
      />
    </>
  )
}