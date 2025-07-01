import React from 'react';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'straight' | 'curved' | 'angled';
  color?: string;
  label?: string;
  onDelete?: () => void;
  theme?: 'light' | 'dark';
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  from,
  to,
  type = 'curved',
  color,
  label,
  onDelete,
  theme = 'light'
}) => {
  const defaultColor = '#9CA3AF';
  const lineColor = color || defaultColor;
  const deleteColor = '#EF4444';

  const getPath = () => {
    switch (type) {
      case 'straight':
        return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
      
      case 'angled':
        const midX = (from.x + to.x) / 2;
        return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
      
      case 'curved':
      default:
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const curvature = Math.min(distance * 0.3, 100);
        
        const cp1x = from.x + curvature;
        const cp1y = from.y;
        const cp2x = to.x - curvature;
        const cp2y = to.y;
        
        return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
    }
  };

  const midPoint = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2
  };

  return (
    <g style={{ zIndex: 5 }}>
      {/* Connection Line */}
      <path
        d={getPath()}
        stroke={lineColor}
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
        className="transition-all duration-200 hover:stroke-[3px]"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
      />
      
      {/* Label */}
      {label && (
        <g>
          <rect
            x={midPoint.x - 30}
            y={midPoint.y - 10}
            width="60"
            height="20"
            fill="#373432"
            stroke={lineColor}
            strokeWidth="1"
            rx="10"
            className="cursor-pointer"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
          />
          <text
            x={midPoint.x}
            y={midPoint.y + 4}
            textAnchor="middle"
            className="text-xs pointer-events-none fill-white"
          >
            {label}
          </text>
        </g>
      )}
      
      {/* Delete Button */}
      {onDelete && (
        <circle
          cx={midPoint.x}
          cy={midPoint.y}
          r="10"
          fill={deleteColor}
          className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200"
          onClick={onDelete}
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))' }}
        />
      )}
      
      {/* Delete Icon */}
      {onDelete && (
        <g className="pointer-events-none">
          <line
            x1={midPoint.x - 4}
            y1={midPoint.y - 4}
            x2={midPoint.x + 4}
            y2={midPoint.y + 4}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1={midPoint.x + 4}
            y1={midPoint.y - 4}
            x2={midPoint.x - 4}
            y2={midPoint.y + 4}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
};

export default ConnectionLine;