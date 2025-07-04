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
      title: 'Canvas 1',
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<{ x: number; y: number } | null>(null);
  const [isSwitchingCanvas, setIsSwitchingCanvas] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const currentCanvasDataRef = useRef<{ nodes: TextNode[]; connections: Connection[] }>({ nodes: [], connections: [] });
  useAnimationFrame();

  const colors = [
    '#3B82F6', '#14B8A6', '#F97316', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F59E0B', '#EC4899', '#6366F1'
  ];

  // Save current canvas data
  const saveCurrentCanvas = useCallback(() => {
    if (currentCanvasId) {
      // Update the ref with current data
      currentCanvasDataRef.current = { nodes, connections };
      
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
    }
  }, [currentCanvasId, nodes, connections]);

  // Update ref whenever nodes or connections change
  useEffect(() => {
    currentCanvasDataRef.current = { nodes, connections };
    console.log('REF UPDATED - Nodes in ref:', nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
  }, [nodes, connections]);

  // Immediate canvas update (no debouncing to avoid race conditions)
  useEffect(() => {
    if (!isSwitchingCanvas && currentCanvasId) {
      saveCurrentCanvas();
    }
  }, [nodes, connections, currentCanvasId, isSwitchingCanvas, saveCurrentCanvas]);

  // Switch canvas
  const handleCanvasSelect = (canvasId: string) => {
    setIsSwitchingCanvas(true);
    
    // Save current canvas data before switching
    if (currentCanvasId && currentCanvasId !== canvasId) {
      // Use the ref data to ensure we save the most current state
      const currentData = currentCanvasDataRef.current;
      console.log('SAVING - Current nodes positions:', currentData.nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
      
      setCanvases(prev => {
        const updatedCanvases = prev.map(canvas => {
          if (canvas.id === currentCanvasId) {
            return {
              ...canvas,
              nodes: currentData.nodes,
              connections: currentData.connections,
              lastModified: new Date()
            };
          }
          return canvas;
        });
        
        // Find the target canvas from the updated array
        const targetCanvas = updatedCanvases.find(c => c.id === canvasId);
        if (targetCanvas) {
          console.log('LOADING - Target canvas nodes positions:', targetCanvas.nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
          // Update state with the target canvas data
          setCurrentCanvasId(canvasId);
          setNodes(targetCanvas.nodes);
          setConnections(targetCanvas.connections);
          setSelectedNode(null);
          setConnectingFrom(null);
          setConnectionStart(null);
          setRenderKey(prev => prev + 1);
        }
        
        return updatedCanvases;
      });
    } else {
      // If we're not switching from another canvas, just load the target canvas
      const canvas = canvases.find(c => c.id === canvasId);
      if (canvas) {
        setCurrentCanvasId(canvasId);
        setNodes(canvas.nodes);
        setConnections(canvas.connections);
        setSelectedNode(null);
        setConnectingFrom(null);
        setConnectionStart(null);
        setRenderKey(prev => prev + 1);
      }
    }
    
    // Reset the flag after a short delay
    setTimeout(() => setIsSwitchingCanvas(false), 100);
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
      // Calculate the current viewport center in canvas coordinates
      const viewport = canvasRef.current.parentElement;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const viewportCenterX = (rect.width / 2 - pan.x + 2500) / zoom;
      const viewportCenterY = (rect.height / 2 - pan.y + 2500) / zoom;
      
      const { width, height } = calculateInitialSize(draggedText);
      
      const newNode: TextNode = {
        id: Date.now().toString(),
        text: draggedText,
        x: viewportCenterX - width / 2,  // Center the block at current viewport center
        y: viewportCenterY - height / 2,
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
    if (isPanning && canvasRef.current) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
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

  // Center the initial pan on the canvas (only once)
  useEffect(() => {
    if (canvasRef.current && !isInitialized) {
      const container = canvasRef.current.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        // Center the canvas so that (0,0) is at the center of the viewport
        const newPan = {
          x: containerRect.width / 2,
          y: containerRect.height / 2
        };
        setPan(newPan);
        setIsInitialized(true);
      }
    }
  }, [isInitialized]);

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
            transform: `translate(${pan.x - 2500}px, ${pan.y - 2500}px) scale(${zoom})`,
            transformOrigin: 'center center',
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
            backgroundPosition: 'center center',
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
          <div key={`canvas-nodes-${currentCanvasId}-${renderKey}`}>
            {nodes.map((node) => (
              <TextBlock
                key={`${currentCanvasId}-${node.id}`}
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
      </div>
    </div>
  );
};

export default CanvasPanel;