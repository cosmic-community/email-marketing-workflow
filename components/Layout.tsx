'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'
import { 
  Mail, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Workflow
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Campaigns', href: '/campaigns', icon: Mail },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <Mail className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-xl font-bold text-gray-900">
              Email Marketing
            </h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = 
                  (item.href === '/' && pathname === '/') ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}