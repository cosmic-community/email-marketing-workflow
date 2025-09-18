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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, GripVertical, Save, ArrowLeft } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, EmailList, CreateWorkflowData, UpdateWorkflowData, CreateWorkflowStepData } from '@/types'

export interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  onUpdate?: (workflow: EmailWorkflow) => void
  onCancel?: () => void
}

export default function EditWorkflowForm({ 
  workflow, 
  onUpdate, 
  onCancel 
}: EditWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [lists, setLists] = useState<EmailList[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form state
  const [formData, setFormData] = useState<UpdateWorkflowData>({
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
    })),
  })

  // Load templates and lists
  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesRes, listsRes] = await Promise.all([
          fetch('/api/templates'),
          fetch('/api/lists')
        ])

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json()
          setTemplates(templatesData.data || [])
        }

        if (listsRes.ok) {
          const listsData = await listsRes.json()
          setLists(listsData.data || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.name?.trim()) {
        throw new Error('Workflow name is required')
      }

      if (!formData.steps || formData.steps.length === 0) {
        throw new Error('At least one workflow step is required')
      }

      // Validate each step
      for (const step of formData.steps) {
        if (!step.template_id) {
          throw new Error('Each step must have a template selected')
        }
      }

      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update workflow')
      }

      const result = await response.json()

      if (onUpdate) {
        onUpdate(result.data)
      } else {
        router.push('/workflows')
      }

    } catch (error) {
      console.error('Error updating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to update workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof UpdateWorkflowData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStepChange = (index: number, field: keyof CreateWorkflowStepData, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      ) || []
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
      steps: [...(prev.steps || []), newStep]
    }))
  }

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index) || []
    }))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const steps = formData.steps || []
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return
    }

    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
    
    setFormData(prev => ({ ...prev, steps: newSteps }))
  }

  const calculateTotalDelay = (step: CreateWorkflowStepData) => {
    const totalMinutes = step.delay_days * 24 * 60 + step.delay_hours * 60 + step.delay_minutes
    
    if (totalMinutes === 0) return 'Immediate'
    
    const days = Math.floor(totalMinutes / (24 * 60))
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
    const minutes = totalMinutes % 60
    
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    
    return parts.join(' ')
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading workflow data...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Workflow</h1>
          <p className="text-gray-600 mt-1">Update your automated email sequence</p>
        </div>
        <Button variant="outline" onClick={onCancel || (() => router.back())}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
            <TabsTrigger value="steps">Steps</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
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
                    placeholder="Describe what this workflow does..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="triggers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Triggers</CardTitle>
                <p className="text-sm text-gray-600">Define when contacts enter this workflow</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trigger_type">Trigger Type *</Label>
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

                {formData.trigger_type === 'List Subscribe' && (
                  <div className="space-y-2">
                    <Label>Trigger Lists</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {lists.map(list => (
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
                            className="rounded"
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
                    <Label htmlFor="trigger_tags">Trigger Tags (comma-separated)</Label>
                    <Input
                      id="trigger_tags"
                      value={formData.trigger_tags?.join(', ') || ''}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                        handleInputChange('trigger_tags', tags)
                      }}
                      placeholder="e.g., new-customer, vip, interested"
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
          </TabsContent>

          <TabsContent value="steps" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Workflow Steps</CardTitle>
                    <p className="text-sm text-gray-600">Define the sequence of emails in this workflow</p>
                  </div>
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
                {(!formData.steps || formData.steps.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No steps defined yet</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addStep}
                      disabled={isSubmitting}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Step
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.steps.map((step, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">Step {index + 1}</Badge>
                            <span className="text-sm text-gray-500">
                              Delay: {calculateTotalDelay(step)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveStep(index, 'up')}
                              disabled={index === 0 || isSubmitting}
                            >
                              <GripVertical className="w-4 h-4" />
                            </Button>
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
                              onValueChange={(value) => handleStepChange(index, 'template_id', value)}
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
                            <Label>Status</Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={step.active}
                                onCheckedChange={(checked) => handleStepChange(index, 'active', checked)}
                                disabled={isSubmitting}
                              />
                              <span className="text-sm">{step.active ? 'Active' : 'Inactive'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Delay Days</Label>
                            <Input
                              type="number"
                              min="0"
                              value={step.delay_days}
                              onChange={(e) => handleStepChange(index, 'delay_days', parseInt(e.target.value) || 0)}
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
                              onChange={(e) => handleStepChange(index, 'delay_hours', parseInt(e.target.value) || 0)}
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
                              onChange={(e) => handleStepChange(index, 'delay_minutes', parseInt(e.target.value) || 0)}
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.back())}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.name?.trim() || !formData.steps?.length}
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
    </div>
  )
}