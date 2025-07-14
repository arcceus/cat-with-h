import React, { useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';
import { duplicateNode, deleteNode } from './nodeActions';

export default function CustomNode({ id, data, isConnectable }: NodeProps) {
  const { getNode, setNodes, addNodes, setEdges } = useReactFlow();

  const handleDuplicate = useCallback(() => {
    duplicateNode(id, getNode, addNodes);
  }, [id, getNode, addNodes]);

  const handleDelete = useCallback(() => {
    deleteNode(id, setNodes, setEdges);
  }, [id, setNodes, setEdges]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="rounded bg-card border p-2 min-w-[120px] text-center shadow">
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
          />
          <div>{String(data.label)}</div>
          <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleDuplicate}>Duplicate</ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} variant="destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
