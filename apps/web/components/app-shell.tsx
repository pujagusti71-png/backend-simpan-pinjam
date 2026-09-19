'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { removeToken } from '@/lib/api'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || '/'
    const router = useRouter()

    useEffect(() => {
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
        const firstEntry = navigationEntries[0]

        if (firstEntry?.type === 'reload') {
            removeToken()

            if (pathname !== '/login') {
                router.replace('/login')
            }

            return
        }
    }, [pathname, router])

    if (pathname === '/login') return children

    return (
        <div className="flex min-h-screen bg-[#f8f9fa]" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            <Sidebar />
            <div className="min-w-0 flex-1">
                <Header />
                <div className="min-h-[calc(100vh-73px)]">{children}</div>
            </div>
        </div>
    )
}