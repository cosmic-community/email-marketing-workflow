import { NextRequest, NextResponse } from 'next/server'
import { createEmailContact, getEmailContacts } from '@/lib/cosmic'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    console.log('GET /api/contacts - Params:', { limit, skip, search, status })

    const result = await getEmailContacts({
      limit,
      skip,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
    })

    console.log(`GET /api/contacts - Found ${result.contacts.length} contacts out of ${result.total} total`)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contacts',
        data: {
          contacts: [],
          total: 0,
          limit: 50,
          skip: 0
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.first_name || !body.email) {
      return NextResponse.json(
        { error: 'First name and email are required' },
        { status: 400 }
      )
    }

    // Create the contact
    const result = await createEmailContact({
      first_name: body.first_name,
      last_name: body.last_name || '',
      email: body.email,
      status: body.status || 'Active',
      list_ids: body.list_ids || [], // Include list_ids
      tags: body.tags || [],
      subscribe_date: body.subscribe_date || new Date().toISOString().split('T')[0],
      notes: body.notes || ''
    })

    // Revalidate the contacts page after creating a contact
    revalidatePath('/contacts')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}