"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Share2, Copy, QrCode, Facebook, Twitter, Mail, Linkedin } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { QRCodeSVG } from "qrcode.react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SharePollProps {
  pollId: string
  pollTitle?: string
}

export function SharePoll({ pollId, pollTitle = "Poll" }: SharePollProps) {
  const [showQrCode, setShowQrCode] = useState(false)
  const publicPollUrl = `${window.location.origin}/polls/${pollId}`
  const sanitizedTitle = pollTitle.replace(/<[^>]*>?/gm, '')

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicPollUrl)
      toast.success("Poll link copied to clipboard!")
    } catch (err) {
      toast.error("Failed to copy link.")
    }
  }

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Check out this poll: ${sanitizedTitle}`)
    const url = encodeURIComponent(publicPollUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
    toast.success("Opening Twitter share dialog")
  }

  const shareOnFacebook = () => {
    const url = encodeURIComponent(publicPollUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    toast.success("Opening Facebook share dialog")
  }

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(publicPollUrl)
    const title = encodeURIComponent(`Poll: ${sanitizedTitle}`)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank')
    toast.success("Opening LinkedIn share dialog")
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Poll: ${sanitizedTitle}`)
    const body = encodeURIComponent(`Check out this poll: ${publicPollUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
    toast.success("Opening email client")
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Poll</DialogTitle>
          <DialogDescription>
            Share this poll with others to get more votes.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Link & QR</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link">Shareable Link</Label>
                <Input
                  id="link"
                  defaultValue={publicPollUrl}
                  readOnly
                />
              </div>
              <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <Button 
                variant="outline" 
                onClick={() => setShowQrCode(!showQrCode)}
                className="w-full"
              >
                <QrCode className="mr-2 h-4 w-4" />
                {showQrCode ? "Hide QR Code" : "Show QR Code"}
              </Button>
              
              {showQrCode && (
                <div className="flex flex-col items-center space-y-2 p-4 border rounded-md">
                  <QRCodeSVG 
                    value={publicPollUrl} 
                    size={150} 
                    bgColor="#ffffff" 
                    fgColor="#000000" 
                    level="H" 
                    includeMargin={false}
                  />
                  <p className="text-sm text-gray-500">Scan to vote!</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={shareOnTwitter} variant="outline" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button onClick={shareOnFacebook} variant="outline" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button onClick={shareOnLinkedIn} variant="outline" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button onClick={shareViaEmail} variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
