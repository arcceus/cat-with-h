"use client";
import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';
import CustomNode from './customNode';
import CustomEdge from './CustomEdge';
import React from 'react';
import { useCanvasStore } from '../store/canvasStore';

type MenuState = {
  id: string;
  x: number;
  y: number;
} | null;

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  default: CustomEdge,
};

const initialNodes: Node[] = [
  { id: 'n1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', type: 'custom', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];
const initialEdges: Edge[] = [{ id: 'n1-n2', source: 'n1', target: 'n2', type: 'default' }];


export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

function CanvasInner() {
  const { canvases, currentKey, saveCanvas } = useCanvasStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(canvases[currentKey]?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(canvases[currentKey]?.edges || initialEdges);
  const [menu, setMenu] = useState<MenuState>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Sync Zustand on any change
  React.useEffect(() => {
    saveCanvas(currentKey, { nodes, edges });
  }, [nodes, edges, currentKey, saveCanvas]);

  // When canvas key changes, load nodes/edges
  React.useEffect(() => {
    setNodes(canvases[currentKey]?.nodes || initialNodes);
    setEdges(canvases[currentKey]?.edges || initialEdges);
  }, [currentKey]);

  const colorMode = theme === "dark" ? "dark" : "light";

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [setEdges],
  );

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      if (!ref.current) return;
      const pane = ref.current.getBoundingClientRect();
      setMenu({
        id: node.id,
        x: Math.min(event.clientX, pane.width - 200),
        y: Math.min(event.clientY, pane.height - 200),
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);


  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div className="absolute z-20 top-4 left-4">
        {/* <CanvasDropdown /> */}
      </div>
      <ReactFlow
        ref={ref}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        colorMode="dark"
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        fitView
        snapToGrid
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
      >
        {/* <MiniMap /> */}
        <Controls />
        <Background />
      </ReactFlow>
      
    </div>
  );
}