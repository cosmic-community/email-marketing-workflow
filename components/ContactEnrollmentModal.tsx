'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Users, Search, X } from 'lucide-react'
import { EmailContact } from '@/types'

export interface ContactEnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string
  workflowName: string
  onEnrollmentComplete: () => void
}

export default function ContactEnrollmentModal({
  isOpen,
  onClose,
  workflowId,
  workflowName,
  onEnrollmentComplete
}: ContactEnrollmentModalProps) {
  const [contacts, setContacts] = useState<EmailContact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalContacts, setTotalContacts] = useState(0)
  const limit = 20

  // Fetch contacts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchContacts()
    }
  }, [isOpen, searchTerm, currentPage])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setSelectedContacts([])
      setCurrentPage(1)
      setContacts([])
    }
  }, [isOpen])

  const fetchContacts = async () => {
    setIsLoading(true)
    try {
      const skip = (currentPage - 1) * limit
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString(),
        status: 'Active', // Only show active contacts
      })

      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      }

      const response = await fetch(`/api/contacts?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }

      const result = await response.json()
      setContacts(result.data.contacts || [])
      setTotalContacts(result.data.total || 0)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      alert('Failed to load contacts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactToggle = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId])
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map(contact => contact.id))
    } else {
      setSelectedContacts([])
    }
  }

  const handleEnroll = async () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact to enroll')
      return
    }

    setIsEnrolling(true)
    try {
      const response = await fetch(`/api/workflows/${workflowId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactIds: selectedContacts
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enroll contacts')
      }

      const result = await response.json()
      
      // Show success message
      alert(`Successfully enrolled ${result.data.enrolled} contact${result.data.enrolled > 1 ? 's' : ''} in the workflow!`)
      
      // Call completion callback and close modal
      onEnrollmentComplete()
      onClose()
    } catch (error) {
      console.error('Error enrolling contacts:', error)
      alert(error instanceof Error ? error.message : 'Failed to enroll contacts')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const clearSearch = () => {
    setSearchTerm('')
    setCurrentPage(1)
  }

  const isAllSelected = contacts.length > 0 && selectedContacts.length === contacts.length
  const isPartiallySelected = selectedContacts.length > 0 && selectedContacts.length < contacts.length
  const totalPages = Math.ceil(totalContacts / limit)

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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contacts by name or email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Select All */}
          {contacts.length > 0 && (
            <div className="flex items-center space-x-2 p-2 border-b">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className={isPartiallySelected ? "data-[state=indeterminate]:bg-blue-600" : ""}
              />
              <Label className="text-sm font-medium">
                Select All ({contacts.length} on this page)
              </Label>
            </div>
          )}

          {/* Contacts List */}
          <div className="max-h-[40vh] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-gray-600">Loading contacts...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {searchTerm ? 'No contacts found matching your search.' : 'No active contacts available.'}
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSearch}
                    className="mt-2"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              contacts.map((contact) => (
                <div key={contact.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={(checked) => handleContactToggle(contact.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.metadata.first_name} {contact.metadata.last_name}
                      </p>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        {contact.metadata.status.value}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {contact.metadata.email}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {currentPage} of {totalPages} ({totalContacts} total contacts)
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Selection Summary */}
          {selectedContacts.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected for enrollment
              </p>
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
            disabled={isEnrolling || selectedContacts.length === 0}
            className="min-w-[120px]"
          >
            {isEnrolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enrolling...
              </>
            ) : (
              `Enroll ${selectedContacts.length} Contact${selectedContacts.length > 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}