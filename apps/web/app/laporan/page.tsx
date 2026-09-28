'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import OriginalLaporan from '@/components/original-laporan'

function getDynamic6Months(): Array<{ month: string; value: number }> {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
    const month = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(d)
    return { month, value: 0 }
  })
}

export default function LaporanPage() {
  const [lineData, setLineData] = useState<Array<{ month: string; value: number }>>([])
  const [riskJobs, setRiskJobs] = useState<Array<{ label: string; value: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const [analisisRes, trendRes] = await Promise.all([
          apiFetch('/analisis-pekerjaan').catch(() => ({ data: [] })),
          apiFetch('/dashboard/delinquency-trend').catch(() => []),
        ])

        const rawRiskJobs = Array.isArray(analisisRes?.data)
          ? analisisRes.data
          : Array.isArray(analisisRes)
            ? analisisRes
            : []

        const derivedLineData = Array.isArray(trendRes) && trendRes.length > 0
          ? trendRes.map((item: any) => ({
              month: item.month || '',
              value: Number(item.value || 0),
            }))
          : getDynamic6Months()

        const derivedRiskJobs = rawRiskJobs.map((item: any) => ({
          label: item.pekerjaan || 'Pekerjaan',
          value: Math.round(Number(item.persentaseKeterlambatan || 0) * 10) / 10,
        }))

        setLineData(derivedLineData)
        setRiskJobs(derivedRiskJobs)
      } catch (error) {
        console.error('Gagal memuat laporan', error)
        setLineData(getDynamic6Months())
        setRiskJobs([])
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  return <OriginalLaporan riskJobs={riskJobs} lineData={lineData} />
}
