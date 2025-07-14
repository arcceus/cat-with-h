"use client";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function Workspace() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <ThemeToggle />
        </header>
        <PanelGroup direction="horizontal" style={{ height: "100%", width: "100%" }}>
          <Panel defaultSize={50} minSize={15} maxSize={70}>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full">
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
              </div>
              <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
            </div>
          </Panel>
          <PanelResizeHandle style={{ width: 4, background: "#444", cursor: "col-resize" }} />
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full w-full p-4 pt-0">
              <div className="h-full w-full rounded-xl overflow-hidden">
                <Tldraw />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </SidebarInset>
    </SidebarProvider>
  );
}