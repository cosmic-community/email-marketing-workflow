'use client'

import { useState } from 'react'
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
import { Plus, Trash2, Clock, Mail, Loader2, AlertTriangle } from 'lucide-react'
import { EmailTemplate, EmailList, CreateWorkflowStepData } from '@/types'

interface CreateWorkflowFormProps {
  availableLists: EmailList[]
  availableTemplates?: EmailTemplate[] // Made optional to fix TypeScript error
}

export default function CreateWorkflowForm({ availableLists, availableTemplates = [] }: CreateWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'Manual' as 'Manual' | 'List Subscribe' | 'Tag Added' | 'Date Based',
    trigger_lists: [] as string[],
    trigger_tags: [] as string[],
    trigger_date: '',
    steps: [] as CreateWorkflowStepData[],
  })

  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.trigger_tags.includes(newTag.trim())) {
      handleInputChange('trigger_tags', [...formData.trigger_tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange('trigger_tags', formData.trigger_tags.filter(tag => tag !== tagToRemove))
  }

  const addStep = () => {
    const newStep: CreateWorkflowStepData = {
      template_id: '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      active: true,
    }
    handleInputChange('steps', [...formData.steps, newStep])
  }

  const updateStep = (index: number, field: keyof CreateWorkflowStepData, value: any) => {
    const updatedSteps = [...formData.steps]
    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    handleInputChange('steps', updatedSteps)
  }

  const removeStep = (index: number) => {
    handleInputChange('steps', formData.steps.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Workflow name is required'
    }

    if (formData.trigger_type === 'List Subscribe' && formData.trigger_lists.length === 0) {
      newErrors.trigger_lists = 'At least one list must be selected for List Subscribe trigger'
    }

    if (formData.trigger_type === 'Tag Added' && formData.trigger_tags.length === 0) {
      newErrors.trigger_tags = 'At least one tag must be specified for Tag Added trigger'
    }

    if (formData.trigger_type === 'Date Based' && !formData.trigger_date) {
      newErrors.trigger_date = 'Trigger date is required for Date Based trigger'
    }

    if (formData.steps.length === 0) {
      newErrors.steps = 'At least one email step is required'
    }

    formData.steps.forEach((step, index) => {
      if (!step.template_id) {
        newErrors[`step_${index}_template`] = 'Email template is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create workflow')
      }

      const result = await response.json()
      router.push(`/workflows/${result.data.id}`)
    } catch (error) {
      console.error('Error creating workflow:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create workflow'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDelay = (step: CreateWorkflowStepData) => {
    const parts = []
    if (step.delay_days > 0) parts.push(`${step.delay_days}d`)
    if (step.delay_hours > 0) parts.push(`${step.delay_hours}h`)
    if (step.delay_minutes > 0) parts.push(`${step.delay_minutes}m`)
    return parts.length > 0 ? parts.join(' ') : 'Immediate'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Welcome Series, Onboarding Flow, etc."
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this workflow accomplishes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trigger Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Trigger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trigger Type *</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => handleInputChange('trigger_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual (Start manually)</SelectItem>
                  <SelectItem value="List Subscribe">List Subscribe (Auto-start when added to list)</SelectItem>
                  <SelectItem value="Tag Added">Tag Added (Auto-start when tag is added)</SelectItem>
                  <SelectItem value="Date Based">Date Based (Start on specific date)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.trigger_type === 'List Subscribe' && (
              <div className="space-y-2">
                <Label>Trigger Lists *</Label>
                <div className="space-y-2">
                  {availableLists.map(list => (
                    <div key={list.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`list-${list.id}`}
                        checked={formData.trigger_lists.includes(list.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('trigger_lists', [...formData.trigger_lists, list.id])
                          } else {
                            handleInputChange('trigger_lists', formData.trigger_lists.filter(id => id !== list.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`list-${list.id}`} className="text-sm">
                        {list.metadata.name} ({list.metadata.total_contacts || 0} contacts)
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.trigger_lists && (
                  <p className="text-sm text-red-600">{errors.trigger_lists}</p>
                )}
              </div>
            )}

            {formData.trigger_type === 'Tag Added' && (
              <div className="space-y-2">
                <Label>Trigger Tags *</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.trigger_tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                {errors.trigger_tags && (
                  <p className="text-sm text-red-600">{errors.trigger_tags}</p>
                )}
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
                  className={errors.trigger_date ? 'border-red-500' : ''}
                />
                {errors.trigger_date && (
                  <p className="text-sm text-red-600">{errors.trigger_date}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Email Steps
              <Button type="button" onClick={addStep} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableTemplates.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">No Email Templates Available</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      You need to create email templates before you can add them to workflows. 
                      You can still create this workflow, but you'll need to add templates later to make it functional.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formData.steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No email steps added yet</p>
                <p className="text-sm">Click "Add Step" to create your first email in the workflow</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.steps.map((step, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">Email Step {index + 1}</span>
                        {formatDelay(step) !== 'Immediate' && (
                          <Badge variant="outline" className="ml-2">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDelay(step)} delay
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={step.active}
                          onCheckedChange={(checked) => updateStep(index, 'active', checked)}
                        />
                        <Label className="text-sm">Active</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                        >
                          <SelectTrigger className={errors[`step_${index}_template`] ? 'border-red-500' : ''}>
                            <SelectValue placeholder={availableTemplates.length === 0 ? "No templates available" : "Select template..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTemplates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.metadata.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`step_${index}_template`] && (
                          <p className="text-sm text-red-600">{errors[`step_${index}_template`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Delay Before Sending</Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              placeholder="Days"
                              value={step.delay_days}
                              onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="23"
                              placeholder="Hours"
                              value={step.delay_hours}
                              onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              placeholder="Minutes"
                              value={step.delay_minutes}
                              onChange={(e) => updateStep(index, 'delay_minutes', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.steps && (
              <p className="text-sm text-red-600">{errors.steps}</p>
            )}
          </CardContent>
        </Card>

        {/* Submit Section */}
        <Card>
          <CardContent className="pt-6">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {errors.submit}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
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
                disabled={isSubmitting}
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
          </CardContent>
        </Card>
      </form>
    </div>
  )
}