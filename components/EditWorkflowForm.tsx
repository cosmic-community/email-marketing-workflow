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
import { Loader2, Plus, Trash2, GripVertical, Calendar, Users, Tag, ArrowRight } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, EmailList, WorkflowStep, CreateWorkflowStepData } from '@/types'

interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  templates: EmailTemplate[]
}

export default function EditWorkflowForm({ workflow, templates }: EditWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableLists, setAvailableLists] = useState<EmailList[]>([])
  const [loadingLists, setLoadingLists] = useState(true)

  const [formData, setFormData] = useState({
    name: workflow.metadata.name,
    description: workflow.metadata.description || '',
    status: workflow.metadata.status.value,
    trigger_type: workflow.metadata.trigger_type.value,
    trigger_lists: workflow.metadata.trigger_lists || [],
    trigger_tags: workflow.metadata.trigger_tags || [],
    trigger_date: workflow.metadata.trigger_date || '',
    steps: workflow.metadata.steps || []
  })

  // Custom tags state for tag input
  const [customTags, setCustomTags] = useState<string[]>(workflow.metadata.trigger_tags || [])
  const [tagInput, setTagInput] = useState('')

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
    } finally {
      setLoadingLists(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Workflow name is required')
      return
    }

    if (formData.steps.length === 0) {
      alert('At least one workflow step is required')
      return
    }

    // Validate that all steps have templates
    const hasInvalidSteps = formData.steps.some(step => !step.template_id)
    if (hasInvalidSteps) {
      alert('All workflow steps must have a template selected')
      return
    }

    setIsSubmitting(true)

    try {
      // Convert steps to the format expected by the API
      const stepsData: CreateWorkflowStepData[] = formData.steps.map(step => ({
        template_id: step.template_id,
        delay_days: step.delay_days,
        delay_hours: step.delay_hours,
        delay_minutes: step.delay_minutes,
        active: step.active,
      }))

      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          trigger_type: formData.trigger_type,
          trigger_lists: formData.trigger_lists,
          trigger_tags: customTags,
          trigger_date: formData.trigger_date,
          steps: stepsData,
        }),
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Step management functions
  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `temp-${Date.now()}`,
      step_number: formData.steps.length + 1,
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

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        step_number: i + 1
      }))
    }))
  }

  const updateStep = (index: number, field: keyof WorkflowStep, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => {
        if (i === index) {
          return { ...step, [field]: value }
        }
        return step
      })
    }))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.steps.length - 1)
    ) {
      return
    }

    const newSteps = [...formData.steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    // Swap steps
    ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]

    // Update step numbers
    newSteps.forEach((step, i) => {
      step.step_number = i + 1
    })

    setFormData(prev => ({ ...prev, steps: newSteps }))
  }

  // Tag management functions
  const addTag = () => {
    if (tagInput.trim() && !customTags.includes(tagInput.trim())) {
      setCustomTags(prev => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setCustomTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  // Get template name by ID
  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    return template ? template.metadata.name : 'Unknown Template'
  }

  // Calculate total delay for a step
  const calculateTotalDelay = (step: WorkflowStep) => {
    const totalMinutes = (step.delay_days * 24 * 60) + (step.delay_hours * 60) + step.delay_minutes
    
    if (totalMinutes === 0) return 'Immediately'
    
    const days = Math.floor(totalMinutes / (24 * 60))
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
    const minutes = totalMinutes % 60
    
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    
    return parts.join(' ')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Workflow</h1>
        <p className="text-gray-600 mt-2">Update your automated email sequence</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Welcome Series"
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
                placeholder="Describe what this workflow does..."
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
              <Users className="w-5 h-5" />
              Trigger Settings
            </CardTitle>
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

            {/* Conditional trigger settings */}
            {formData.trigger_type === 'List Subscribe' && (
              <div className="space-y-2">
                <Label>Trigger Lists</Label>
                {loadingLists ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading lists...
                  </div>
                ) : (
                  <Select 
                    value={formData.trigger_lists.length > 0 ? formData.trigger_lists[0] : ''} 
                    onValueChange={(value) => handleInputChange('trigger_lists', value ? [value] : [])}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a list" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLists.map(list => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.metadata.name} ({list.metadata.total_contacts || 0} contacts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {formData.trigger_type === 'Tag Added' && (
              <div className="space-y-2">
                <Label>Trigger Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {customTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-gray-500 hover:text-red-500"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Enter tag name..."
                    disabled={isSubmitting}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addTag}
                    disabled={!tagInput.trim() || isSubmitting}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Workflow Steps</CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={addStep}
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent>
            {formData.steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No steps defined yet.</p>
                <p className="text-sm">Click "Add Step" to create your first workflow step.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.steps.map((step, index) => {
                  // Check if step exists (not undefined)
                  if (!step) {
                    return null;
                  }

                  return (
                    <div key={step.id || index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start gap-4">
                        {/* Step number and drag handle */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {step.step_number}
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStep(index, 'up')}
                              disabled={index === 0 || isSubmitting}
                              className="h-6 w-6 p-0"
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStep(index, 'down')}
                              disabled={index === formData.steps.length - 1 || isSubmitting}
                              className="h-6 w-6 p-0"
                            >
                              ↓
                            </Button>
                          </div>
                        </div>

                        {/* Step content */}
                        <div className="flex-1 space-y-4">
                          {/* Template selection */}
                          <div className="space-y-2">
                            <Label>Email Template *</Label>
                            <Select 
                              value={step.template_id || ''} 
                              onValueChange={(value) => updateStep(index, 'template_id', value)}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                              <SelectContent>
                                {templates.map(template => (
                                  <SelectItem key={template.id} value={template.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{template.metadata.name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {template.metadata.template_type.value}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Delay settings */}
                          <div className="space-y-2">
                            <Label>Send After</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600">Days</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={step.delay_days}
                                  onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Hours</Label>
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
                                <Label className="text-xs text-gray-600">Minutes</Label>
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
                            <p className="text-xs text-gray-600">
                              Total delay: {calculateTotalDelay(step)}
                            </p>
                          </div>

                          {/* Step settings */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`step-${index}-active`}
                                checked={step.active}
                                onCheckedChange={(checked) => updateStep(index, 'active', checked)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor={`step-${index}-active`} className="text-sm">
                                Active
                              </Label>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStep(index)}
                              disabled={isSubmitting}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Arrow to next step */}
                      {index < formData.steps.length - 1 && (
                        <div className="flex justify-center mt-4">
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6">
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
    </div>
  )
}