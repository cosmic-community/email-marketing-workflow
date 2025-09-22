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
import { Plus, Trash2, Clock, Mail, Calendar, Tags, Settings, Loader2, X } from 'lucide-react'
import { EmailTemplate, CreateWorkflowData, CreateWorkflowStepData } from '@/types'

interface WorkflowStep {
  id: string
  template_id: string
  template?: EmailTemplate
  delay_days: number
  delay_hours: number
  delay_minutes: number
  active: boolean
}

interface CreateWorkflowFormProps {
  onWorkflowCreated?: (workflow: any) => void
}

export default function CreateWorkflowForm({ onWorkflowCreated }: CreateWorkflowFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)

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
      id: 'step-1',
      template_id: '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 5,
      active: true
    }
  ])

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true)
      const response = await fetch('/api/templates')
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const result = await response.json()
      setTemplates(result.data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      alert('Failed to load templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      template_id: '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 5,
      active: true
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate all steps have templates selected
      const invalidSteps = steps.filter(step => !step.template_id || step.template_id.trim() === '')
      if (invalidSteps.length > 0) {
        throw new Error('Please select an email template for all steps')
      }

      // Convert steps to the format expected by the API, ensuring template_id is never undefined
      const stepsData: CreateWorkflowStepData[] = steps.map(step => {
        // Ensure template_id is defined and not empty
        if (!step.template_id || step.template_id.trim() === '') {
          throw new Error('Template ID is required for all steps')
        }

        return {
          template_id: step.template_id,
          delay_days: step.delay_days,
          delay_hours: step.delay_hours,
          delay_minutes: step.delay_minutes,
          active: step.active,
        }
      })

      const workflowData: CreateWorkflowData = {
        ...formData,
        steps: stepsData,
      }

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create workflow')
      }

      const result = await response.json()

      if (onWorkflowCreated) {
        onWorkflowCreated(result.data)
      }

      router.push('/workflows')
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to create workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedTemplate = (templateId: string): EmailTemplate | undefined => {
    return templates.find(t => t.id === templateId)
  }

  const formatDelayText = (days: number, hours: number, minutes: number): string => {
    const parts: string[] = []
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
    
    if (parts.length === 0) return 'Immediately'
    return parts.join(', ')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Email Workflow</h1>
        <p className="text-gray-600 mt-2">Set up an automated email sequence to engage your subscribers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Series, Onboarding Flow"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger_type">Trigger Type *</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, trigger_type: value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose and goal of this workflow..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Trigger Settings */}
            {formData.trigger_type === 'Date Based' && (
              <div className="space-y-2">
                <Label htmlFor="trigger_date">Trigger Date</Label>
                <Input
                  id="trigger_date"
                  type="date"
                  value={formData.trigger_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, trigger_date: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {formData.trigger_type === 'Tag Added' && (
              <div className="space-y-2">
                <Label htmlFor="trigger_tags">Trigger Tags (comma-separated)</Label>
                <Input
                  id="trigger_tags"
                  value={formData.trigger_tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    trigger_tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  placeholder="vip, premium, new-customer"
                  disabled={isSubmitting}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Workflow Steps ({steps.length})
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              disabled={isSubmitting || loadingTemplates}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent>
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-gray-600">No email templates found</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/templates/new')}
                >
                  Create Your First Template
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const selectedTemplate = getSelectedTemplate(step.template_id)
                  
                  return (
                    <div key={step.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <h4 className="font-medium text-gray-900">
                            Step {index + 1}
                          </h4>
                          <Badge variant={step.active ? "default" : "secondary"}>
                            {step.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {steps.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(step.id)}
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
                              <SelectValue placeholder="Select template..." />
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
                          {selectedTemplate && (
                            <p className="text-sm text-gray-600">
                              Subject: {selectedTemplate.metadata.subject}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Send After</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label htmlFor={`days-${step.id}`} className="text-xs text-gray-600">Days</Label>
                              <Input
                                id={`days-${step.id}`}
                                type="number"
                                min="0"
                                max="365"
                                value={step.delay_days}
                                onChange={(e) => updateStep(step.id, 'delay_days', parseInt(e.target.value) || 0)}
                                disabled={isSubmitting}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`hours-${step.id}`} className="text-xs text-gray-600">Hours</Label>
                              <Input
                                id={`hours-${step.id}`}
                                type="number"
                                min="0"
                                max="23"
                                value={step.delay_hours}
                                onChange={(e) => updateStep(step.id, 'delay_hours', parseInt(e.target.value) || 0)}
                                disabled={isSubmitting}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`minutes-${step.id}`} className="text-xs text-gray-600">Minutes</Label>
                              <Input
                                id={`minutes-${step.id}`}
                                type="number"
                                min="0"
                                max="59"
                                value={step.delay_minutes}
                                onChange={(e) => updateStep(step.id, 'delay_minutes', parseInt(e.target.value) || 0)}
                                disabled={isSubmitting}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {index === 0 
                              ? formatDelayText(step.delay_days, step.delay_hours, step.delay_minutes)
                              : `${formatDelayText(step.delay_days, step.delay_hours, step.delay_minutes)} after previous step`
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-${step.id}`}
                          checked={step.active}
                          onCheckedChange={(checked) => updateStep(step.id, 'active', checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor={`active-${step.id}`} className="text-sm">
                          Active Step
                        </Label>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
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
            disabled={isSubmitting || loadingTemplates || templates.length === 0 || !formData.name.trim()}
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
    </div>
  )
}