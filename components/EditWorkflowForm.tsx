'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Trash2, Clock } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, CreateWorkflowStepData } from '@/types'

export interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  templates?: EmailTemplate[]
  onSave: () => void
  onCancel: () => void
}

interface FormData {
  name: string
  description: string
  trigger_type: "Manual" | "List Subscribe" | "Tag Added" | "Date Based"
  trigger_lists: string[]
  trigger_tags: string[]
  trigger_date: string
  steps: CreateWorkflowStepData[]
}

export default function EditWorkflowForm({ 
  workflow, 
  templates = [], 
  onSave, 
  onCancel 
}: EditWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
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
    })) || []
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.steps || formData.steps.length === 0) {
      alert('Please add at least one workflow step')
      return
    }

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

      router.refresh()
      onSave()
    } catch (error) {
      console.error('Error updating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to update workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addStep = () => {
    const newStep: CreateWorkflowStepData = {
      template_id: templates.length > 0 ? templates[0].id : '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      active: true,
    }

    setFormData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep]
    }))
  }

  const removeStep = (index: number) => {
    if (!formData.steps) return
    
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index) || []
    }))
  }

  const updateStep = (index: number, field: keyof CreateWorkflowStepData, value: any) => {
    if (!formData.steps) return
    
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      ) || []
    }))
  }

  const getTemplateById = (templateId: string) => {
    return templates.find(t => t.id === templateId)
  }

  const calculateDelay = (step: CreateWorkflowStepData) => {
    const days = step.delay_days || 0
    const hours = step.delay_hours || 0
    const minutes = step.delay_minutes || 0
    
    if (days === 0 && hours === 0 && minutes === 0) {
      return 'Send immediately'
    }
    
    const parts = []
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
    
    return `Send after ${parts.join(', ')}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter workflow name"
                required
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional workflow description..."
              rows={3}
              disabled={isSubmitting}
            />
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
          <CardTitle className="flex items-center justify-between">
            Workflow Steps
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              disabled={isSubmitting || templates.length === 0}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Step
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              <p>No email templates available.</p>
              <p className="text-sm">Create templates first to add workflow steps.</p>
            </div>
          )}

          {formData.steps && formData.steps.length === 0 && templates.length > 0 && (
            <div className="text-center py-8 text-gray-600">
              <p>No workflow steps added yet.</p>
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
          )}

          {formData.steps?.map((step, index) => {
            const template = getTemplateById(step.template_id)
            
            return (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Step {index + 1}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={step.active}
                      onCheckedChange={(checked) => updateStep(index, 'active', checked)}
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      disabled={isSubmitting}
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
                      onValueChange={(value) => updateStep(index, 'template_id', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
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
                      Delay
                    </Label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="0"
                          value={step.delay_days}
                          onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                          placeholder="Days"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={step.delay_hours}
                          onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)}
                          placeholder="Hours"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={step.delay_minutes}
                          onChange={(e) => updateStep(index, 'delay_minutes', parseInt(e.target.value) || 0)}
                          placeholder="Minutes"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {calculateDelay(step)}
                    </p>
                  </div>
                </div>

                {template && (
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm font-medium">{template.metadata.name}</p>
                    <p className="text-xs text-gray-600">
                      Subject: {template.metadata.subject}
                    </p>
                    <p className="text-xs text-gray-500">
                      Type: {template.metadata.template_type.value}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.name.trim() || !formData.steps || formData.steps.length === 0}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Workflow'
          )}
        </Button>
      </div>
    </form>
  )
}