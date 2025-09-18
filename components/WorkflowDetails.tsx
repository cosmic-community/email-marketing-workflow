'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  Calendar,
  Tag,
  List as ListIcon,
  ArrowRight,
  UserPlus,
  Settings,
  BarChart3
} from 'lucide-react'
import { EmailWorkflow, EmailTemplate, WorkflowEnrollment } from '@/types'
import ConfirmationModal from '@/components/ConfirmationModal'
import EditWorkflowForm from '@/components/EditWorkflowForm'
import { ContactEnrollmentModalProps } from '@/components/ContactEnrollmentModal'
import TimeAgo from '@/components/TimeAgo'

// Create a simple ContactEnrollmentModal component since the import is missing
function ContactEnrollmentModal({ 
  workflow, 
  onClose 
}: { 
  workflow: EmailWorkflow; 
  onClose: () => void; 
}) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll Contacts</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Contact enrollment functionality will be implemented here.</p>
          <Button onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
  const [activeTab, setActiveTab] = useState('overview')
  const [showEditForm, setShowEditForm] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Calculate workflow statistics
  const stats = {
    totalEnrolled: enrollments.length,
    activeEnrollments: enrollments.filter(e => e.metadata.status.value === 'Active').length,
    completedEnrollments: enrollments.filter(e => e.metadata.status.value === 'Completed').length,
    failedEnrollments: enrollments.filter(e => e.metadata.status.value === 'Failed').length,
    completionRate: enrollments.length > 0 
      ? Math.round((enrollments.filter(e => e.metadata.status.value === 'Completed').length / enrollments.length) * 100)
      : 0
  }

  const handleStatusToggle = async () => {
    if (isUpdating) return
    
    const newStatus = workflow.metadata.status.value === 'Active' ? 'Paused' : 'Active'
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow status')
      }

      onUpdate()
    } catch (error) {
      console.error('Error updating workflow:', error)
      alert('Failed to update workflow status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDuplicate = async () => {
    if (isDuplicating) return
    
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
    if (isDeleting) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete workflow')
      }

      onDelete()
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

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template ? template.metadata.name : 'Unknown Template'
  }

  const calculateTotalDelay = (step: any) => {
    const totalMinutes = (step.delay_days * 24 * 60) + (step.delay_hours * 60) + step.delay_minutes
    
    if (totalMinutes === 0) return 'Immediately'
    
    const days = Math.floor(totalMinutes / (24 * 60))
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
    const minutes = totalMinutes % 60
    
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    
    return parts.join(' ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (showEditForm) {
    return (
      <EditWorkflowForm 
        workflow={workflow} 
        templates={templates}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {workflow.metadata.name}
            </h1>
            <Badge className={getStatusColor(workflow.metadata.status.value)}>
              {workflow.metadata.status.value}
            </Badge>
          </div>
          {workflow.metadata.description && (
            <p className="text-gray-600 max-w-2xl">
              {workflow.metadata.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
            <span>Created {formatDate(workflow.created_at)}</span>
            <span>•</span>
            <span>Last modified <TimeAgo date={workflow.metadata.last_modified} /></span>
            <span>•</span>
            <span>{workflow.metadata.steps.length} steps</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEnrollModal(true)}
            disabled={workflow.metadata.status.value !== 'Active'}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Enroll Contacts
          </Button>
          
          <Button
            variant={workflow.metadata.status.value === 'Active' ? 'outline' : 'default'}
            onClick={handleStatusToggle}
            disabled={isUpdating}
          >
            {workflow.metadata.status.value === 'Active' ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowEditForm(true)}
          >
            <Edit className="w-4 w-4 mr-2" />
            Edit
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
          
          <ConfirmationModal
            title="Delete Workflow"
            description={`Are you sure you want to delete "${workflow.metadata.name}"? This will also remove all enrollments and cannot be undone.`}
            onConfirm={handleDelete}
            confirmText="Delete"
            variant="destructive"
            isLoading={isDeleting}
            trigger={
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEnrolled}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeEnrollments}</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedEnrollments}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Trigger Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Trigger Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Trigger Type</p>
                  <p className="text-lg font-semibold">{workflow.metadata.trigger_type.value}</p>
                </div>
                
                {workflow.metadata.trigger_type.value === 'List Subscribe' && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Target Lists</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {workflow.metadata.trigger_lists && workflow.metadata.trigger_lists.length > 0 ? (
                        workflow.metadata.trigger_lists.map((listId, index) => (
                          <Badge key={index} variant="outline">
                            <ListIcon className="w-3 h-3 mr-1" />
                            List ID: {listId}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">No lists configured</span>
                      )}
                    </div>
                  </div>
                )}
                
                {workflow.metadata.trigger_type.value === 'Tag Added' && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Target Tags</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {workflow.metadata.trigger_tags && workflow.metadata.trigger_tags.length > 0 ? (
                        workflow.metadata.trigger_tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">No tags configured</span>
                      )}
                    </div>
                  </div>
                )}
                
                {workflow.metadata.trigger_type.value === 'Date Based' && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Trigger Date</p>
                    <p className="text-lg font-semibold">
                      {workflow.metadata.trigger_date ? (
                        formatDate(workflow.metadata.trigger_date)
                      ) : (
                        <span className="text-gray-400">No date set</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="steps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Steps ({workflow.metadata.steps.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.metadata.steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No steps configured yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflow.metadata.steps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {step.step_number}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {getTemplateName(step.template_id)}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={step.active ? 'default' : 'secondary'}>
                                {step.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Send after: {calculateTotalDelay(step)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < workflow.metadata.steps.length - 1 && (
                        <div className="flex justify-center mt-4">
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="enrollments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Enrollments ({enrollments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No contacts enrolled yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.slice(0, 10).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">Contact ID: {enrollment.metadata.contact_id}</p>
                          <p className="text-sm text-gray-600">
                            Step {enrollment.metadata.current_step} • {enrollment.metadata.status.value}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Enrolled {formatDate(enrollment.metadata.enrolled_date)}
                        </p>
                        {enrollment.metadata.next_send_date && (
                          <p className="text-xs text-gray-500">
                            Next: {formatDate(enrollment.metadata.next_send_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {enrollments.length > 10 && (
                    <div className="text-center py-4">
                      <p className="text-gray-600">
                        And {enrollments.length - 10} more enrollments...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Enrollment Modal */}
      {showEnrollModal && (
        <ContactEnrollmentModal 
          workflow={workflow} 
          onClose={() => setShowEnrollModal(false)} 
        />
      )}
    </div>
  )
}