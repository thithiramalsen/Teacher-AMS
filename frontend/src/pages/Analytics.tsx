import React, { useEffect, useState } from 'react'
import api from '../api'
import { Card, Title, Table, Space, Text, Loader } from '@mantine/core'

export default function Analytics() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const resp = await api.get('/analytics/daily-summary')
        setData(resp.data.items || [])
      } catch (err) {
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Card shadow="sm" padding="lg">
      <Title order={2}>Analytics</Title>
      <Space h="md" />
      {loading && <Loader />}
      {error && <Text color="red">{error}</Text>}
      {!loading && !error && (
        <Table striped highlightOnHover withBorder withColumnBorders>
          <thead>
            <tr>
              <th>Date</th>
              <th>Class</th>
              <th>Total periods</th>
              <th>Taught</th>
              <th>Missed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => (
              <tr key={idx}>
                <td>{row.date}</td>
                <td>{row.class_name || '-'}</td>
                <td>{row.total_periods}</td>
                <td>{row.taught_periods}</td>
                <td>{row.missed_periods}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  )
}
