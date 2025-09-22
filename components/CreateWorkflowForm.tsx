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
import { Loader2, Plus, X, Clock, Mail } from 'lucide-react'
import { EmailTemplate, EmailList, CreateWorkflowStepData } from '@/types'

export interface CreateWorkflowFormProps {
  availableTemplates: EmailTemplate[]
  availableLists: EmailList[]
}

export default function CreateWorkflowForm({ availableTemplates, availableLists }: CreateWorkflowFormProps) {
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
  const [steps, setSteps] = useState<CreateWorkflowStepData[]>([])
  const [newTag, setNewTag] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (steps.length === 0) {
      alert('Please add at least one step to your workflow')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          steps,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create workflow')
      }

      router.push('/workflows')
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to create workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addStep = () => {
    const newStep: CreateWorkflowStepData = {
      template_id: '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      active: true,
    }
    setSteps(prev => [...prev, newStep])
  }

  const updateStep = (index: number, field: keyof CreateWorkflowStepData, value: string | number | boolean) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ))
  }

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.trigger_tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        trigger_tags: [...prev.trigger_tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      trigger_tags: prev.trigger_tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const toggleList = (listId: string) => {
    setFormData(prev => ({
      ...prev,
      trigger_lists: prev.trigger_lists.includes(listId)
        ? prev.trigger_lists.filter(id => id !== listId)
        : [...prev.trigger_lists, listId]
    }))
  }

  const isFormValid = formData.name.trim() && steps.length > 0 && steps.every(step => step.template_id)

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
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
                placeholder="Describe what this workflow does..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trigger Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger Settings</CardTitle>
            <p className="text-sm text-gray-600">
              Define when and how contacts enter this workflow
            </p>
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
                  <SelectItem value="Manual">Manual - Add contacts manually</SelectItem>
                  <SelectItem value="List Subscribe">List Subscribe - When added to selected lists</SelectItem>
                  <SelectItem value="Tag Added">Tag Added - When tagged with specific tags</SelectItem>
                  <SelectItem value="Date Based">Date Based - Start on a specific date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* List-based triggers */}
            {formData.trigger_type === 'List Subscribe' && (
              <div className="space-y-2">
                <Label>Trigger Lists</Label>
                <div className="space-y-2">
                  {availableLists.length === 0 ? (
                    <p className="text-sm text-gray-500">No lists available</p>
                  ) : (
                    availableLists.map(list => (
                      <div key={list.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`list-${list.id}`}
                          checked={formData.trigger_lists.includes(list.id)}
                          onChange={() => toggleList(list.id)}
                          disabled={isSubmitting}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <label htmlFor={`list-${list.id}`} className="text-sm">
                          {list.metadata.name} ({list.metadata.total_contacts || 0} contacts)
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tag-based triggers */}
            {formData.trigger_type === 'Tag Added' && (
              <div className="space-y-2">
                <Label htmlFor="trigger_tags">Trigger Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter a tag name"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    disabled={isSubmitting}
                  />
                  <Button type="button" onClick={addTag} disabled={!newTag.trim() || isSubmitting}>
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
                        disabled={isSubmitting}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Date-based triggers */}
            {formData.trigger_type === 'Date Based' && (
              <div className="space-y-2">
                <Label htmlFor="trigger_date">Start Date</Label>
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
            <CardTitle className="flex items-center justify-between">
              Workflow Steps
              <Button type="button" onClick={addStep} disabled={isSubmitting}>
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Define the sequence of emails in your workflow
            </p>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No steps added yet</p>
                <p className="text-sm">Click "Add Step" to create your first email step</p>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Step {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeStep(index)}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Email Template *</Label>
                        <Select
                          value={step.template_id}
                          onValueChange={(value) => updateStep(index, 'template_id', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTemplates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.metadata.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
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
                        <div className="space-y-2">
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

                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {step.delay_days > 0 && `${step.delay_days} day${step.delay_days > 1 ? 's' : ''} `}
                        {step.delay_hours > 0 && `${step.delay_hours} hour${step.delay_hours > 1 ? 's' : ''} `}
                        {step.delay_minutes > 0 && `${step.delay_minutes} minute${step.delay_minutes > 1 ? 's' : ''} `}
                        {step.delay_days === 0 && step.delay_hours === 0 && step.delay_minutes === 0 && 'Send immediately'}
                        after {index === 0 ? 'enrollment' : 'previous step'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Actions */}
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
            disabled={isSubmitting || !isFormValid}
            className="min-w-[140px]"
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
    </div>
  )
}