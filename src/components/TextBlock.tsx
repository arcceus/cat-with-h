import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, Link, Move } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

interface TextBlockProps {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isSelected: boolean;
  isConnecting: boolean;
  sourceMessageId?: string;
  sourceChatId?: string;
  theme?: 'light' | 'dark';
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  onConnectionStart: (id: string, point: { x: number; y: number }) => void;
  onResize: (id: string, width: number, height: number) => void;
}

const TextBlock: React.FC<TextBlockProps> = ({
  id,
  text,
  x,
  y,
  width,
  height,
  color,
  isSelected,
  isConnecting,
  sourceMessageId,
  sourceChatId,
  theme = 'light',
  onMouseDown,
  onDelete,
  onClick,
  onConnectionStart,
  onResize
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const [connectionPoints, setConnectionPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const minWidth = 200;
  const maxWidth = 600;
  const minHeight = 100;
  const maxHeight = 500;

  // Calculate connection points based on actual block position and size
  const updateConnectionPoints = useCallback(() => {
    const points = [
      { x: x + width / 2, y: y }, // top
      { x: x + width, y: y + height / 2 }, // right
      { x: x + width / 2, y: y + height }, // bottom
      { x: x, y: y + height / 2 }, // left
    ];
    setConnectionPoints(points);
  }, [x, y, width, height]);

  useEffect(() => {
    updateConnectionPoints();
  }, [updateConnectionPoints]);

  const handleConnectionPointClick = (e: React.MouseEvent, point: { x: number; y: number }) => {
    e.stopPropagation();
    onConnectionStart(id, point);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: width,
      height: height
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
      
      onResize(id, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, id, onResize]);

  return (
    <div
      ref={blockRef}
      className={cn(
        "absolute rounded-xl shadow-lg border-2 p-4 pb-7 select-none transition-all duration-200",
        isSelected && "ring-2 ring-blue-400 ring-offset-2 z-30",
        !isSelected && "z-20 hover:shadow-xl",
        isConnecting && "ring-2 ring-green-500"
      )}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: width,
        height: height,
        borderLeftColor: color,
        borderLeftWidth: '4px',
        willChange: 'transform',
        cursor: isResizing ? 'nw-resize' : 'move',
        backgroundColor: '#373432',
        borderColor: '#3a3835',
        color: '#ffffff'
      }}
      onMouseDown={(e) => !isResizing && onMouseDown(e, id)}
      onClick={() => onClick(id)}
    >
      <div className="text-sm leading-relaxed overflow-hidden h-full text-white">
        {text}
      </div>
      
      {(sourceMessageId || sourceChatId) && (
        <div className="text-xs flex items-center gap-1 text-gray-400">
          <Link className="w-3 h-3" />
          {sourceChatId && <span>From: {sourceChatId}</span>}
        </div>
      )}
      
      {isSelected && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          <Button
            size="icon"
            variant="destructive"
            className="h-6 w-6 rounded-full shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Resize Handle */}
      {isSelected && (
        <div
          className="absolute bottom-1 right-1 w-4 h-4 cursor-nw-resize text-gray-400 hover:text-white transition-colors"
          onMouseDown={handleResizeStart}
          title="Resize block"
        >
          <Move className="w-3 h-3 rotate-45" />
        </div>
      )}

      {/* Connection Points */}
      {(isSelected || isConnecting) && connectionPoints.map((point, index) => (
        <div
          key={index}
          className="absolute w-3 h-3 rounded-full border-2 cursor-pointer transition-colors shadow-lg bg-blue-600 hover:bg-blue-500"
          style={{
            left: point.x - x - 6,
            top: point.y - y - 6,
            zIndex: 40,
            borderColor: '#272725'
          }}
          onClick={(e) => handleConnectionPointClick(e, point)}
          title="Click to create connection"
        />
      ))}
    </div>
  );
};

export default TextBlock;