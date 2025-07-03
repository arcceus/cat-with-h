import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Button } from '../components/ui/button';
// import { Separator } from '@/components/ui/separator';
import { useDebounce } from '../hooks/useDebounce';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import TextBlock from './TextBlock';
import CanvasMenu from './CanvasMenu';

interface TextNode {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceMessageId?: string;
  sourceChatId?: string;
  color: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  fromPoint: { x: number; y: number };
  toPoint: { x: number; y: number };
  type: 'straight' | 'curved' | 'angled';
  label?: string;
}

interface CanvasData {
  id: string;
  title: string;
  nodes: TextNode[];
  connections: Connection[];
  createdAt: Date;
  lastModified: Date;
}

interface CanvasPanelProps {
  draggedText: string | null;
  sourceMsgId: string | null;
  sourceChatId: string | null;
  theme: 'light' | 'dark';
  onTextDragComplete: () => void;
  onBlockClick: (messageId: string, chatId?: string) => void;
}

const CanvasPanel: React.FC<CanvasPanelProps> = ({ 
  draggedText, 
  sourceMsgId,
  sourceChatId,
  theme,
  onTextDragComplete,
  onBlockClick
}) => {
  // Canvas management state
  const [canvases, setCanvases] = useState<CanvasData[]>([
    {
      id: 'default-canvas',
      title: 'Main Canvas',
      nodes: [],
      connections: [],
      createdAt: new Date(),
      lastModified: new Date()
    }
  ]);
  const [currentCanvasId, setCurrentCanvasId] = useState('default-canvas');

  // Get current canvas data
  const currentCanvas = canvases.find(c => c.id === currentCanvasId);
  const [nodes, setNodes] = useState<TextNode[]>(currentCanvas?.nodes || []);
  const [connections, setConnections] = useState<Connection[]>(currentCanvas?.connections || []);

  // Canvas interaction state
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<{ x: number; y: number } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
 useAnimationFrame();

  const colors = [
    '#3B82F6', '#14B8A6', '#F97316', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F59E0B', '#EC4899', '#6366F1'
  ];

  // Update canvas data when nodes or connections change
  const updateCanvasData = useCallback(() => {
    setCanvases(prev => prev.map(canvas => {
      if (canvas.id === currentCanvasId) {
        return {
          ...canvas,
          nodes,
          connections,
          lastModified: new Date()
        };
      }
      return canvas;
    }));
  }, [currentCanvasId, nodes, connections]);

  // Debounced canvas update
  const debouncedUpdate = useDebounce(updateCanvasData, 50);

  useEffect(() => {
    debouncedUpdate();
  }, [nodes, connections, debouncedUpdate]);

  // Switch canvas
  const handleCanvasSelect = (canvasId: string) => {
    const canvas = canvases.find(c => c.id === canvasId);
    if (canvas) {
      setCurrentCanvasId(canvasId);
      setNodes(canvas.nodes);
      setConnections(canvas.connections);
      setSelectedNode(null);
      setConnectingFrom(null);
      setConnectionStart(null);
    }
  };

  // Create new canvas
  const handleNewCanvas = () => {
    const newCanvas: CanvasData = {
      id: `canvas-${Date.now()}`,
      title: `Canvas ${canvases.length + 1}`,
      nodes: [],
      connections: [],
      createdAt: new Date(),
      lastModified: new Date()
    };
    
    setCanvases(prev => [...prev, newCanvas]);
    handleCanvasSelect(newCanvas.id);
  };

  // Delete canvas
  const handleCanvasDelete = (canvasId: string) => {
    if (canvases.length <= 1) return; // Don't delete the last canvas
    
    setCanvases(prev => prev.filter(c => c.id !== canvasId));
    
    if (currentCanvasId === canvasId) {
      const remainingCanvases = canvases.filter(c => c.id !== canvasId);
      handleCanvasSelect(remainingCanvases[0].id);
    }
  };

  // Calculate appropriate initial size based on text content
  const calculateInitialSize = (text: string) => {
    const words = text.split(' ').length;
    const chars = text.length;
    
    // Base dimensions
    let width = 240;
    let height = 120;
    
    // Adjust based on content
    if (chars > 100) {
      width = Math.min(400, 240 + (chars - 100) * 1.5);
      height = Math.min(250, 120 + Math.floor((chars - 100) / 60) * 25);
    }
    
    if (words > 20) {
      height = Math.min(300, height + Math.floor((words - 20) / 12) * 20);
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  };

  // Handle dropped text from chat
  useEffect(() => {
    if (draggedText && canvasRef.current) {
      // Use the parent of canvasRef as the viewport
      const viewport = canvasRef.current.parentElement;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const centerX = (rect.width / 2 - pan.x) / zoom;
      const centerY = (rect.height / 2 - pan.y) / zoom;
      
      const { width, height } = calculateInitialSize(draggedText);
      
      const newNode: TextNode = {
        id: Date.now().toString(),
        text: draggedText,
        x: centerX - width / 2,
        y: centerY - height / 2,
        width,
        height,
        sourceMessageId: sourceMsgId || undefined,
        sourceChatId: sourceChatId || undefined,
        color: colors[nodes.length % colors.length]
      };
      
      setNodes(prev => [...prev, newNode]);
      onTextDragComplete();
    }
  }, [draggedText, sourceMsgId, sourceChatId, onTextDragComplete, nodes.length, pan, zoom]);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (canvasRef.current && canvasRef.current.contains(e.target as Node)) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 : 1;
        setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  const handleBlockDrag = (nodeId: string, newX: number, newY: number) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, x: newX, y: newY } : node
    ));
  };

  const handleBlockClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node?.sourceMessageId) {
      onBlockClick(node.sourceMessageId, node.sourceChatId);
    }
  };

  const handleConnectionStart = (nodeId: string, point: { x: number; y: number }) => {
    setConnectingFrom(nodeId);
    setConnectionStart(point);
  };

  const handleBlockResize = (nodeId: string, width: number, height: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, width, height } : node
    ));
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      
      const newPosition = {
        x: x - dragOffset.x,
        y: y - dragOffset.y
      };

      // Immediate update for better performance
      setNodes(prev => prev.map(node => 
        node.id === draggingNode ? { ...node, ...newPosition } : node
      ));
    }
    
    if (isPanning && canvasRef.current) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [draggingNode, dragOffset, isPanning, panStart, pan, zoom, nodes]);

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
    setIsPanning(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      setConnectingFrom(null);
      setConnectionStart(null);
      
      // Start panning
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
  };

  const handleDeleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  // Prepare canvas items for menu
  const canvasItems = canvases.map(canvas => ({
    id: canvas.id,
    title: canvas.title,
    createdAt: canvas.createdAt,
    lastModified: canvas.lastModified,
    nodeCount: canvas.nodes.length,
    connectionCount: canvas.connections.length
  }));

  // Center the initial pan on the canvas
  useEffect(() => {
    if (canvasRef.current) {
      const container = canvasRef.current.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const canvasWidth = 5000;
        const canvasHeight = 5000;
        setPan({
          x: (containerRect.width / 2) - (canvasWidth / 2),
          y: (containerRect.height / 2) - (canvasHeight / 2)
        });
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#272725' }}>
      {/* Toolbar */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ 
          backgroundColor: '#272725',
          borderColor: '#3a3835'
        }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">
            Canvas Workspace
          </h2>
        </div>
        
        <div className="flex items-center">
          {/* Zoom Controls */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="h-9 w-9 text-white hover:bg-white/10"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[4rem] text-center text-gray-400">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="h-9 w-9 text-white hover:bg-white/10"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Canvas Menu */}
          <CanvasMenu
            currentCanvasId={currentCanvasId}
            canvases={canvasItems}
            onCanvasSelect={handleCanvasSelect}
            onNewCanvas={handleNewCanvas}
            onCanvasDelete={handleCanvasDelete}
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 cursor-move"
          onMouseDown={handleCanvasMouseDown}
          style={{
            width: 5000,
            height: 5000,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0',
          }}
        >
          {/* SVG for connections */}
          {/* <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#9CA3AF"
                />
              </marker>
            </defs>
          </svg> */}

          {/* Text Blocks */}
          {nodes.map((node) => (
            <TextBlock
              key={node.id}
              id={node.id}
              text={node.text}
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              color={node.color}
              isSelected={selectedNode === node.id}
              isConnecting={connectingFrom === node.id}
              sourceMessageId={node.sourceMessageId}
              sourceChatId={node.sourceChatId}
              theme={theme}
              onDrag={handleBlockDrag}
              onDelete={handleDeleteNode}
              onClick={handleBlockClick}
              onResize={handleBlockResize}
            />
          ))}
        </div>

        {/* Instructions */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Move className="w-16 h-16 mx-auto mb-6 text-gray-500" />
              <h3 className="text-2xl font-semibold mb-3 text-white">
                Your Canvas Workspace
              </h3>
              <p className="text-gray-400 mb-4 max-w-md">
                Select text from the chat and drag it here to create visual connections and organize your thoughts
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>• Scroll to zoom in and out</p>
                <p>• Click connection points to link blocks</p>
                <p>• Click blocks to highlight source messages</p>
                <p>• Drag corners to resize blocks</p>
                <p>• Use Ctrl+Tab to switch canvases</p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Mode Indicator */}
        {connectingFrom && (
          <div className="absolute top-6 left-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-medium">Connection Mode</p>
            <p className="text-xs opacity-90">Click another block to create connection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasPanel;