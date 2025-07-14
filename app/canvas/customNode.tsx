import React, { useCallback } from 'react';
import { 
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  NodeResizeControl
 } from '@xyflow/react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { duplicateNode, deleteNode, addNode } from './nodeActions';
import { Move } from 'lucide-react';

export default function CustomNode({ id, data, isConnectable }: NodeProps) {
  const { getNode, setNodes, addNodes, setEdges } = useReactFlow();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState('');

  const handleDuplicate = useCallback(() => {
    duplicateNode(id, getNode, addNodes);
  }, [id, getNode, addNodes]);

  const handleDelete = useCallback(() => {
    deleteNode(id, setNodes, setEdges);
  }, [id, setNodes, setEdges]);

  const handleAddNode = useCallback(() => {
    addNode(id, getNode, addNodes, newLabel);
    setNewLabel('');
    setDialogOpen(false);
  }, [id, getNode, addNodes, newLabel]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="relative rounded bg-card border p-2 min-w-[120px] text-center shadow w-full h-full"
        >
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
          />
          <div>
            {String(data.label)}
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
          />
          <NodeResizeControl
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 18,
              height: 18,
              padding: 2,
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              zIndex: 10,
              cursor: 'nwse-resize',
              transform: 'translate(-50%, -50%)'
            }}
            minWidth={100}
            minHeight={50}
          >
          <div className="text-gray-600 hover:text-white transition-colors">
            <Move size={8} style={{ display: 'block' }} />
          </div>
          </NodeResizeControl>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleDuplicate}>Duplicate</ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} variant="destructive">Delete</ContextMenuItem>
        <ContextMenuItem onClick={() => setDialogOpen(true)}>Add Node</ContextMenuItem>
      </ContextMenuContent>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Node</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleAddNode(); }}>
            <Input
              placeholder="Node label"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              autoFocus
            />
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={!newLabel.trim()}>Add</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ContextMenu>
  );
}
