import React, { useState, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableDividerProps {
  onResize: (leftWidth: number) => void;
  initialLeftWidth: number;
  minLeftWidth: number;
  minRightWidth: number;
  containerWidth: number;
}

const ResizableDivider: React.FC<ResizableDividerProps> = ({
  onResize,
  initialLeftWidth,
  minLeftWidth,
  minRightWidth,
  containerWidth
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(initialLeftWidth);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartWidth(initialLeftWidth);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [initialLeftWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const newLeftWidth = startWidth + deltaX;
    const maxLeftWidth = containerWidth - minRightWidth;

    const clampedWidth = Math.max(
      minLeftWidth,
      Math.min(newLeftWidth, maxLeftWidth)
    );

    onResize(clampedWidth);
  }, [isDragging, startX, startWidth, containerWidth, minLeftWidth, minRightWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`w-1 cursor-col-resize flex items-center justify-center transition-colors duration-200 ${
        isDragging ? 'bg-blue-500' : 'bg-gray-600 hover:bg-blue-400'
      }`}
      onMouseDown={handleMouseDown}
    >
      <div className="p-1 rounded hover:bg-white/20 transition-colors">
        <GripVertical className="w-3 h-3 text-gray-300" />
      </div>
    </div>
  );
};

export default ResizableDivider;