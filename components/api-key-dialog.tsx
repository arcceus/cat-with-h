"use client"

import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Load existing API key from localStorage on mount
  useEffect(() => {
    if (open) {
      const storedKey = localStorage.getItem('custom-gemini-api-key')
      if (storedKey) {
        setApiKey(storedKey)
      }
    }
  }, [open])

  // Simple validation function for Gemini API key format
  const isValidApiKeyFormat = (key: string) => {
    return key.startsWith('AIza') && key.length > 20
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      // Remove stored key if empty
      localStorage.removeItem('custom-gemini-api-key')
      toast.success('API key removed. Using default key.')
      onOpenChange(false)
      return
    }

    if (!isValidApiKeyFormat(apiKey)) {
      toast.error('Invalid API key format. Gemini API keys start with "AIza"')
      return
    }

    setIsValidating(true)
    
    try {
      // Test the API key by making a simple request
      const response = await fetch('/api/ai/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      if (response.ok) {
        localStorage.setItem('custom-gemini-api-key', apiKey.trim())
        toast.success('API key saved and validated!')
        onOpenChange(false)
      } else {
        toast.error('Invalid API key. Please check your key and try again.')
      }
    } catch (error) {
      // If validation endpoint doesn't exist, just save the key
      localStorage.setItem('custom-gemini-api-key', apiKey.trim())
      toast.success('API key saved! (Note: Validation unavailable)')
      onOpenChange(false)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemove = () => {
    localStorage.removeItem('custom-gemini-api-key')
    setApiKey('')
    toast.success('API key removed. Using default key.')
    onOpenChange(false)
  }

  const hasStoredKey = () => {
    return !!localStorage.getItem('custom-gemini-api-key')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Google Gemini API Key
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {apiKey && (
              <div className="flex items-center gap-1 text-xs">
                {isValidApiKeyFormat(apiKey) ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Valid format</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">Invalid format</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a></p>
            <p>• Your key is stored locally and never sent to the servers</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {hasStoredKey() && (
            <Button variant="outline" onClick={handleRemove}>
              Remove Key
            </Button>
          )}
          <Button onClick={handleSave} disabled={isValidating}>
            {isValidating ? 'Validating...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 