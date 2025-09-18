'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EmailContact } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Users, Search } from 'lucide-react'

interface ContactEnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string
  workflowName: string
}

export default function ContactEnrollmentModal({
  isOpen,
  onClose,
  workflowId,
  workflowName
}: ContactEnrollmentModalProps) {
  const router = useRouter()
  const [contacts, setContacts] = useState<EmailContact[]>([])
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch available contacts
  useEffect(() => {
    if (isOpen) {
      fetchContacts()
    }
  }, [isOpen])

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true)
      const response = await fetch('/api/contacts?status=Active&limit=100')
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }

      const result = await response.json()
      setContacts(result.data.contacts || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
      alert('Failed to load contacts')
    } finally {
      setLoadingContacts(false)
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
      const filteredContacts = getFilteredContacts()
      setSelectedContactIds(filteredContacts.map(contact => contact.id))
    } else {
      setSelectedContactIds([])
    }
  }

  const getFilteredContacts = () => {
    if (!searchTerm.trim()) return contacts

    const searchLower = searchTerm.toLowerCase()
    return contacts.filter(contact => {
      const firstName = contact.metadata.first_name?.toLowerCase() || ''
      const lastName = contact.metadata.last_name?.toLowerCase() || ''
      const email = contact.metadata.email?.toLowerCase() || ''

      return firstName.includes(searchLower) ||
             lastName.includes(searchLower) ||
             email.includes(searchLower)
    })
  }

  const handleEnroll = async () => {
    if (selectedContactIds.length === 0) {
      alert('Please select at least one contact to enroll')
      return
    }

    setIsEnrolling(true)
    let successCount = 0
    let errorCount = 0

    try {
      // Enroll contacts one by one
      for (const contactId of selectedContactIds) {
        try {
          const response = await fetch(`/api/workflows/${workflowId}/enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_id: contactId }),
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to enroll contact ${contactId}`)
          }
        } catch (error) {
          errorCount++
          console.error(`Error enrolling contact ${contactId}:`, error)
        }
      }

      // Show results
      if (successCount > 0) {
        alert(`Successfully enrolled ${successCount} contact${successCount > 1 ? 's' : ''} in the workflow${errorCount > 0 ? `. ${errorCount} failed.` : '.'}`)
      } else {
        alert('Failed to enroll any contacts. Please try again.')
      }

      // Reset and close
      setSelectedContactIds([])
      onClose()

      // Refresh the page to show updated data
      router.refresh()

    } catch (error) {
      console.error('Error enrolling contacts:', error)
      alert('Failed to enroll contacts. Please try again.')
    } finally {
      setIsEnrolling(false)
    }
  }

  const filteredContacts = getFilteredContacts()
  const allFilteredSelected = filteredContacts.length > 0 && filteredContacts.every(contact => selectedContactIds.includes(contact.id))
  const someFilteredSelected = filteredContacts.some(contact => selectedContactIds.includes(contact.id))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Enroll Contacts in Workflow
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Select contacts to enroll in "{workflowName}"
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts by name or email..."
              className="pl-10"
              disabled={loadingContacts || isEnrolling}
            />
          </div>

          {/* Contacts List */}
          <div className="max-h-[400px] overflow-y-auto border rounded-lg">
            {loadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-gray-600">Loading contacts...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {searchTerm ? 'No contacts found matching your search' : 'No active contacts found'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {/* Select All */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected
                    }}
                    onCheckedChange={handleSelectAll}
                    disabled={isEnrolling}
                  />
                  <Label className="font-medium">
                    Select All ({filteredContacts.length} contacts)
                  </Label>
                </div>

                {/* Individual Contacts */}
                {filteredContacts.map(contact => (
                  <div key={contact.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      checked={selectedContactIds.includes(contact.id)}
                      onCheckedChange={(checked) => handleContactToggle(contact.id, checked as boolean)}
                      disabled={isEnrolling}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {contact.metadata.first_name} {contact.metadata.last_name}
                        </p>
                        <div className="flex items-center space-x-2">
                          {contact.metadata.lists && contact.metadata.lists.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {contact.metadata.lists.length} list{contact.metadata.lists.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {contact.metadata.tags && contact.metadata.tags.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                              Tagged
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {contact.metadata.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedContactIds.length > 0 && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <strong>{selectedContactIds.length}</strong> contact{selectedContactIds.length > 1 ? 's' : ''} selected for enrollment
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isEnrolling}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={isEnrolling || selectedContactIds.length === 0}
            className="min-w-[120px]"
          >
            {isEnrolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enrolling...
              </>
            ) : (
              `Enroll ${selectedContactIds.length} Contact${selectedContactIds.length > 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}