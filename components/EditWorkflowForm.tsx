'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Loader2, Save, X, Mail } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, CreateWorkflowStepData } from '@/types'

interface WorkflowStepFormData extends CreateWorkflowStepData {
  id?: string
}

export interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  onCancel: () => void
  onSave: () => void
}

export default function EditWorkflowForm({ workflow, onCancel, onSave }: EditWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  
  const [formData, setFormData] = useState({
    name: workflow.metadata.name,
    description: workflow.metadata.description || '',
    trigger_type: workflow.metadata.trigger_type.value,
    trigger_lists: workflow.metadata.trigger_lists || [],
    trigger_tags: workflow.metadata.trigger_tags || [],
    trigger_date: workflow.metadata.trigger_date || '',
    status: workflow.metadata.status.value
  })

  const [steps, setSteps] = useState<WorkflowStepFormData[]>(
    workflow.metadata.steps.map(step => ({
      id: step.id,
      template_id: step.template_id,
      delay_days: step.delay_days,
      delay_hours: step.delay_hours,
      delay_minutes: step.delay_minutes,
      active: step.active
    }))
  )

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const result = await response.json()
        setTemplates(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStepChange = (stepIndex: number, field: keyof WorkflowStepFormData, value: string | number | boolean) => {
    setSteps(prev => {
      const newSteps = [...prev]
      const step = newSteps[stepIndex]
      
      // CRITICAL FIX: Handle potentially undefined step data
      if (!step) {
        return prev // Return unchanged if step is undefined
      }
      
      newSteps[stepIndex] = { ...step, [field]: value }
      return newSteps
    })
  }

  const addStep = () => {
    const newStep: WorkflowStepFormData = {
      template_id: '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      active: true
    }
    setSteps(prev => [...prev, newStep])
  }

  const removeStep = (stepIndex: number) => {
    setSteps(prev => prev.filter((_, index) => index !== stepIndex))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name.trim()) {
      alert('Please provide a workflow name')
      return
    }

    // Validate steps
    if (steps.length === 0) {
      alert('Please add at least one step to the workflow')
      return
    }

    // Validate each step has a template
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i]?.template_id) {
        alert(`Please select a template for step ${i + 1}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          steps: steps.map(step => ({
            template_id: step.template_id,
            delay_days: step.delay_days,
            delay_hours: step.delay_hours,
            delay_minutes: step.delay_minutes,
            active: step.active
          }))
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update workflow')
      }

      // Call onSave callback and refresh
      onSave()
      router.refresh()

    } catch (error) {
      console.error('Error updating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to update workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template ? template.metadata.name : 'Select a template...'
  }

  const formatDelay = (step: WorkflowStepFormData) => {
    const parts = []
    if (step.delay_days > 0) parts.push(`${step.delay_days} day${step.delay_days > 1 ? 's' : ''}`)
    if (step.delay_hours > 0) parts.push(`${step.delay_hours} hour${step.delay_hours > 1 ? 's' : ''}`)
    if (step.delay_minutes > 0) parts.push(`${step.delay_minutes} minute${step.delay_minutes > 1 ? 's' : ''}`)
    
    if (parts.length === 0) return 'Send immediately'
    return `Wait ${parts.join(', ')}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Welcome Series, Product Launch"
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
                placeholder="Describe the purpose of this workflow..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trigger Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger Settings</CardTitle>
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

            {formData.trigger_type === 'Date Based' && (
              <div className="space-y-2">
                <Label htmlFor="trigger_date">Trigger Date</Label>
                <Input
                  id="trigger_date"
                  type="date"
                  value={formData.trigger_date}
                  onChange={(e) => handleInputChange('trigger_date', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {(formData.trigger_type === 'List Subscribe') && (
              <div className="space-y-2">
                <Label htmlFor="trigger_lists">Trigger Lists (comma-separated IDs)</Label>
                <Input
                  id="trigger_lists"
                  value={formData.trigger_lists.join(', ')}
                  onChange={(e) => handleInputChange('trigger_lists', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="list-id-1, list-id-2"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {formData.trigger_type === 'Tag Added' && (
              <div className="space-y-2">
                <Label htmlFor="trigger_tags">Trigger Tags (comma-separated)</Label>
                <Input
                  id="trigger_tags"
                  value={formData.trigger_tags.join(', ')}
                  onChange={(e) => handleInputChange('trigger_tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="tag1, tag2, tag3"
                  disabled={isSubmitting}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Workflow Steps</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No steps yet</h3>
                <p className="text-gray-600 mb-4">Add your first email step to get started.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addStep}
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Step
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => {
                  // CRITICAL FIX: Handle potentially undefined step data
                  if (!step) {
                    return null; // Skip rendering if step is undefined
                  }
                  
                  return (
                    <div key={step.id || index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Step {index + 1}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatDelay(step)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={step.active}
                            onCheckedChange={(checked) => handleStepChange(index, 'active', checked)}
                            disabled={isSubmitting}
                          />
                          <Label className="text-sm">Active</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                            disabled={isSubmitting || steps.length === 1}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email Template *</Label>
                          <Select 
                            value={step.template_id} 
                            onValueChange={(value) => handleStepChange(index, 'template_id', value)}
                            disabled={isSubmitting || loadingTemplates}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template...">
                                {step.template_id ? getTemplateName(step.template_id) : "Select a template..."}
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
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Delay Days</Label>
                          <Input
                            type="number"
                            min="0"
                            value={step.delay_days}
                            onChange={(e) => handleStepChange(index, 'delay_days', parseInt(e.target.value) || 0)}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Delay Hours</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={step.delay_hours}
                            onChange={(e) => handleStepChange(index, 'delay_hours', parseInt(e.target.value) || 0)}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Delay Minutes</Label>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={step.delay_minutes}
                            onChange={(e) => handleStepChange(index, 'delay_minutes', parseInt(e.target.value) || 0)}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      {index < steps.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || steps.length === 0 || !formData.name.trim()}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Workflow
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}