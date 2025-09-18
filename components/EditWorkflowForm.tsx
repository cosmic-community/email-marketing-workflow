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
import { Trash2, Plus, GripVertical, Loader2 } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, CreateWorkflowStepData } from '@/types'

interface WorkflowStepFormData extends CreateWorkflowStepData {
  id?: string;
  template?: EmailTemplate;
}

interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  templates: EmailTemplate[]
}

export default function EditWorkflowForm({ workflow, templates }: EditWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: workflow.metadata.name,
    description: workflow.metadata.description || '',
    trigger_type: workflow.metadata.trigger_type.value as 'Manual' | 'List Subscribe' | 'Tag Added' | 'Date Based',
    trigger_lists: workflow.metadata.trigger_lists || [],
    trigger_tags: workflow.metadata.trigger_tags || [],
    trigger_date: workflow.metadata.trigger_date || '',
  })

  const [steps, setSteps] = useState<WorkflowStepFormData[]>(
    workflow.metadata.steps.map(step => ({
      id: step.id,
      template_id: step.template_id,
      delay_days: step.delay_days,
      delay_hours: step.delay_hours,
      delay_minutes: step.delay_minutes,
      active: step.active,
      template: templates.find(t => t.id === step.template_id)
    }))
  )

  const addStep = () => {
    const newStep: WorkflowStepFormData = {
      template_id: '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      active: true,
    }
    setSteps([...steps, newStep])
  }

  const updateStep = (index: number, field: keyof WorkflowStepFormData, value: any) => {
    const updatedSteps = [...steps]
    const currentStep = updatedSteps[index]
    
    // Add null check to prevent TypeScript error
    if (!currentStep) {
      return
    }
    
    // Type-safe update with explicit checks
    if (field === 'template_id' && typeof value === 'string') {
      const updatedStep = { ...currentStep, template_id: value }
      updatedStep.template = templates.find(t => t.id === value)
      updatedSteps[index] = updatedStep
    } else if (field === 'delay_days' && typeof value === 'number') {
      updatedSteps[index] = { ...currentStep, delay_days: value }
    } else if (field === 'delay_hours' && typeof value === 'number') {
      updatedSteps[index] = { ...currentStep, delay_hours: value }
    } else if (field === 'delay_minutes' && typeof value === 'number') {
      updatedSteps[index] = { ...currentStep, delay_minutes: value }
    } else if (field === 'active' && typeof value === 'boolean') {
      updatedSteps[index] = { ...currentStep, active: value }
    }
    
    setSteps(updatedSteps)
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
      setSteps(newSteps)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (steps.length === 0) {
      alert('Please add at least one workflow step')
      return
    }

    // Validate all steps have templates selected
    const invalidSteps = steps.filter(step => !step.template_id)
    if (invalidSteps.length > 0) {
      alert('Please select templates for all workflow steps')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          steps: steps.map(({ id, template, ...step }) => step) // Remove id and template from submission
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update workflow')
      }

      router.push('/workflows')
      router.refresh()
    } catch (error) {
      console.error('Error updating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to update workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Workflow Steps</CardTitle>
            <Button 
              type="button" 
              onClick={addStep}
              disabled={isSubmitting}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No workflow steps added yet</p>
              <Button 
                type="button" 
                onClick={addStep}
                disabled={isSubmitting}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Step
              </Button>
            </div>
          ) : (
            steps.map((step, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center space-y-2 mt-1">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStep(index, 'up')}
                          disabled={index === 0 || isSubmitting}
                          className="p-1 h-6 w-6"
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStep(index, 'down')}
                          disabled={index === steps.length - 1 || isSubmitting}
                          className="p-1 h-6 w-6"
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <Label>Email Template *</Label>
                        <Select
                          value={step.template_id}
                          onValueChange={(value) => updateStep(index, 'template_id', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.metadata.name} ({template.metadata.template_type.value})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {step.template && (
                          <p className="text-xs text-gray-500 mt-1">
                            Subject: {step.template.metadata.subject}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Delay Days</Label>
                          <Input
                            type="number"
                            min="0"
                            value={step.delay_days}
                            onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
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
                        <div>
                          <Label>Delay Minutes</Label>
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

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={step.active}
                          onCheckedChange={(checked) => updateStep(index, 'active', checked)}
                          disabled={isSubmitting}
                        />
                        <Label>Step Active</Label>
                      </div>
                    </div>

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
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || steps.length === 0}
          className="min-w-[120px]"
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
  )
}