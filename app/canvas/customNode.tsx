import React, { useCallback } from 'react';
import { 
  Handle,
  Position,
  NodeProps,
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
import { useDuplicateNode, useDeleteNode, useAddNode } from './nodeActions';
import { Move } from 'lucide-react';
import DOMPurify from 'dompurify';
import { MarkdownRenderer } from '../chat/markdown-renderer';

export default function CustomNode({ id, data, isConnectable }: NodeProps) {
  const duplicateNode = useDuplicateNode();
  const deleteNode = useDeleteNode();
  const addNode = useAddNode();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState('');

  const handleDuplicate = useCallback(() => {
    duplicateNode(id);
  }, [id, duplicateNode]);

  const handleDelete = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  const handleAddNode = useCallback(() => {
    addNode(id, newLabel);
    setNewLabel('');
    setDialogOpen(false);
  }, [id, addNode, newLabel]);

  const content = data.content || data.html || data.subtitle || '';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="relative rounded-lg bg-background border p-4 text-left shadow w-full h-full"
          onDoubleClick={() => {
            if (data.chatId && data.messageId) {
              window.dispatchEvent(new CustomEvent('scroll-to-chat-message', {
                detail: { chatId: data.chatId, messageId: data.messageId }
              }));
            }
          }}
        >
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
          />
          {typeof data.chatId === 'string' ? (
            <div style={{ fontWeight: 600, fontSize: '10px', marginBottom: 4, color: 'var(--muted-foreground)' }}>From: {data.chatId}</div>
          ) : null}
          <MarkdownRenderer
            content={String(content)}
            status="ready"
            copyToClipboard={() => {}}
          />
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
