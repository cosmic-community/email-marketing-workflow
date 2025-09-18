'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, GripVertical, Clock, Mail, Loader2, Save, X, ArrowLeft } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, CreateWorkflowStepData } from '@/types'

interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  templates: EmailTemplate[]
}

interface WorkflowStepFormData extends CreateWorkflowStepData {
  id?: string
}

export default function EditWorkflowForm({ workflow, templates }: EditWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: workflow.metadata.name,
    description: workflow.metadata.description || '',
    status: workflow.metadata.status.value,
    trigger_type: workflow.metadata.trigger_type.value,
    trigger_lists: workflow.metadata.trigger_lists || [],
    trigger_tags: workflow.metadata.trigger_tags || [],
    trigger_date: workflow.metadata.trigger_date || ''
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

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addStep = () => {
    const newStep: WorkflowStepFormData = {
      template_id: '',
      delay_days: 1,
      delay_hours: 0,
      delay_minutes: 0,
      active: true
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, field: keyof WorkflowStepFormData, value: string | number | boolean) => {
    setSteps(steps.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < steps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
      setSteps(newSteps)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate steps
    if (steps.length === 0) {
      alert('Please add at least one step to the workflow')
      return
    }

    // Validate that all steps have templates selected
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (!step || !step.template_id) {
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
          steps: steps.map(({ id, ...stepData }) => stepData) // Remove id from steps for update
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update workflow')
      }

      router.push(`/workflows/${workflow.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to update workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/workflows/${workflow.id}`)
  }

  const formatDelay = (step: WorkflowStepFormData) => {
    const parts = []
    if (step.delay_days > 0) parts.push(`${step.delay_days}d`)
    if (step.delay_hours > 0) parts.push(`${step.delay_hours}h`)
    if (step.delay_minutes > 0) parts.push(`${step.delay_minutes}m`)
    return parts.join(' ') || '0m'
  }

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template?.metadata.name || 'Select template...'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
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
              placeholder="Optional description of this workflow..."
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
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No steps yet</h3>
              <p className="text-gray-600 mb-4">
                Add your first email step to get started
              </p>
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
                // Add null checks for step
                if (!step) {
                  return null
                }

                return (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Step {index + 1}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Delay: {formatDelay(step)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={step.active}
                            onCheckedChange={(checked) => updateStep(index, 'active', checked)}
                            disabled={isSubmitting}
                          />
                          <span className="text-sm text-gray-600">
                            {step.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col space-y-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(index, 'up')}
                            disabled={index === 0 || isSubmitting}
                          >
                            <GripVertical className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Email Template *</Label>
                        <Select
                          value={step.template_id}
                          onValueChange={(value) => updateStep(index, 'template_id', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select template...">
                              {getTemplateName(step.template_id)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{template.metadata.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {template.metadata.template_type.value}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Delay Days</Label>
                        <Input
                          type="number"
                          min="0"
                          value={step.delay_days}
                          onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
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
                          onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workflow
        </Button>

        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
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
                <Save className="mr-2 h-4 w-4" />
                Update Workflow
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}