import { Node, Edge } from '@xyflow/react';

export function duplicateNode(
  id: string,
  getNode: (id: string) => Node | undefined,
  addNodes: (node: Node) => void
) {
  const node = getNode(id);
  if (!node) return;
  const position = {
    x: node.position.x + 50,
    y: node.position.y + 50,
  };
  addNodes({
    ...node,
    selected: false,
    dragging: false,
    id: `${node.id}-copy`,
    position,
    data: node.data || {},
  });
}

export function deleteNode(
  id: string,
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void
) {
  setNodes((nodes) => nodes.filter((node) => node.id !== id));
  setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
}

export function addNode(
  id: string,
  getNode: (id: string) => Node | undefined,
  addNodes: (node: Node) => void,
  label: string
) {
  const node = getNode(id);
  if (!node || !label.trim()) return;
  const position = {
    x: node.position.x + 50,
    y: node.position.y + 50,
  };
  addNodes({
    ...node,
    id: `${getNode(id)}`,
    data: { ...node.data, label },
    position,
    selected: false,
    dragging: false,
  });
} 