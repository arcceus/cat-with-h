"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
  Key,
} from "lucide-react"
import { useUser, useClerk, SignInButton } from "@clerk/nextjs"
import { useState, useEffect } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useChatStore } from '@/app/store/chatStore';
import { ApiKeyDialog } from "./api-key-dialog"

export function NavUser() {
  const { isSignedIn, user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { isMobile } = useSidebar()
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  const [hasCustomApiKey, setHasCustomApiKey] = useState(false)
  const {
    canvasEnabled, setCanvasEnabled,
    chatEnabled, setChatEnabled,
    flipLayout, setFlipLayout
  } = useChatStore();

  // Check if user has a custom API key stored
  useEffect(() => {
    const checkCustomApiKey = () => {
      const storedKey = localStorage.getItem('custom-gemini-api-key')
      setHasCustomApiKey(!!storedKey)
    }
    
    checkCustomApiKey()
    
    // Listen for storage changes (in case user opens multiple tabs)
    window.addEventListener('storage', checkCustomApiKey)
    
    return () => {
      window.removeEventListener('storage', checkCustomApiKey)
    }
  }, [apiKeyDialogOpen]) // Re-check when dialog closes

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse mt-1" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Show single Login button for unauthenticated users
  if (!isSignedIn) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex flex-col gap-2 p-2">
            <div className="text-xs text-muted-foreground text-center mb-2">
              Please log in to save your chats
            </div>
            <SignInButton mode="modal">
              <Button size="sm" variant="default" className="w-full">
                <User className="h-4 w-4 mr-2" />
                Login
              </Button>
            </SignInButton>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Show user profile for authenticated users, with toggles in menu
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                <AvatarFallback className="rounded-lg">
                  {user?.fullName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user?.fullName || user?.emailAddresses[0]?.emailAddress}
                </span>
                <span className="truncate text-xs">
                  {user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                  <AvatarFallback className="rounded-lg">
                    {user?.fullName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.fullName || user?.emailAddresses[0]?.emailAddress}
                  </span>
                  <span className="truncate text-xs">
                    {user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setApiKeyDialogOpen(true)}>
                <Key />
                <span className="flex-1">API Key Settings</span>
                {hasCustomApiKey && (
                  <div className="h-2 w-2 rounded-full bg-green-500" title="Custom API key active" />
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Canvas, Chat, Flip UI Toggles */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <div className="flex items-center gap-2 w-full">
                  <Switch id="canvas-toggle" checked={canvasEnabled} onCheckedChange={setCanvasEnabled} />
                  <label htmlFor="canvas-toggle" className="text-xs">Canvas</label>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <div className="flex items-center gap-2 w-full">
                  <Switch id="chat-toggle" checked={chatEnabled} onCheckedChange={setChatEnabled} />
                  <label htmlFor="chat-toggle" className="text-xs">Chat</label>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <div className="flex items-center gap-2 w-full">
                  <Switch id="flip-toggle" checked={flipLayout} onCheckedChange={setFlipLayout} />
                  <label htmlFor="flip-toggle" className="text-xs">Flip UI</label>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      
      {/* API Key Dialog */}
      <ApiKeyDialog 
        open={apiKeyDialogOpen} 
        onOpenChange={setApiKeyDialogOpen} 
      />
    </SidebarMenu>
  )
}
