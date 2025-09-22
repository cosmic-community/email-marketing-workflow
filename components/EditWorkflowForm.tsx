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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Plus, Trash2, Save, ArrowLeft, Clock, Mail, Target, Users, Tags } from 'lucide-react'
import { EmailWorkflow, EmailTemplate, EmailList, CreateWorkflowStepData, UpdateWorkflowData } from '@/types'

export interface EditWorkflowFormProps {
  workflow: EmailWorkflow
  availableTemplates: EmailTemplate[]
  availableLists: EmailList[]
}

export default function EditWorkflowForm({ workflow, availableTemplates, availableLists }: EditWorkflowFormProps) {
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
      active: step.active,
    }))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name?.trim()) {
      alert('Please enter a workflow name')
      return
    }

    if (!formData.steps || formData.steps.length === 0) {
      alert('Please add at least one step to the workflow')
      return
    }

    // Validate that all steps have templates
    const invalidSteps = formData.steps.filter(step => !step.template_id)
    if (invalidSteps.length > 0) {
      alert('Please select a template for all workflow steps')
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

      router.push(`/workflows/${workflow.id}`)
      router.refresh()

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

  const handleStepChange = (stepIndex: number, field: keyof CreateWorkflowStepData, value: any) => {
    if (!formData.steps) return
    
    const newSteps = [...formData.steps]
    newSteps[stepIndex] = { ...newSteps[stepIndex], [field]: value }
    setFormData(prev => ({ ...prev, steps: newSteps }))
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

  const removeStep = (stepIndex: number) => {
    if (!formData.steps) return
    
    const newSteps = formData.steps.filter((_, index) => index !== stepIndex)
    setFormData(prev => ({ ...prev, steps: newSteps }))
  }

  const getTemplateName = (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId)
    return template ? template.metadata.name : 'Select Template'
  }

  const getListName = (listId: string) => {
    const list = availableLists.find(l => l.id === listId)
    return list ? list.metadata.name : 'Unknown List'
  }

  const calculateTotalDelay = (step: CreateWorkflowStepData) => {
    const totalMinutes = (step.delay_days * 24 * 60) + (step.delay_hours * 60) + step.delay_minutes
    
    if (totalMinutes < 60) {
      return `${totalMinutes}m`
    } else if (totalMinutes < 1440) {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    } else {
      const days = Math.floor(totalMinutes / 1440)
      const remainingMinutes = totalMinutes % 1440
      const hours = Math.floor(remainingMinutes / 60)
      const minutes = remainingMinutes % 60
      
      let result = `${days}d`
      if (hours > 0) result += ` ${hours}h`
      if (minutes > 0) result += ` ${minutes}m`
      return result
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/workflows/${workflow.id}`)}
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workflow
        </Button>
        
        <div className="flex items-center space-x-3">
          <Badge variant={formData.status === 'Active' ? 'default' : 'secondary'}>
            {formData.status}
          </Badge>
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
          <TabsTrigger value="steps">Email Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workflow Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Welcome Series, Product Launch"
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
                  placeholder="Describe the purpose and goals of this workflow..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Workflow Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {formData.trigger_type === 'List Subscribe' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Trigger Lists
                  </Label>
                  <div className="space-y-2">
                    {availableLists.map(list => (
                      <div key={list.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`trigger-list-${list.id}`}
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
                        <label htmlFor={`trigger-list-${list.id}`} className="text-sm cursor-pointer">
                          {list.metadata.name}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {list.metadata.total_contacts || 0} contacts
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.trigger_type === 'Tag Added' && (
                <div className="space-y-2">
                  <Label htmlFor="trigger_tags" className="flex items-center gap-2">
                    <Tags className="w-4 h-4" />
                    Trigger Tags
                  </Label>
                  <Input
                    id="trigger_tags"
                    value={formData.trigger_tags?.join(', ') || ''}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      handleInputChange('trigger_tags', tags)
                    }}
                    placeholder="Enter tags separated by commas"
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
                    value={formData.trigger_date}
                    onChange={(e) => handleInputChange('trigger_date', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Steps
                </CardTitle>
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
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No email steps added yet</p>
                  <p className="text-sm">Click "Add Step" to create your first email</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-medium text-sm">
                            {index + 1}
                          </div>
                          <h4 className="font-medium">Email Step {index + 1}</h4>
                          {calculateTotalDelay(step) !== '0m' && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Delay: {calculateTotalDelay(step)}
                            </Badge>
                          )}
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={step.active}
                              onCheckedChange={(checked) => handleStepChange(index, 'active', checked)}
                              disabled={isSubmitting}
                            />
                            <span className="text-sm text-gray-600">Active</span>
                          </div>
                        </div>
                        {formData.steps && formData.steps.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeStep(index)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email Template *</Label>
                          <Select
                            value={step.template_id}
                            onValueChange={(value) => handleStepChange(index, 'template_id', value)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select template">
                                {step.template_id ? getTemplateName(step.template_id) : 'Select Template'}
                              </SelectValue>
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

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Send Delay</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Days</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={step.delay_days}
                                  onChange={(e) => handleStepChange(index, 'delay_days', parseInt(e.target.value) || 0)}
                                  disabled={isSubmitting}
                                  className="text-center"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Hours</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="23"
                                  value={step.delay_hours}
                                  onChange={(e) => handleStepChange(index, 'delay_hours', parseInt(e.target.value) || 0)}
                                  disabled={isSubmitting}
                                  className="text-center"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Minutes</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={step.delay_minutes}
                                  onChange={(e) => handleStepChange(index, 'delay_minutes', parseInt(e.target.value) || 0)}
                                  disabled={isSubmitting}
                                  className="text-center"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {index < (formData.steps?.length || 0) - 1 && (
                        <div className="flex justify-center pt-2">
                          <div className="w-px h-6 bg-gray-300"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}