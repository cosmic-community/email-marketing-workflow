'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, EmailList, UpdateWorkflowData } from '@/types'

interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  onCancel: () => void
  onSave: () => void
}

interface WorkflowStepFormData {
  id: string
  template_id: string
  delay_days: number
  delay_hours: number
  delay_minutes: number
  active: boolean
}

export function EditWorkflowForm({ workflow, onCancel, onSave }: EditWorkflowFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [lists, setLists] = useState<EmailList[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [formData, setFormData] = useState<UpdateWorkflowData>({
    name: workflow.metadata.name,
    description: workflow.metadata.description || '',
    trigger_type: workflow.metadata.trigger_type.value,
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
    }))
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      
      const [templatesResponse, listsResponse] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/lists')
      ])

      if (templatesResponse.ok) {
        const templatesResult = await templatesResponse.json()
        setTemplates(templatesResult.data || [])
      }

      if (listsResponse.ok) {
        const listsResult = await listsResponse.json()
        setLists(listsResult.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: keyof UpdateWorkflowData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addStep = () => {
    const newStep: WorkflowStepFormData = {
      id: `temp-${Date.now()}`,
      template_id: '',
      delay_days: 1,
      delay_hours: 0,
      delay_minutes: 0,
      active: true,
    }
    setSteps(prev => [...prev, newStep])
  }

  const removeStep = (stepId: string) => {
    setSteps(prev => prev.filter(step => step.id !== stepId))
  }

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const currentIndex = steps.findIndex(step => step.id === stepId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= steps.length) return

    const newSteps = [...steps]
    const [movedStep] = newSteps.splice(currentIndex, 1)
    newSteps.splice(newIndex, 0, movedStep)
    setSteps(newSteps)
  }

  const updateStep = (stepId: string, field: keyof WorkflowStepFormData, value: any) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, [field]: value } : step
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate that all steps have templates selected
      const stepsWithoutTemplate = steps.filter(step => !step.template_id)
      if (stepsWithoutTemplate.length > 0) {
        alert('Please select a template for all workflow steps')
        return
      }

      // Prepare steps data
      const stepsData = steps.map(step => ({
        template_id: step.template_id,
        delay_days: step.delay_days,
        delay_hours: step.delay_hours,
        delay_minutes: step.delay_minutes,
        active: step.active,
      }))

      const updateData: UpdateWorkflowData = {
        ...formData,
        steps: stepsData,
      }

      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
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
      setIsLoading(false)
    }
  }

  const formatDelay = (days: number, hours: number, minutes: number) => {
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    return parts.length > 0 ? parts.join(' ') : 'Immediate'
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-gray-600">Loading workflow data...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Welcome Series, Newsletter Onboarding..."
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
              disabled={isLoading}
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
            <Label htmlFor="trigger_type">Trigger Type *</Label>
            <Select
              value={formData.trigger_type}
              onValueChange={(value) => handleInputChange('trigger_type', value)}
              disabled={isLoading}
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
              <div className="space-y-2">
                {lists.map(list => (
                  <div key={list.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`list-${list.id}`}
                      checked={formData.trigger_lists?.includes(list.id) || false}
                      onChange={(e) => {
                        const currentLists = formData.trigger_lists || []
                        if (e.target.checked) {
                          handleInputChange('trigger_lists', [...currentLists, list.id])
                        } else {
                          handleInputChange('trigger_lists', currentLists.filter(id => id !== list.id))
                        }
                      }}
                      className="rounded border-gray-300"
                      disabled={isLoading}
                    />
                    <Label htmlFor={`list-${list.id}`} className="text-sm">
                      {list.metadata.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.trigger_type === 'Tag Added' && (
            <div className="space-y-2">
              <Label htmlFor="trigger_tags">Trigger Tags</Label>
              <Input
                id="trigger_tags"
                value={formData.trigger_tags?.join(', ') || ''}
                onChange={(e) => handleInputChange('trigger_tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                placeholder="tag1, tag2, tag3"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">Separate tags with commas</p>
            </div>
          )}

          {formData.trigger_type === 'Date Based' && (
            <div className="space-y-2">
              <Label htmlFor="trigger_date">Trigger Date</Label>
              <Input
                id="trigger_date"
                type="date"
                value={formData.trigger_date}
                onChange={(e) => handleInputChange('trigger_date', e.target.value)}
                disabled={isLoading}
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
              onClick={addStep}
              size="sm"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No steps configured. Add your first step to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Step {index + 1}</Badge>
                      <span className="text-sm text-gray-600">
                        Delay: {index === 0 ? 'Immediate' : formatDelay(step.delay_days, step.delay_hours, step.delay_minutes)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={index === 0 || isLoading}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={index === steps.length - 1 || isLoading}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeStep(step.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email Template *</Label>
                      <Select
                        value={step.template_id}
                        onValueChange={(value) => updateStep(step.id, 'template_id', value)}
                        disabled={isLoading}
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

                    {index > 0 && (
                      <div className="space-y-4">
                        <Label>Delay Before Sending</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Days</Label>
                            <Input
                              type="number"
                              min="0"
                              value={step.delay_days}
                              onChange={(e) => updateStep(step.id, 'delay_days', parseInt(e.target.value) || 0)}
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Hours</Label>
                            <Input
                              type="number"
                              min="0"
                              max="23"
                              value={step.delay_hours}
                              onChange={(e) => updateStep(step.id, 'delay_hours', parseInt(e.target.value) || 0)}
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Minutes</Label>
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={step.delay_minutes}
                              onChange={(e) => updateStep(step.id, 'delay_minutes', parseInt(e.target.value) || 0)}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <Switch
                      checked={step.active}
                      onCheckedChange={(checked) => updateStep(step.id, 'active', checked)}
                      disabled={isLoading}
                    />
                    <Label className="text-sm">Step enabled</Label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.name || steps.length === 0}
          className="min-w-[120px]"
        >
          {isLoading ? (
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