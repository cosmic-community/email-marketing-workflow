'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Search, Users, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { EmailContact } from '@/types'

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
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const itemsPerPage = 20

  // Fix for the indeterminate property error - use HTMLInputElement instead
  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setSelectedContacts(new Set())
      setCurrentPage(1)
      fetchContacts()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchContacts()
    }
  }, [searchTerm, currentPage, isOpen])

  // Update select all checkbox state
  useEffect(() => {
    if (selectAllRef.current) {
      const checkbox = selectAllRef.current
      if (selectedContacts.size === 0) {
        checkbox.checked = false
        checkbox.indeterminate = false
      } else if (selectedContacts.size === contacts.length && contacts.length > 0) {
        checkbox.checked = true
        checkbox.indeterminate = false
      } else {
        checkbox.checked = false
        checkbox.indeterminate = true
      }
    }
  }, [selectedContacts, contacts])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * itemsPerPage
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        skip: skip.toString(),
        status: 'Active'
      })

      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      }

      console.log('Fetching contacts with params:', params.toString())
      const response = await fetch(`/api/contacts?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Contacts API response:', result)
      
      // Handle the response structure properly
      const contactsData = result.data || result
      const contactsList = contactsData.contacts || contactsData || []
      const totalCount = contactsData.total || contactsList.length

      setContacts(contactsList)
      setTotal(totalCount)
      setHasNextPage(contactsList.length === itemsPerPage)
      
      console.log(`Loaded ${contactsList.length} contacts out of ${totalCount} total`)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      setContacts([])
      setTotal(0)
      setHasNextPage(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(new Set(contacts.map(contact => contact.id)))
    } else {
      setSelectedContacts(new Set())
    }
  }

  const handleContactToggle = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContacts)
    if (checked) {
      newSelected.add(contactId)
    } else {
      newSelected.delete(contactId)
    }
    setSelectedContacts(newSelected)
  }

  const handleEnroll = async () => {
    if (selectedContacts.size === 0) {
      alert('Please select at least one contact to enroll')
      return
    }

    setEnrolling(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const contactId of selectedContacts) {
        try {
          const response = await fetch(`/api/workflows/${workflowId}/enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_id: contactId })
          })

          if (response.ok) {
            successCount++
          } else {
            const error = await response.json()
            console.error(`Failed to enroll contact ${contactId}:`, error)
            errorCount++
          }
        } catch (error) {
          console.error(`Error enrolling contact ${contactId}:`, error)
          errorCount++
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        alert(`Successfully enrolled ${successCount} contact${successCount > 1 ? 's' : ''} in the workflow!`)
      } else if (successCount > 0 && errorCount > 0) {
        alert(`Enrolled ${successCount} contact${successCount > 1 ? 's' : ''} successfully, but ${errorCount} failed.`)
      } else {
        alert('Failed to enroll contacts. Please try again.')
      }

      // Close modal and refresh
      onClose()
      router.refresh()

    } catch (error) {
      console.error('Error during enrollment:', error)
      alert('An error occurred during enrollment. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const filteredTotal = total
  const selectedCount = selectedContacts.size

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Enroll Contacts in Workflow
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Add contacts to "{workflowName}" workflow
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search contacts by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
              disabled={loading || enrolling}
            />
          </div>

          {/* Select All */}
          {contacts.length > 0 && (
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-2">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  disabled={loading || enrolling}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">
                  Select All ({contacts.length} on this page)
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {selectedCount} selected • {filteredTotal} total active contacts
              </div>
            </div>
          )}

          {/* Contacts List */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-gray-600">Loading contacts...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-600 mt-2">
                  {searchTerm ? 'No contacts found matching your search.' : 'No active contacts found.'}
                </p>
                {!searchTerm && (
                  <p className="text-sm text-gray-500 mt-1">
                    Create some contacts first to enroll them in workflows.
                  </p>
                )}
              </div>
            ) : (
              contacts.map(contact => (
                <div key={contact.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={contact.id}
                    checked={selectedContacts.has(contact.id)}
                    onCheckedChange={(checked) => handleContactToggle(contact.id, checked as boolean)}
                    disabled={loading || enrolling}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <label 
                        htmlFor={contact.id}
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {contact.metadata.first_name} {contact.metadata.last_name || ''}
                      </label>
                      <div className="flex items-center space-x-2">
                        {contact.metadata.status.value === 'Active' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {contact.metadata.status.value}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {contact.metadata.email}
                    </p>
                    {contact.metadata.tags && contact.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contact.metadata.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {tag}
                          </span>
                        ))}
                        {contact.metadata.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{contact.metadata.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && contacts.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading || enrolling}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} • {filteredTotal} total contacts
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!hasNextPage || loading || enrolling}
              >
                Next
              </Button>
            </div>
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
            disabled={selectedCount === 0 || enrolling}
            className="min-w-[120px]"
          >
            {enrolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enrolling...
              </>
            ) : (
              `Enroll ${selectedCount} Contact${selectedCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}