'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, Users, Search } from 'lucide-react'
import { EmailContact } from '@/types'

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
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)

  // Fetch contacts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchContacts()
    }
  }, [isOpen])

  const fetchContacts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        status: 'Active',
        limit: '100'
      })
      
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      }

      const response = await fetch(`/api/contacts?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }

      const result = await response.json()
      setContacts(result.data?.contacts || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
      alert('Failed to load contacts')
    } finally {
      setIsLoading(false)
    }
  }

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen) {
        fetchContacts()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleContactToggle = (contactId: string, checked: boolean) => {
    setSelectedContacts(prev => 
      checked 
        ? [...prev, contactId]
        : prev.filter(id => id !== contactId)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedContacts(checked ? contacts.map(c => c.id) : [])
  }

  const handleEnroll = async () => {
    if (selectedContacts.length === 0) return

    setIsEnrolling(true)
    try {
      const response = await fetch(`/api/workflows/${workflowId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_ids: selectedContacts }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enroll contacts')
      }

      const result = await response.json()
      
      alert(`Successfully enrolled ${result.data.enrolled} contact(s) in the workflow`)
      
      // Reset and close
      setSelectedContacts([])
      onClose()
      router.refresh()

    } catch (error) {
      console.error('Error enrolling contacts:', error)
      alert(error instanceof Error ? error.message : 'Failed to enroll contacts')
    } finally {
      setIsEnrolling(false)
    }
  }

  const isAllSelected = contacts.length > 0 && selectedContacts.length === contacts.length
  const isPartiallySelected = selectedContacts.length > 0 && selectedContacts.length < contacts.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Enroll Contacts in "{workflowName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Contacts List */}
          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-gray-600">Loading contacts...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No active contacts found</p>
                {searchTerm && (
                  <p className="text-sm mt-1">Try adjusting your search</p>
                )}
              </div>
            ) : (
              <div className="space-y-0">
                {/* Select All Header */}
                <div className="border-b p-3 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      className={
                        isPartiallySelected
                          ? "data-[state=indeterminate]:bg-blue-600"
                          : ""
                      }
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({contacts.length} contacts)
                    </span>
                  </div>
                </div>

                {/* Contact Items */}
                {contacts.map(contact => (
                  <div key={contact.id} className="p-3 hover:bg-gray-50 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => handleContactToggle(contact.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {contact.metadata.first_name} {contact.metadata.last_name}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {contact.metadata.status.value}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {contact.metadata.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selection Summary */}
          {selectedContacts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
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

export default ContactEnrollmentModal