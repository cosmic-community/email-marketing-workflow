'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EmailContact } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Search, Loader2, Users, Mail } from 'lucide-react'

interface ContactEnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string
  workflowName: string
}

export function ContactEnrollmentModal({ 
  isOpen, 
  onClose, 
  workflowId, 
  workflowName 
}: ContactEnrollmentModalProps) {
  const router = useRouter()
  const [contacts, setContacts] = useState<EmailContact[]>([])
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchContacts()
    }
  }, [isOpen])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contacts?limit=100&status=Active')
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }

      const result = await response.json()
      setContacts(result.data.contacts || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
      alert('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleContactToggle = (contactId: string, checked: boolean) => {
    setSelectedContactIds(prev => 
      checked 
        ? [...prev, contactId]
        : prev.filter(id => id !== contactId)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContactIds(filteredContacts.map(c => c.id))
    } else {
      setSelectedContactIds([])
    }
  }

  const handleEnroll = async () => {
    if (selectedContactIds.length === 0) return

    try {
      setEnrolling(true)
      
      const response = await fetch(`/api/workflows/${workflowId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_ids: selectedContactIds }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enroll contacts')
      }

      const result = await response.json()
      alert(result.message || 'Contacts enrolled successfully!')
      
      // Reset state
      setSelectedContactIds([])
      setSearchTerm('')
      onClose()
      
      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error('Error enrolling contacts:', error)
      alert(error instanceof Error ? error.message : 'Failed to enroll contacts')
    } finally {
      setEnrolling(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase()
    const firstName = contact.metadata.first_name?.toLowerCase() || ''
    const lastName = contact.metadata.last_name?.toLowerCase() || ''
    const email = contact.metadata.email?.toLowerCase() || ''
    
    return firstName.includes(searchLower) || 
           lastName.includes(searchLower) || 
           email.includes(searchLower)
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Enroll Contacts in Workflow
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Select contacts to enroll in "{workflowName}"
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search contacts by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={loading || enrolling}
            />
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-gray-600">Loading contacts...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No matching contacts' : 'No active contacts found'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Add some contacts first to enroll them in workflows'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedContactIds.length === filteredContacts.length && filteredContacts.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={enrolling}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Select All ({filteredContacts.length})
                  </label>
                </div>
                <Badge variant="outline">
                  {selectedContactIds.length} selected
                </Badge>
              </div>

              {/* Contact List */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredContacts.map(contact => (
                  <div key={contact.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={contact.id}
                      checked={selectedContactIds.includes(contact.id)}
                      onCheckedChange={(checked) => handleContactToggle(contact.id, checked as boolean)}
                      disabled={enrolling}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <label 
                          htmlFor={contact.id}
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {contact.metadata.first_name} {contact.metadata.last_name}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {contact.metadata.status.value}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <Mail className="w-3 h-3" />
                        {contact.metadata.email}
                      </div>
                      {contact.metadata.tags && contact.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contact.metadata.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {contact.metadata.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{contact.metadata.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={enrolling}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={selectedContactIds.length === 0 || enrolling}
            className="min-w-[120px]"
          >
            {enrolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Enroll {selectedContactIds.length} Contact{selectedContactIds.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}