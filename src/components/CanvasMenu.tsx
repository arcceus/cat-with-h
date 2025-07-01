import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Grid3X3, Clock, X, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';

interface CanvasItem {
  id: string;
  title: string;
  createdAt: Date;
  lastModified: Date;
  nodeCount: number;
  connectionCount: number;
  preview?: string;
}

interface CanvasMenuProps {
  currentCanvasId: string;
  canvases: CanvasItem[];
  onCanvasSelect: (canvasId: string) => void;
  onNewCanvas: () => void;
  onCanvasDelete?: (canvasId: string) => void;
}

const CanvasMenu: React.FC<CanvasMenuProps> = ({
  currentCanvasId,
  canvases,
  onCanvasSelect,
  onNewCanvas,
  onCanvasDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter canvases based on search query
  const filteredCanvases = canvases.filter(canvas =>
    canvas.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Tab for canvas switching
      if ((event.ctrlKey || event.metaKey) && event.key === 'Tab') {
        event.preventDefault();
        const currentIndex = canvases.findIndex(c => c.id === currentCanvasId);
        const nextIndex = (currentIndex + 1) % canvases.length;
        if (canvases[nextIndex]) {
          onCanvasSelect(canvases[nextIndex].id);
        }
      }
      
      // Ctrl/Cmd + N for new canvas
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        onNewCanvas();
      }
      
      // Escape to close menu
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      
      // Ctrl/Cmd + K to open menu and focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentCanvasId, canvases, onCanvasSelect, onNewCanvas, isOpen]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleCanvasSelect = (canvasId: string) => {
    onCanvasSelect(canvasId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleNewCanvas = () => {
    onNewCanvas();
    setIsOpen(false);
  };

  const currentCanvas = canvases.find(c => c.id === currentCanvasId);

  return (
    <div ref={menuRef} className="relative">
      {/* Menu Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-200",
          isOpen ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"
        )}
        style={{ color: 'white' }}
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="text-sm font-medium">
          {currentCanvas?.title || 'Canvas'}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-80 rounded-xl shadow-2xl border z-50 overflow-hidden"
          style={{
            backgroundColor: '#1d1b18',
            borderColor: '#3a3835'
          }}
        >
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: '#3a3835' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Canvas Workspace</h3>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search canvases... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  backgroundColor: '#373432',
                  border: '1px solid #3a3835'
                }}
              />
            </div>
          </div>

          {/* New Canvas Button */}
          <div className="p-3 border-b" style={{ borderColor: '#3a3835' }}>
            <Button
              onClick={handleNewCanvas}
              className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              New Canvas
              <span className="ml-auto text-xs opacity-70">Ctrl+N</span>
            </Button>
          </div>

          {/* Canvas List */}
          <ScrollArea className="max-h-80">
            <div className="p-2">
              {filteredCanvases.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchQuery ? 'No canvases found' : 'No canvases yet'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCanvases.map((canvas) => (
                    <div
                      key={canvas.id}
                      onClick={() => handleCanvasSelect(canvas.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group",
                        currentCanvasId === canvas.id
                          ? "bg-blue-600/20 border border-blue-500/30"
                          : "hover:bg-white/5"
                      )}
                    >
                      {/* Canvas Preview/Icon */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          currentCanvasId === canvas.id
                            ? "bg-blue-600"
                            : "bg-gray-600"
                        )}
                      >
                        <Grid3X3 className="h-5 w-5 text-white" />
                      </div>

                      {/* Canvas Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            "font-medium truncate",
                            currentCanvasId === canvas.id ? "text-blue-300" : "text-white"
                          )}>
                            {canvas.title}
                          </h4>
                          {currentCanvasId === canvas.id && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-400 mt-1">
                          {canvas.nodeCount} blocks • {canvas.connectionCount} connections
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(canvas.lastModified)}
                        </div>
                      </div>

                      {/* Delete Button (shown on hover) */}
                      {onCanvasDelete && canvas.id !== currentCanvasId && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCanvasDelete(canvas.id);
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer with shortcuts */}
          <div className="p-3 border-t text-xs text-gray-500" style={{ borderColor: '#3a3835' }}>
            <div className="flex justify-between">
              <span>Ctrl+Tab to switch</span>
              <span>Ctrl+K to search</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasMenu;