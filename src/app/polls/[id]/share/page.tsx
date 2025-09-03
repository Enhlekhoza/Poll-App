"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Poll } from '@/types'
import { QRCodeSVG } from 'qrcode.react'
import { Input } from '@/components/ui/input'
import { Copy } from 'lucide-react'

export default function SharePollPage() {
  const { id } = useParams() as { id: string }
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [pollUrl, setPollUrl] = useState('')

  useEffect(() => {
    const fetchPoll = async () => {
      setLoading(true)
      
      // Fetch poll
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        toast.error('Failed to load poll')
        setLoading(false)
        return
      }
      
      setPoll(data)
      setLoading(false)
      
      // Create the poll URL
      const baseUrl = window.location.origin
      setPollUrl(`${baseUrl}/polls/${id}`)
    }
    
    fetchPoll()
  }, [id])
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl)
      toast.success('Link copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }
  
  const downloadQRCode = () => {
    const svg = document.getElementById('poll-qrcode')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      
      // Download the PNG
      const downloadLink = document.createElement('a')
      downloadLink.download = `poll-${id}-qrcode.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading...</p>
      </div>
    )
  }
  
  if (!poll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Poll not found</h1>
        <Button asChild>
          <Link href="/polls">Back to Polls</Link>
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Share Poll</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium">{poll.title}</h3>
              {poll.description && <p className="text-sm text-gray-600 mt-1">{poll.description}</p>}
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QRCodeSVG 
                  id="poll-qrcode"
                  value={pollUrl} 
                  size={200} 
                  bgColor="#ffffff" 
                  fgColor="#000000" 
                  level="H" 
                  includeMargin={false}
                />
              </div>
              
              <Button onClick={downloadQRCode} variant="outline" className="w-full">
                Download QR Code
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Poll Link</p>
              <div className="flex space-x-2">
                <Input value={pollUrl} readOnly className="flex-1" />
                <Button onClick={copyToClipboard} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={`/polls/${id}`}>Back to Poll</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}