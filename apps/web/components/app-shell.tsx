'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { getToken } from '@/lib/api'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || '/'
    const router = useRouter()

    useEffect(() => {
        if (pathname !== '/login') {
            const token = getToken()
            if (!token) {
                router.replace('/login')
            }
        }
    }, [pathname, router])

    if (pathname === '/login') return <>{children}</>

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: '#f4f6f8' }}>
            <Sidebar />
            <div className="min-w-0 flex-1 flex flex-col">
                <Header />
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}