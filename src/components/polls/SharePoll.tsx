"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Share2, Copy, QrCode } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SharePollProps {
  pollId: string
}

export function SharePoll({ pollId }: SharePollProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const publicPollUrl = `${window.location.origin}/polls/${pollId}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicPollUrl)
      toast.success("Poll link copied to clipboard!")
    } catch (err) {
      toast.error("Failed to copy link.")
    }
  }

  // Placeholder for QR code generation. This would typically involve a library or API.
  const generateQrCode = () => {
    // In a real application, you'd use a library like 'qrcode.react' or a QR code API
    // For now, we'll just set a placeholder or a simple data URL
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicPollUrl)}`)
    toast.info("QR code generated (placeholder).")
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
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
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
        <div className="flex justify-center mt-4">
          {!qrCodeUrl ? (
            <Button onClick={generateQrCode}>
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR Code
            </Button>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <img src={qrCodeUrl} alt="QR Code" width={150} height={150} />
              <p className="text-sm text-gray-500">Scan to vote!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
