import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Plus } from "lucide-react";

export function FloatingControls({ handleNewChat }: { handleNewChat: () => void }) {
  const { state } = useSidebar();
  return (
    <div className="fixed top-3 left-1 z-50 flex items-center min-h-8 px-2 gap-2 bg-sidebar rounded-lg shadow-lg">
      <SidebarTrigger />
      <ThemeToggle />
      {state === "collapsed" && (
        <button
          onClick={handleNewChat}
          className="flex items-center justify-center w-7 h-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
} 