'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Loader2, Clock, Mail } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, CreateWorkflowStepData } from '@/types'

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
    trigger_type: workflow.metadata.trigger_type.value,
    trigger_lists: workflow.metadata.trigger_lists || [],
    trigger_tags: workflow.metadata.trigger_tags || [],
    trigger_date: workflow.metadata.trigger_date || '',
    steps: workflow.metadata.steps.map(step => ({
      template_id: step.template_id,
      delay_days: step.delay_days,
      delay_hours: step.delay_hours,
      delay_minutes: step.delay_minutes,
      active: step.active,
    }))
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStepChange = (stepIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, index) =>
        index === stepIndex ? { ...step, [field]: value } : step
      )
    }))
  }

  const addStep = () => {
    const newStep: CreateWorkflowStepData = {
      template_id: '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      active: true,
    }
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))
  }

  const removeStep = (stepIndex: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, index) => index !== stepIndex)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  // FIXED: Added proper undefined check for the template
  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template ? template.metadata.name : 'Unknown Template'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Welcome Series, Abandoned Cart Recovery"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

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
        <CardContent className="space-y-4">
          {formData.steps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No steps added yet. Click "Add Step" to get started.</p>
            </div>
          ) : (
            formData.steps.map((step, index) => (
              <Card key={index} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Step {index + 1}
                    </CardTitle>
                    {formData.steps.length > 1 && (
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
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`template-${index}`}>Email Template *</Label>
                    <Select 
                      value={step.template_id} 
                      onValueChange={(value) => handleStepChange(index, 'template_id', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template">
                          {step.template_id ? getTemplateName(step.template_id) : "Select a template"}
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

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Delay Before Sending
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor={`days-${index}`} className="text-xs text-gray-600">Days</Label>
                        <Input
                          id={`days-${index}`}
                          type="number"
                          min="0"
                          value={step.delay_days}
                          onChange={(e) => handleStepChange(index, 'delay_days', parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`hours-${index}`} className="text-xs text-gray-600">Hours</Label>
                        <Input
                          id={`hours-${index}`}
                          type="number"
                          min="0"
                          max="23"
                          value={step.delay_hours}
                          onChange={(e) => handleStepChange(index, 'delay_hours', parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`minutes-${index}`} className="text-xs text-gray-600">Minutes</Label>
                        <Input
                          id={`minutes-${index}`}
                          type="number"
                          min="0"
                          max="59"
                          value={step.delay_minutes}
                          onChange={(e) => handleStepChange(index, 'delay_minutes', parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Total delay: {step.delay_days} days, {step.delay_hours} hours, {step.delay_minutes} minutes
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`active-${index}`}
                      checked={step.active}
                      onCheckedChange={(checked) => handleStepChange(index, 'active', checked)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor={`active-${index}`}>Step Active</Label>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/workflows/${workflow.id}`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.name.trim() || formData.steps.length === 0}
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