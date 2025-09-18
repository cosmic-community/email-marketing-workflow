'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, Search, UserPlus } from 'lucide-react'
import { EmailContact, EmailList } from '@/types'

interface ContactEnrollmentModalProps {
  workflowId: string
  workflowName: string
  isOpen: boolean
  onClose: () => void
}

export function ContactEnrollmentModal({
  workflowId,
  workflowName,
  isOpen,
  onClose
}: ContactEnrollmentModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [contacts, setContacts] = useState<EmailContact[]>([])
  const [lists, setLists] = useState<EmailList[]>([])
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      
      const [contactsResponse, listsResponse] = await Promise.all([
        fetch('/api/contacts?limit=100'),
        fetch('/api/lists')
      ])

      if (contactsResponse.ok) {
        const contactsResult = await contactsResponse.json()
        setContacts(contactsResult.data.contacts || [])
      }

      if (listsResponse.ok) {
        const listsResult = await listsResponse.json()
        setLists(listsResult.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      contact.metadata.first_name?.toLowerCase().includes(searchLower) ||
      contact.metadata.last_name?.toLowerCase().includes(searchLower) ||
      contact.metadata.email?.toLowerCase().includes(searchLower)
    )
  })

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const handleListToggle = (listId: string) => {
    setSelectedLists(prev => 
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    )
  }

  const handleEnrollContacts = async () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact to enroll')
      return
    }

    try {
      setIsLoading(true)

      // Enroll each selected contact
      const enrollmentPromises = selectedContacts.map(contactId =>
        fetch(`/api/workflows/${workflowId}/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact_id: contactId }),
        })
      )

      const results = await Promise.allSettled(enrollmentPromises)
      
      const successCount = results.filter(result => result.status === 'fulfilled').length
      const errorCount = results.filter(result => result.status === 'rejected').length

      if (successCount > 0) {
        alert(`Successfully enrolled ${successCount} contact${successCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`)
        onClose()
        router.refresh()
      } else {
        alert('Failed to enroll any contacts. Please try again.')
      }
    } catch (error) {
      console.error('Error enrolling contacts:', error)
      alert('Failed to enroll contacts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnrollFromLists = async () => {
    if (selectedLists.length === 0) {
      alert('Please select at least one list')
      return
    }

    try {
      setIsLoading(true)

      // Get contacts from selected lists
      const listContactPromises = selectedLists.map(async listId => {
        const response = await fetch(`/api/contacts?list_id=${listId}&limit=1000`)
        if (response.ok) {
          const result = await response.json()
          return result.data.contacts || []
        }
        return []
      })

      const listContactResults = await Promise.all(listContactPromises)
      const allListContacts = listContactResults.flat()
      
      // Remove duplicates
      const uniqueContacts = allListContacts.filter((contact, index, arr) => 
        arr.findIndex(c => c.id === contact.id) === index
      )

      if (uniqueContacts.length === 0) {
        alert('No contacts found in selected lists')
        return
      }

      // Enroll all unique contacts
      const enrollmentPromises = uniqueContacts.map(contact =>
        fetch(`/api/workflows/${workflowId}/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact_id: contact.id }),
        })
      )

      const results = await Promise.allSettled(enrollmentPromises)
      
      const successCount = results.filter(result => result.status === 'fulfilled').length
      const errorCount = results.filter(result => result.status === 'rejected').length

      if (successCount > 0) {
        alert(`Successfully enrolled ${successCount} contact${successCount > 1 ? 's' : ''} from selected lists${errorCount > 0 ? ` (${errorCount} failed)` : ''}`)
        onClose()
        router.refresh()
      } else {
        alert('Failed to enroll any contacts from lists. Please try again.')
      }
    } catch (error) {
      console.error('Error enrolling contacts from lists:', error)
      alert('Failed to enroll contacts from lists. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Enroll Contacts in Workflow
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {workflowName}
          </p>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2 text-gray-600">Loading contacts...</span>
          </div>
        ) : (
          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual Contacts</TabsTrigger>
              <TabsTrigger value="lists">From Lists</TabsTrigger>
            </TabsList>
            
            <TabsContent value="individual" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No contacts found
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {filteredContacts.map(contact => (
                        <div key={contact.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            checked={selectedContacts.includes(contact.id)}
                            onCheckedChange={() => handleContactToggle(contact.id)}
                            disabled={isLoading}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {contact.metadata.first_name} {contact.metadata.last_name}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {contact.metadata.email}
                            </p>
                          </div>
                          <Badge 
                            className={
                              contact.metadata.status.value === 'Active' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {contact.metadata.status.value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedContacts.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="lists" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Lists</CardTitle>
                  <CardDescription>
                    All active contacts from selected lists will be enrolled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lists.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No lists found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lists.map(list => (
                        <div key={list.id} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50">
                          <Checkbox
                            checked={selectedLists.includes(list.id)}
                            onCheckedChange={() => handleListToggle(list.id)}
                            disabled={isLoading}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">
                                {list.metadata.name}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  {list.metadata.list_type.value}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {list.metadata.total_contacts || 0} contacts
                                </span>
                              </div>
                            </div>
                            {list.metadata.description && (
                              <p className="text-xs text-gray-600 mt-1">
                                {list.metadata.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedLists.length > 0 && (
                    <div className="text-sm text-gray-600 mt-4">
                      {selectedLists.length} list{selectedLists.length > 1 ? 's' : ''} selected
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Tabs defaultValue="individual" className="hidden">
            <TabsContent value="individual">
              <Button
                onClick={handleEnrollContacts}
                disabled={isLoading || selectedContacts.length === 0}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  `Enroll ${selectedContacts.length} Contact${selectedContacts.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="lists">
              <Button
                onClick={handleEnrollFromLists}
                disabled={isLoading || selectedLists.length === 0}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  `Enroll from ${selectedLists.length} List${selectedLists.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </TabsContent>
          </Tabs>
          
          {/* Dynamic button based on active tab */}
          <div className="flex">
            <Button
              onClick={selectedLists.length > 0 ? handleEnrollFromLists : handleEnrollContacts}
              disabled={isLoading || (selectedContacts.length === 0 && selectedLists.length === 0)}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : selectedLists.length > 0 ? (
                `Enroll from ${selectedLists.length} List${selectedLists.length !== 1 ? 's' : ''}`
              ) : (
                `Enroll ${selectedContacts.length} Contact${selectedContacts.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}