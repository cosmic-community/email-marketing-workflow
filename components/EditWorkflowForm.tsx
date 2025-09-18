'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Loader2, Plus, Trash2, GripVertical, Save, ArrowLeft } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, EmailList, UpdateWorkflowData, WorkflowStep } from '@/types'

interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  templates: EmailTemplate[]
  lists: EmailList[]
}

interface WorkflowStepFormData {
  template_id: string
  delay_days: number
  delay_hours: number
  delay_minutes: number
  active: boolean
}

export default function EditWorkflowForm({ workflow, templates, lists }: EditWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<UpdateWorkflowData>({
    name: workflow.metadata.name,
    description: workflow.metadata.description || '',
    status: workflow.metadata.status.value,
    trigger_type: workflow.metadata.trigger_type.value,
    trigger_lists: workflow.metadata.trigger_lists || [],
    trigger_tags: workflow.metadata.trigger_tags || [],
    trigger_date: workflow.metadata.trigger_date || '',
    steps: workflow.metadata.steps.map(step => ({
      template_id: step.template_id,
      delay_days: step.delay_days,
      delay_hours: step.delay_hours,
      delay_minutes: step.delay_minutes,
      active: step.active
    }))
  })

  const handleInputChange = (field: keyof UpdateWorkflowData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStepChange = (stepIndex: number, field: keyof WorkflowStepFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.map((step, index) => 
        index === stepIndex ? { ...step, [field]: value } : step
      ) || []
    }))
  }

  const addStep = () => {
    const newStep: WorkflowStepFormData = {
      template_id: templates[0]?.id || '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      active: true
    }

    setFormData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep]
    }))
  }

  const removeStep = (stepIndex: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, index) => index !== stepIndex) || []
    }))
  }

  const moveStep = (stepIndex: number, direction: 'up' | 'down') => {
    if (!formData.steps) return

    const steps = [...formData.steps]
    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1
    
    if (newIndex < 0 || newIndex >= steps.length) return

    // Swap steps
    [steps[stepIndex], steps[newIndex]] = [steps[newIndex], steps[stepIndex]]
    
    setFormData(prev => ({ ...prev, steps }))
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

      router.push('/workflows')
      router.refresh()

    } catch (error) {
      console.error('Error updating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to update workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTemplateName = (templateId: string): string => {
    const template = templates.find(t => t.id === templateId)
    return template ? template.metadata.name : 'Template not found'
  }

  const getListName = (listId: string): string => {
    const list = lists.find(l => l.id === listId)
    return list ? list.metadata.name : 'List not found'
  }

  const formatDelay = (days: number, hours: number, minutes: number): string => {
    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    return parts.length > 0 ? parts.join(' ') : 'Immediate'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/workflows')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workflows
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Workflow</h1>
          <p className="text-gray-600">{workflow.metadata.name}</p>
        </div>
      </div>

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
                value={formData.name || ''}
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
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the purpose of this workflow..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status || 'Draft'} 
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

              <div className="space-y-2">
                <Label htmlFor="trigger_type">Trigger Type</Label>
                <Select 
                  value={formData.trigger_type || 'Manual'} 
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
          </CardContent>
        </Card>

        {/* Trigger Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.trigger_type === 'List Subscribe' && (
              <div className="space-y-2">
                <Label>Trigger Lists</Label>
                <div className="space-y-2">
                  {lists.map(list => (
                    <div key={list.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`list-${list.id}`}
                        checked={(formData.trigger_lists || []).includes(list.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked
                          const currentLists = formData.trigger_lists || []
                          const updatedLists = isChecked 
                            ? [...currentLists, list.id]
                            : currentLists.filter(id => id !== list.id)
                          handleInputChange('trigger_lists', updatedLists)
                        }}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor={`list-${list.id}`} className="flex-1">
                        {list.metadata.name}
                        <Badge variant="secondary" className="ml-2">
                          {list.metadata.list_type.value}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.trigger_type === 'Tag Added' && (
              <div className="space-y-2">
                <Label htmlFor="trigger_tags">Trigger Tags (comma-separated)</Label>
                <Input
                  id="trigger_tags"
                  value={(formData.trigger_tags || []).join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(tag => tag.length > 0)
                    handleInputChange('trigger_tags', tags)
                  }}
                  placeholder="e.g., new-customer, vip, newsletter-signup"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {formData.trigger_type === 'Date Based' && (
              <div className="space-y-2">
                <Label htmlFor="trigger_date">Trigger Date</Label>
                <Input
                  id="trigger_date"
                  type="date"
                  value={formData.trigger_date || ''}
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
            {!formData.steps || formData.steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No steps added yet. Click "Add Step" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.steps.map((step, stepIndex) => (
                  <Card key={stepIndex} className={`relative ${!step.active ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm flex items-center justify-center">
                            {stepIndex + 1}
                          </div>
                          {stepIndex < formData.steps.length - 1 && (
                            <div className="w-px h-8 bg-gray-300" />
                          )}
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Template *</Label>
                              <Select 
                                value={step.template_id} 
                                onValueChange={(value) => handleStepChange(stepIndex, 'template_id', value)}
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
                              <Label>Delay</Label>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Days</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={step.delay_days}
                                    onChange={(e) => handleStepChange(stepIndex, 'delay_days', parseInt(e.target.value) || 0)}
                                    disabled={isSubmitting}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Hours</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={step.delay_hours}
                                    onChange={(e) => handleStepChange(stepIndex, 'delay_hours', parseInt(e.target.value) || 0)}
                                    disabled={isSubmitting}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Minutes</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={step.delay_minutes}
                                    onChange={(e) => handleStepChange(stepIndex, 'delay_minutes', parseInt(e.target.value) || 0)}
                                    disabled={isSubmitting}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={step.active}
                                onCheckedChange={(checked) => handleStepChange(stepIndex, 'active', checked)}
                                disabled={isSubmitting}
                              />
                              <Label className="text-sm">Step Active</Label>
                            </div>

                            <div className="flex items-center gap-2">
                              {stepIndex > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveStep(stepIndex, 'up')}
                                  disabled={isSubmitting}
                                >
                                  ↑
                                </Button>
                              )}
                              {stepIndex < formData.steps.length - 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveStep(stepIndex, 'down')}
                                  disabled={isSubmitting}
                                >
                                  ↓
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStep(stepIndex)}
                                disabled={isSubmitting}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/workflows')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.name || !formData.steps || formData.steps.length === 0}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Workflow
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}