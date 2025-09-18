'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmailTemplate, EmailList } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Mail, Clock, Target, Loader2, X } from 'lucide-react'

interface CreateWorkflowFormProps {
  templates: EmailTemplate[]
  lists: EmailList[]
}

interface WorkflowStep {
  id: string
  template_id: string
  delay_days: number
  delay_hours: number
  delay_minutes: number
  active: boolean
}

export default function CreateWorkflowForm({ templates, lists }: CreateWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'Manual' as 'Manual' | 'List Subscribe' | 'Tag Added' | 'Date Based',
    trigger_lists: [] as string[],
    trigger_tags: [] as string[],
    trigger_date: '',
  })

  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: '1',
      template_id: '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      active: true,
    }
  ])

  const [currentTag, setCurrentTag] = useState('')

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      template_id: '',
      delay_days: 1,
      delay_hours: 0,
      delay_minutes: 0,
      active: true,
    }
    setSteps(prev => [...prev, newStep])
  }

  const removeStep = (stepId: string) => {
    if (steps.length > 1) {
      setSteps(prev => prev.filter(step => step.id !== stepId))
    }
  }

  const updateStep = (stepId: string, field: keyof WorkflowStep, value: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ))
  }

  const addTriggerTag = () => {
    if (currentTag.trim() && !formData.trigger_tags.includes(currentTag.trim())) {
      handleInputChange('trigger_tags', [...formData.trigger_tags, currentTag.trim()])
      setCurrentTag('')
    }
  }

  const removeTriggerTag = (tagToRemove: string) => {
    handleInputChange('trigger_tags', formData.trigger_tags.filter(tag => tag !== tagToRemove))
  }

  const handleTriggerListChange = (listId: string, checked: boolean) => {
    if (checked) {
      handleInputChange('trigger_lists', [...formData.trigger_lists, listId])
    } else {
      handleInputChange('trigger_lists', formData.trigger_lists.filter(id => id !== listId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate form data
    if (!formData.name.trim()) {
      alert('Please enter a workflow name')
      setIsSubmitting(false)
      return
    }

    if (steps.some(step => !step.template_id)) {
      alert('Please select a template for each step')
      setIsSubmitting(false)
      return
    }

    if (formData.trigger_type === 'Date Based' && !formData.trigger_date) {
      alert('Please select a trigger date for date-based workflows')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          steps: steps.map(({ id, ...step }) => step), // Remove temporary id
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create workflow')
      }

      const result = await response.json()
      router.push(`/workflows/${result.data.id}`)
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to create workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template ? template.metadata.name : 'Select template'
  }

  const getListName = (listId: string) => {
    const list = lists.find(l => l.id === listId)
    return list ? list.metadata.name : 'Unknown List'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Welcome Series, Customer Onboarding"
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
        </CardContent>
      </Card>

      {/* Trigger Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Trigger Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trigger_type">Trigger Type *</Label>
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
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {lists.length === 0 ? (
                  <p className="text-gray-500 text-sm">No lists available</p>
                ) : (
                  lists.map(list => (
                    <div key={list.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`list-${list.id}`}
                        checked={formData.trigger_lists.includes(list.id)}
                        onCheckedChange={(checked) => handleTriggerListChange(list.id, checked as boolean)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor={`list-${list.id}`} className="text-sm cursor-pointer">
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
              <Label>Trigger Tags</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Enter tag name"
                    disabled={isSubmitting}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTriggerTag()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTriggerTag}
                    disabled={isSubmitting || !currentTag.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.trigger_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.trigger_tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="pr-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTriggerTag(tag)}
                          className="ml-1 hover:text-red-600"
                          disabled={isSubmitting}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.trigger_type === 'Date Based' && (
            <div className="space-y-2">
              <Label htmlFor="trigger_date">Trigger Date *</Label>
              <Input
                id="trigger_date"
                type="date"
                value={formData.trigger_date}
                onChange={(e) => handleInputChange('trigger_date', e.target.value)}
                required={formData.trigger_type === 'Date Based'}
                disabled={isSubmitting}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Workflow Steps ({steps.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Step {index + 1}</h4>
                {steps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(step.id)}
                    disabled={isSubmitting}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Template *</Label>
                  <Select
                    value={step.template_id}
                    onValueChange={(value) => updateStep(step.id, 'template_id', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template">
                        {step.template_id ? getTemplateName(step.template_id) : 'Select template'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {templates.filter(t => t.metadata.active).map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.metadata.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Active</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      checked={step.active}
                      onCheckedChange={(checked) => updateStep(step.id, 'active', checked)}
                      disabled={isSubmitting}
                    />
                    <Label className="text-sm">
                      {step.active ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Delay {index === 0 ? '(from enrollment)' : '(from previous step)'}</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={step.delay_days}
                      onChange={(e) => updateStep(step.id, 'delay_days', parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                      placeholder="Days"
                    />
                    <Label className="text-xs text-gray-500">Days</Label>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={step.delay_hours}
                      onChange={(e) => updateStep(step.id, 'delay_hours', parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                      placeholder="Hours"
                    />
                    <Label className="text-xs text-gray-500">Hours</Label>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={step.delay_minutes}
                      onChange={(e) => updateStep(step.id, 'delay_minutes', parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                      placeholder="Minutes"
                    />
                    <Label className="text-xs text-gray-500">Minutes</Label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addStep}
            disabled={isSubmitting}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Step
          </Button>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
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
          disabled={isSubmitting || !formData.name.trim() || steps.some(step => !step.template_id)}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Workflow'
          )}
        </Button>
      </div>
    </form>
  )
}