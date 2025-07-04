import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, Link, Move } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

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
  onDrag: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
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
  onDrag,
  onDelete,
  onClick,
  onResize
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeSize, setResizeSize] = useState<{ width: number; height: number }>({ width, height });

  const minWidth = 200;
  const maxWidth = 600;
  const minHeight = 100;
  const maxHeight = 500;

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: width,
      height: height
    });
    setResizeSize({ width, height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
      setResizeSize({ width: newWidth, height: newHeight });
    };
    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        onResize(id, resizeSize.width, resizeSize.height);
      }
    };
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, id, onResize, resizeSize]);

  return (
    <motion.div
      ref={blockRef}
      className={cn(
        "absolute rounded-xl shadow-lg border-2 p-4 pb-7 select-none",
        isSelected && "ring-2 ring-blue-400 ring-offset-2 z-30",
        !isSelected && "z-20 hover:shadow-xl",
        isConnecting && "ring-2 ring-green-500"
      )}
      style={{
        x,
        y,
        width: isResizing ? resizeSize.width : width,
        height: isResizing ? resizeSize.height : height,
        borderLeftColor: color,
        borderLeftWidth: '4px',
        willChange: 'transform',
        cursor: isResizing ? 'nw-resize' : 'move',
        backgroundColor: '#373432',
        borderColor: '#3a3835',
        color: '#ffffff',
        position: 'absolute',
      }}
      drag={!isResizing}
      dragMomentum={false}
      dragElastic={1}
      onDragEnd={(e, info) => {
        if (!isResizing) {
          // Use the delta to calculate the new position
          const newX = x + info.offset.x;
          const newY = y + info.offset.y;
          onDrag(id, newX, newY);
        }
      }}
      onClick={() => onClick(id)}
      whileDrag={{scale: 1.02}}
    >
      {/* Resizing animation overlay */}
      {isResizing && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-dashed border-blue-400 pointer-events-none z-40"
          style={{
            width: resizeSize.width,
            height: resizeSize.height,
            background: 'rgba(59, 130, 246, 0.08)',
          }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
      <div className="text-sm leading-relaxed overflow-hidden h-full text-white">
        {text}
      </div>
      {(sourceMessageId || sourceChatId) && (
        <div className="text-xs flex items-center gap-1 text-gray-400">
          <Link className="w-3 h-3" />
          {sourceChatId && <span>From: {sourceChatId}</span>}
        </div>
      )}
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
      <div
        className="absolute bottom-1 right-1 w-4 h-4 cursor-nw-resize text-gray-400 hover:text-white transition-colors"
        onMouseDown={handleResizeStart}
        title="Resize block"
      >
        <Move className="w-3 h-3 rotate-45" />
      </div>
    </motion.div>
  );
};

export default TextBlock;