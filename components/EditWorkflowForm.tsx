'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, Trash2, Clock, Mail, ChevronUp, ChevronDown } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, CreateWorkflowStepData } from '@/types'
import ConfirmationModal from '@/components/ConfirmationModal'

export interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  templates: EmailTemplate[]
  onSave: () => void
  onCancel: () => void
}

interface WorkflowStep {
  id?: string
  template_id: string
  delay_days: number
  delay_hours: number
  delay_minutes: number
  active: boolean
}

export default function EditWorkflowForm({
  workflow,
  templates,
  onSave,
  onCancel
}: EditWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: workflow.metadata.name,
    description: workflow.metadata.description || '',
    trigger_type: workflow.metadata.trigger_type.value,
    trigger_lists: workflow.metadata.trigger_lists || [],
    trigger_tags: workflow.metadata.trigger_tags || [],
    trigger_date: workflow.metadata.trigger_date || '',
    status: workflow.metadata.status.value,
  })

  const [steps, setSteps] = useState<WorkflowStep[]>(
    workflow.metadata.steps.map(step => ({
      id: step.id,
      template_id: step.template_id,
      delay_days: step.delay_days,
      delay_hours: step.delay_hours,
      delay_minutes: step.delay_minutes,
      active: step.active,
    }))
  )

  const [availableLists, setAvailableLists] = useState<any[]>([])
  const [loadingLists, setLoadingLists] = useState(true)

  // Fetch available lists
  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const result = await response.json()
        setAvailableLists(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setLoadingLists(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleListToggle = (listId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      trigger_lists: checked
        ? [...prev.trigger_lists, listId]
        : prev.trigger_lists.filter(id => id !== listId)
    }))
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    setFormData(prev => ({ ...prev, trigger_tags: tags }))
  }

  // Step management functions
  const addStep = () => {
    const newStep: WorkflowStep = {
      template_id: templates.length > 0 ? templates[0].id : '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      active: true,
    }
    setSteps(prev => [...prev, newStep])
  }

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, field: string, value: any) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newSteps = [...steps]
    const temp = newSteps[index]
    newSteps[index] = newSteps[newIndex]
    newSteps[newIndex] = temp
    
    setSteps(newSteps)
  }

  const getDelayDisplay = (step: WorkflowStep) => {
    const parts = []
    if (step.delay_days > 0) parts.push(`${step.delay_days}d`)
    if (step.delay_hours > 0) parts.push(`${step.delay_hours}h`)
    if (step.delay_minutes > 0) parts.push(`${step.delay_minutes}m`)
    return parts.length > 0 ? parts.join(' ') : '0m'
  }

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template?.metadata.name || 'Unknown Template'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate steps
      if (steps.length === 0) {
        alert('Please add at least one step to the workflow')
        return
      }

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        if (!step.template_id) {
          alert(`Please select a template for step ${i + 1}`)
          return
        }
      }

      // Prepare steps data
      const stepsData: CreateWorkflowStepData[] = steps.map(step => ({
        template_id: step.template_id,
        delay_days: step.delay_days,
        delay_hours: step.delay_hours,
        delay_minutes: step.delay_minutes,
        active: step.active,
      }))

      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          steps: stepsData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update workflow')
      }

      onSave()
    } catch (error) {
      console.error('Error updating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to update workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
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
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Workflow</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            title="Delete Workflow"
            message={`Are you sure you want to delete "${workflow.metadata.name}"? This action cannot be undone.`}
            confirmText="Delete"
            variant="destructive"
            onConfirm={handleDelete}
            isLoading={isDeleting}
            trigger={
              <Button
                variant="outline"
                disabled={isSubmitting || isDeleting}
                className="text-red-600 hover:text-red-700"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            }
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Welcome Series, Onboarding Flow"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the purpose and goals of this workflow..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trigger Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trigger_type">Trigger Type</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => handleInputChange('trigger_type', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="List Subscribe">List Subscribe</SelectItem>
                  <SelectItem value="Tag Added">Tag Added</SelectItem>
                  <SelectItem value="Date Based">Date Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.trigger_type === 'List Subscribe' && (
              <div className="space-y-2">
                <Label>Trigger Lists</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                  {loadingLists ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading lists...
                    </div>
                  ) : availableLists.length === 0 ? (
                    <p className="text-sm text-gray-500">No lists available</p>
                  ) : (
                    availableLists.map(list => (
                      <div key={list.id} className="flex items-center space-x-2">
                        <Switch
                          id={list.id}
                          checked={formData.trigger_lists.includes(list.id)}
                          onCheckedChange={(checked) => handleListToggle(list.id, checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor={list.id} className="text-sm">
                          {list.metadata.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {formData.trigger_type === 'Tag Added' && (
              <div className="space-y-2">
                <Label htmlFor="trigger_tags">Trigger Tags</Label>
                <Input
                  id="trigger_tags"
                  value={formData.trigger_tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="Enter tags separated by commas"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">
                  Workflow will trigger when any of these tags are added to a contact
                </p>
              </div>
            )}

            {formData.trigger_type === 'Date Based' && (
              <div className="space-y-2">
                <Label htmlFor="trigger_date">Trigger Date</Label>
                <Input
                  id="trigger_date"
                  type="datetime-local"
                  value={formData.trigger_date}
                  onChange={(e) => handleInputChange('trigger_date', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Workflow Steps
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Step
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No steps yet</h3>
                <p className="text-gray-600 mb-4">
                  Add your first email step to get started.
                </p>
                <Button
                  type="button"
                  onClick={addStep}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Step
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          Step {index + 1}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Delay: {getDelayDisplay(step)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStep(index, 'up')}
                          disabled={index === 0 || isSubmitting}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStep(index, 'down')}
                          disabled={index === steps.length - 1 || isSubmitting}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email Template</Label>
                        <Select
                          value={step.template_id}
                          onValueChange={(value) => updateStep(index, 'template_id', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select template">
                              {step.template_id ? getTemplateName(step.template_id) : "Select template"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.metadata.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id={`step-${index}-active`}
                          checked={step.active}
                          onCheckedChange={(checked) => updateStep(index, 'active', checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor={`step-${index}-active`} className="text-sm">
                          Active
                        </Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Days</Label>
                        <Input
                          type="number"
                          min="0"
                          value={step.delay_days}
                          onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hours</Label>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={step.delay_hours}
                          onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Minutes</Label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={step.delay_minutes}
                          onChange={(e) => updateStep(index, 'delay_minutes', parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || steps.length === 0}
            className="min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Workflow'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}