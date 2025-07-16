import { useReactFlow } from '@xyflow/react';

export function useDuplicateNode() {
  const { getNode, addNodes } = useReactFlow();
  return (id: string) => {
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
  };
}

export function useDeleteNode() {
  const { setNodes, setEdges } = useReactFlow();
  return (id: string) => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
  };
}

export function useAddNode() {
  const { getNode, addNodes } = useReactFlow();
  return (id: string, label: string) => {
    const node = getNode(id);
    if (!node || !label.trim()) return;
    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };
    addNodes({
      ...node,
      id: `randomnode_${+new Date()}`,
      data: { ...node.data, label },
      position,
      selected: false,
      dragging: false,
    });
  };
} 