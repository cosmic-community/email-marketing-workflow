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
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Loader2, Save, X, Clock, Mail } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, EmailList, CreateWorkflowStepData } from '@/types'

interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  templates: EmailTemplate[]
  onClose?: () => void
}

export default function EditWorkflowForm({ workflow, templates, onClose }: EditWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableLists, setAvailableLists] = useState<EmailList[]>([])
  
  const [formData, setFormData] = useState({
    name: workflow.metadata.name,
    description: workflow.metadata.description || '',
    trigger_type: workflow.metadata.trigger_type.value,
    trigger_lists: workflow.metadata.trigger_lists || [],
    trigger_tags: (workflow.metadata.trigger_tags || []).join(', '),
    trigger_date: workflow.metadata.trigger_date || '',
    steps: workflow.metadata.steps.map(step => ({
      template_id: step.template_id,
      delay_days: step.delay_days,
      delay_hours: step.delay_hours,  
      delay_minutes: step.delay_minutes,
      active: step.active
    })) as CreateWorkflowStepData[]
  })

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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target_tags: formData.trigger_tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update workflow')
      }

      router.refresh()
      
      if (onClose) {
        onClose()
      }
      
    } catch (error) {
      console.error('Error updating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to update workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStepChange = (index: number, field: keyof CreateWorkflowStepData, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }))
  }

  const addStep = () => {
    const firstTemplate = templates[0]
    if (!firstTemplate) {
      alert('No templates available. Please create a template first.')
      return
    }

    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, {
        template_id: firstTemplate.id,
        delay_days: 0,
        delay_hours: 0,
        delay_minutes: 5,
        active: true
      }]
    }))
  }

  const removeStep = (index: number) => {
    if (formData.steps.length <= 1) {
      alert('Workflow must have at least one step')
      return
    }

    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }))
  }

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template?.metadata.name || 'Unknown Template'
  }

  const formatDelayText = (days: number, hours: number, minutes: number) => {
    const parts = []
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
    return parts.length > 0 ? parts.join(', ') : 'Immediate'
  }

  if (templates.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>No Templates Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            You need to create email templates before you can edit a workflow.
          </p>
          <Button onClick={() => router.push('/templates/new')}>
            Create Template
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Edit Workflow
            </CardTitle>
            {onClose && (
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Welcome Series, Re-engagement Campaign"
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
              placeholder="Describe what this workflow does..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Trigger Configuration */}
          {formData.trigger_type === 'List Subscribe' && (
            <div className="space-y-2">
              <Label>Trigger Lists</Label>
              <div className="border rounded-lg p-4 space-y-2">
                {availableLists.map((list) => (
                  <div key={list.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`list-${list.id}`}
                      checked={formData.trigger_lists?.includes(list.id) || false}
                      onChange={(e) => {
                        const currentLists = formData.trigger_lists || []
                        const newLists = e.target.checked
                          ? [...currentLists, list.id]
                          : currentLists.filter(id => id !== list.id)
                        handleInputChange('trigger_lists', newLists)
                      }}
                      disabled={isSubmitting}
                    />
                    <label htmlFor={`list-${list.id}`} className="text-sm font-medium">
                      {list.metadata.name}
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {list.metadata.list_type.value}
                    </Badge>
                  </div>
                ))}
                {availableLists.length === 0 && (
                  <p className="text-sm text-gray-500">No lists available</p>
                )}
              </div>
            </div>
          )}

          {formData.trigger_type === 'Tag Added' && (
            <div className="space-y-2">
              <Label htmlFor="trigger_tags">Trigger Tags</Label>
              <Input
                id="trigger_tags"
                value={formData.trigger_tags}
                onChange={(e) => handleInputChange('trigger_tags', e.target.value)}
                placeholder="e.g., new-customer, vip, interested (comma-separated)"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500">Enter tags separated by commas</p>
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
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Workflow Steps
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addStep} disabled={isSubmitting}>
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.steps.map((step, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Step {index + 1}</Badge>
                    <span className="text-sm font-medium">
                      {getTemplateName(step.template_id)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={step.active}
                        onCheckedChange={(checked) => handleStepChange(index, 'active', checked)}
                        disabled={isSubmitting}
                      />
                      <Label className="text-xs">Active</Label>
                    </div>
                    {formData.steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Delay: {formatDelayText(step.delay_days, step.delay_hours, step.delay_minutes)}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-2">
                  <Label>Email Template</Label>
                  <Select 
                    value={step.template_id} 
                    onValueChange={(value) => handleStepChange(index, 'template_id', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => {
                        // Add safe check to ensure template and template.metadata exist
                        const templateName = template?.metadata?.name || 'Unnamed Template'
                        const templateType = template?.metadata?.template_type?.value || 'Unknown'
                        
                        return (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <span>{templateName}</span>
                              <Badge variant="outline" className="text-xs">
                                {templateType}
                              </Badge>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Days</Label>
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={step.delay_days}
                      onChange={(e) => handleStepChange(index, 'delay_days', parseInt(e.target.value) || 0)}
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
                      onChange={(e) => handleStepChange(index, 'delay_hours', parseInt(e.target.value) || 0)}
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
                      onChange={(e) => handleStepChange(index, 'delay_minutes', parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {formData.steps.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500 mb-4">No steps added yet</p>
              <Button type="button" variant="outline" onClick={addStep} disabled={isSubmitting}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Step
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <div className="flex justify-end gap-3">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || formData.steps.length === 0}
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
    </form>
  )
}