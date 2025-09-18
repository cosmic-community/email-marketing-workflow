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
import { 
  Plus, 
  Trash2, 
  Mail, 
  Clock, 
  Users, 
  Tag,
  Calendar,
  GripVertical,
  Loader2
} from 'lucide-react'
import { EmailTemplate, EmailList, CreateWorkflowStepData } from '@/types'

export function CreateWorkflowForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [lists, setLists] = useState<EmailList[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [listsLoading, setListsLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'Manual' as 'Manual' | 'List Subscribe' | 'Tag Added' | 'Date Based',
    trigger_lists: [] as string[],
    trigger_tags: [] as string[],
    trigger_date: '',
    steps: [
      {
        template_id: '',
        delay_days: 0,
        delay_hours: 0,
        delay_minutes: 5,
        active: true,
      }
    ] as CreateWorkflowStepData[]
  })

  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    fetchTemplates()
    fetchLists()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const result = await response.json()
        setTemplates(result.data.filter((t: EmailTemplate) => t.metadata.active))
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setTemplatesLoading(false)
    }
  }

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const result = await response.json()
        setLists(result.data.filter((l: EmailList) => l.metadata.active))
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setListsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          template_id: '',
          delay_days: 1,
          delay_hours: 0,
          delay_minutes: 0,
          active: true,
        }
      ]
    }))
  }

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      setFormData(prev => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index)
      }))
    }
  }

  const updateStep = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      alert(error instanceof Error ? error.message : 'Failed to create workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.steps.length > 0 &&
      formData.steps.every(step => 
        step.template_id && 
        (step.delay_days + step.delay_hours + step.delay_minutes > 0 || formData.steps.indexOf(step) === 0)
      )
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
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
              placeholder="e.g., Welcome Email Series, Product Onboarding"
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
              placeholder="Describe what this workflow accomplishes..."
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
            <Label htmlFor="trigger_type">When should this workflow start? *</Label>
            <Select 
              value={formData.trigger_type} 
              onValueChange={(value) => handleInputChange('trigger_type', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual - Start manually for selected contacts</SelectItem>
                <SelectItem value="List Subscribe">List Subscribe - When someone joins a specific list</SelectItem>
                <SelectItem value="Tag Added">Tag Added - When a specific tag is added to a contact</SelectItem>
                <SelectItem value="Date Based">Date Based - Start on a specific date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List Subscribe Settings */}
          {formData.trigger_type === 'List Subscribe' && (
            <div className="space-y-3">
              <Label>Select Lists</Label>
              {listsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading lists...
                </div>
              ) : lists.length === 0 ? (
                <p className="text-gray-500 text-sm">No active lists available</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {lists.map(list => (
                    <div
                      key={list.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.trigger_lists.includes(list.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleList(list.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{list.metadata.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {list.metadata.total_contacts || 0}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tag Added Settings */}
          {formData.trigger_type === 'Tag Added' && (
            <div className="space-y-3">
              <Label>Trigger Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag name"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  disabled={isSubmitting}
                />
                <Button type="button" onClick={addTag} disabled={!newTag.trim() || isSubmitting}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.trigger_tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                      disabled={isSubmitting}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Date Based Settings */}
          {formData.trigger_type === 'Date Based' && (
            <div className="space-y-2">
              <Label htmlFor="trigger_date">Start Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Input
                  id="trigger_date"
                  type="date"
                  value={formData.trigger_date}
                  onChange={(e) => handleInputChange('trigger_date', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.steps.map((step, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Step {index + 1}</span>
                  <Badge variant={step.active ? "default" : "secondary"}>
                    {step.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={step.active}
                    onCheckedChange={(checked) => updateStep(index, 'active', checked)}
                    disabled={isSubmitting}
                  />
                  {formData.steps.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStep(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Template *</Label>
                  <Select 
                    value={step.template_id} 
                    onValueChange={(value) => updateStep(index, 'template_id', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading...
                        </div>
                      ) : templates.length === 0 ? (
                        <div className="p-2 text-gray-500 text-sm">No active templates available</div>
                      ) : (
                        templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.metadata.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Delay {index === 0 ? '(from enrollment)' : '(from previous email)'}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Input
                        type="number"
                        min="0"
                        max="365"
                        value={step.delay_days}
                        onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                        placeholder="Days"
                        disabled={isSubmitting}
                      />
                      <Label className="text-xs text-gray-500">Days</Label>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={step.delay_hours}
                        onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)}
                        placeholder="Hours"
                        disabled={isSubmitting}
                      />
                      <Label className="text-xs text-gray-500">Hours</Label>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={step.delay_minutes}
                        onChange={(e) => updateStep(index, 'delay_minutes', parseInt(e.target.value) || 0)}
                        placeholder="Minutes"
                        disabled={isSubmitting}
                      />
                      <Label className="text-xs text-gray-500">Minutes</Label>
                    </div>
                  </div>
                  {index === 0 && (step.delay_days + step.delay_hours + step.delay_minutes === 0) && (
                    <p className="text-xs text-blue-600">First step will send immediately upon enrollment</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addStep}
            className="w-full"
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Step
          </Button>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
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
          disabled={isSubmitting || !isFormValid()}
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