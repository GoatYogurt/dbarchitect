
import React, { useState, useMemo, useCallback, useRef } from 'react';
import dagre from 'dagre';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import 'reactflow/dist/style.css';
import styled from '@emotion/styled';
import { ParsedSchema } from '../types';
import { TableCard } from './TableCard';
import { TableNode } from './TableNode';
import { DatabaseIcon, LinkIcon } from './icons';
import { SmartEdge } from './SmartEdge';

interface SchemaVisualizerProps {
  schema: ParsedSchema;
}

type ViewMode = 'table' | 'canvas';

const ModeButton = styled.button<{ active: boolean }>`
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid ${props => props.active ? '#06b6d4' : '#475569'};
  background: ${props => props.active ? 'rgba(6, 182, 212, 0.2)' : 'rgba(51, 65, 85, 0.3)'};
  color: ${props => props.active ? '#22d3ee' : '#94a3b8'};
  
  &:hover {
    background: ${props => props.active ? 'rgba(6, 182, 212, 0.3)' : 'rgba(71, 85, 105, 0.3)'};
    border-color: #06b6d4;
    color: #22d3ee;
  }
`;

const ModeToggle = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: #0f172a;
  
  /* Hide React Flow attribution */
  .react-flow__panel.react-flow__attribution {
    display: none;
  }
  
  .react-flow__node {
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
  }
  
  .react-flow__edge-path {
    stroke: #06b6d4;
    stroke-width: 2;
  }
  
  .react-flow__edge.selected .react-flow__edge-path {
    stroke: #22d3ee;
  }
  
  .react-flow__controls {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid #475569;
    border-radius: 8px;
    
    button {
      background: rgba(51, 65, 85, 0.5);
      border-bottom: 1px solid #475569;
      color: #cbd5e1;
      
      &:hover {
        background: rgba(71, 85, 105, 0.7);
        color: #22d3ee;
      }
      
      &:last-child {
        border-bottom: none;
      }
    }
  }
`;

const EdgeMarkerDefs = () => (
  <svg width="0" height="0">
    <defs>
      {/* Crow's foot for "many" side */}
      <marker
        id="crowfoot-many"
        markerWidth="20"
        markerHeight="20"
        refX="10"
        refY="10"
        orient="auto"
      >
        <path
          d="M 2,6 L 10,10 L 2,14 M 10,10 L 18,10"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </marker>
      
      {/* Bar for "one" side */}
      <marker
        id="crowfoot-one"
        markerWidth="20"
        markerHeight="20"
        refX="10"
        refY="10"
        orient="auto"
      >
        <path
          d="M 10,6 L 10,14 M 10,10 L 18,10"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </marker>
      
      {/* Simple line for optional one */}
      <marker
        id="crowfoot-one-optional"
        markerWidth="20"
        markerHeight="20"
        refX="10"
        refY="10"
        orient="auto"
      >
        <circle cx="6" cy="10" r="3" fill="none" stroke="#06b6d4" strokeWidth="2" />
        <path
          d="M 10,6 L 10,14 M 10,10 L 18,10"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </marker>
    </defs>
  </svg>
);

const CanvasActions = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 8px;
`;

const DownloadMenu = styled.div`
  position: relative;
  display: inline-block;
`;

const DownloadDropdown = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'block' : 'none'};
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid #475569;
  border-radius: 6px;
  min-width: 120px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 1000;
`;

const DownloadOption = styled.button`
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  font-size: 0.875rem;
  color: #cbd5e1;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(71, 85, 105, 0.7);
    color: #22d3ee;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #475569;
  }
`;

const nodeTypes = {
  tableNode: TableNode,
};

const edgeTypes = {
  smart: SmartEdge,
};

export function SchemaVisualizer({ schema }: SchemaVisualizerProps) {
  const { tables, refs } = schema;
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [rankDir, setRankDir] = useState<'LR' | 'TB'>('LR');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const nodeWidth = 280;
  const estimateNodeHeight = useCallback((tableName: string) => {
    const table = tables.find(t => t.name === tableName);
    const cols = table?.columns?.length ?? 3;
    // header ~48px + rows ~36px each + padding
    return 48 + cols * 36 + 12;
  }, [tables]);

  const layoutWithDagre = useCallback((ns: Node[], es: Edge[], direction: 'LR' | 'TB' = rankDir) => {
    const g = new dagre.graphlib.Graph();
    // Increased spacing to prevent overlaps
    // ranksep: space between ranks (columns/rows depending on direction)
    // nodesep: space between nodes in the same rank
    g.setGraph({ 
      rankdir: direction, 
      nodesep: 100,  // Increased from 50
      ranksep: 150,  // Increased from 80
      edgesep: 50,   // Added edge separation
      marginx: 40,   // Increased from 20
      marginy: 40,   // Increased from 20
      acyclicer: 'greedy',
      ranker: 'network-simplex'
    });
    g.setDefaultEdgeLabel(() => ({}));

    ns.forEach(n => {
      const h = estimateNodeHeight(String(n.id));
      // Add padding to node dimensions to ensure extra space
      g.setNode(String(n.id), { 
        width: nodeWidth + 20, 
        height: h + 20 
      });
    });
    es.forEach(e => g.setEdge(String(e.source), String(e.target)));

    dagre.layout(g);

    const positionedNodes = ns.map(n => {
      const { x, y } = g.node(String(n.id));
      const h = estimateNodeHeight(String(n.id));
      // Adjust positioning to account for added padding
      return {
        ...n,
        position: { x: x - (nodeWidth + 20) / 2, y: y - (h + 20) / 2 },
      } as Node;
    });

    return { nodes: positionedNodes, edges: es };
  }, [estimateNodeHeight, nodeWidth, rankDir]);

  // Generate nodes and edges for canvas mode
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = tables.map((table) => ({
      id: table.name,
      type: 'tableNode',
      // temporary position; will be replaced by dagre
      position: { x: 0, y: 0 },
      data: { table },
    }));

    const edges: Edge[] = refs.map((ref, index) => {
      // Determine relationship type and markers
      const isOneToMany = ref.relation === '>';
      const isManyToOne = ref.relation === '<';
      const isManyToMany = ref.relation === '<>';
      
      let label = '';
      let markerStart: any = undefined;
      let markerEnd: any = undefined;
      
      if (isManyToMany) {
        label = 'M:N';
        markerStart = 'url(#crowfoot-many)';
        markerEnd = 'url(#crowfoot-many)';
      } else if (isOneToMany) {
        label = '1:N';
        markerStart = 'url(#crowfoot-one)';
        markerEnd = 'url(#crowfoot-many)';
      } else if (isManyToOne) {
        label = 'N:1';
        markerStart = 'url(#crowfoot-many)';
        markerEnd = 'url(#crowfoot-one)';
      } else {
        // Default one-to-one
        label = '1:1';
        markerStart = 'url(#crowfoot-one)';
        markerEnd = 'url(#crowfoot-one)';
      }

      return {
        id: `e${index}`,
        source: ref.fromTable,
        target: ref.toTable,
        type: 'smart',
        animated: false,
        label: label,
        labelStyle: { 
          fill: '#22d3ee', 
          fontSize: 11,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: '#1e293b',
          fillOpacity: 0.95,
          rx: 4,
        },
        markerStart: markerStart,
        markerEnd: markerEnd,
        data: {
          fromColumn: ref.fromColumn,
          toColumn: ref.toColumn,
        },
        style: {
          strokeWidth: 2,
          stroke: '#06b6d4',
        },
      };
    });

    const layouted = layoutWithDagre(nodes, edges, 'LR');
    return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
  }, [tables, refs, layoutWithDagre]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const autoLayout = useCallback(() => {
    const layouted = layoutWithDagre(nodes, edges);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [nodes, edges, setNodes, setEdges, layoutWithDagre]);

  const downloadImage = useCallback(async (format: 'png' | 'jpeg' | 'svg') => {
    if (!canvasRef.current) return;

    try {
      const element = canvasRef.current;
      let dataUrl: string;

      // Hide controls, minimap, and action buttons temporarily
      const controls = element.querySelector('.react-flow__controls') as HTMLElement;
      const minimap = element.querySelector('.react-flow__minimap') as HTMLElement;
      const actions = element.querySelector('[data-canvas-actions]') as HTMLElement;
      const edgeMarkerSvg = element.querySelector('svg[width="0"]') as HTMLElement;
      
      const originalControlsDisplay = controls?.style.display;
      const originalMinimapDisplay = minimap?.style.display;
      const originalActionsDisplay = actions?.style.display;
      const originalEdgeMarkerDisplay = edgeMarkerSvg?.style.display;
      
      if (controls) controls.style.display = 'none';
      if (minimap) minimap.style.display = 'none';
      if (actions) actions.style.display = 'none';
      if (edgeMarkerSvg) edgeMarkerSvg.style.display = 'none';

      if (format === 'png') {
        dataUrl = await toPng(element, { quality: 1.0, pixelRatio: 2 });
      } else if (format === 'jpeg') {
        dataUrl = await toJpeg(element, { quality: 0.95, pixelRatio: 2 });
      } else {
        dataUrl = await toSvg(element);
      }

      // Restore controls, minimap, and action buttons
      if (controls) controls.style.display = originalControlsDisplay || '';
      if (minimap) minimap.style.display = originalMinimapDisplay || '';
      if (actions) actions.style.display = originalActionsDisplay || '';
      if (edgeMarkerSvg) edgeMarkerSvg.style.display = originalEdgeMarkerDisplay || '';

      // Trigger download
      const link = document.createElement('a');
      link.download = `schema-diagram.${format}`;
      link.href = dataUrl;
      link.click();
      
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  }, []);

  const togglePresentationMode = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      if (!presentationMode) {
        // Enter fullscreen
        if (canvasRef.current.requestFullscreen) {
          await canvasRef.current.requestFullscreen();
        }
        setPresentationMode(true);
      } else {
        // Exit fullscreen
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setPresentationMode(false);
      }
    } catch (error) {
      console.error('Failed to toggle presentation mode:', error);
    }
  }, [presentationMode]);

  // Listen for fullscreen changes (e.g., user presses ESC)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setPresentationMode(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Update nodes and edges when schema changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="bg-slate-800 rounded-lg shadow-inner flex flex-col border border-slate-700">
      <div className="flex items-center gap-2 p-3 bg-slate-900/50 border-b border-slate-700 flex-shrink-0">
        <DatabaseIcon className="w-5 h-5 text-violet-400" />
        <h2 className="font-semibold text-slate-200">3. Visualize Schema</h2>
        <ModeToggle>
          <ModeButton 
            active={viewMode === 'table'} 
            onClick={() => setViewMode('table')}
          >
            Table View
          </ModeButton>
          <ModeButton 
            active={viewMode === 'canvas'} 
            onClick={() => setViewMode('canvas')}
          >
            Canvas View
          </ModeButton>
        </ModeToggle>
      </div>
      <div className="p-4 overflow-y-auto flex-grow">
        {tables.length === 0 && refs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Schema visualization will appear here.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-300 mb-4">Tables</h3>
              <div className="grid grid-cols-1 gap-4">
                {tables.map((table) => (
                  <TableCard key={table.name} table={table} />
                ))}
              </div>
            </div>

            {refs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-300 mb-4">Relationships</h3>
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-3 border border-slate-700">
                  {refs.map((ref, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm text-slate-400">
                      <LinkIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="font-mono text-slate-300">{ref.fromTable}.{ref.fromColumn}</span>
                      <span className="text-cyan-400">{ref.relation === '>' ? '→' : ref.relation === '<' ? '←' : '—'}</span>
                      <span className="font-mono text-slate-300">{ref.toTable}.{ref.toColumn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <CanvasContainer ref={canvasRef} style={{ height: '600px' }}>
            <EdgeMarkerDefs />
            {!presentationMode && (
              <CanvasActions data-canvas-actions>
                <ModeButton active={false} onClick={autoLayout}>Auto Layout</ModeButton>
                <ModeButton active={false} onClick={() => { setRankDir(prev => prev === 'LR' ? 'TB' : 'LR'); setTimeout(autoLayout, 0); }}>
                  {rankDir === 'LR' ? 'Layout: Left→Right' : 'Layout: Top→Bottom'}
                </ModeButton>
                <DownloadMenu>
                  <ModeButton 
                    active={false} 
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    title="Download"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </ModeButton>
                  <DownloadDropdown isOpen={showDownloadMenu}>
                    <DownloadOption onClick={() => downloadImage('png')}>PNG</DownloadOption>
                    <DownloadOption onClick={() => downloadImage('jpeg')}>JPEG</DownloadOption>
                    <DownloadOption onClick={() => downloadImage('svg')}>SVG</DownloadOption>
                  </DownloadDropdown>
                </DownloadMenu>
                <ModeButton active={false} onClick={togglePresentationMode} title="Present Mode">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </ModeButton>
              </CanvasActions>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
            >
              <Background 
                variant={BackgroundVariant.Dots} 
                gap={16} 
                size={1}
                color="#475569"
              />
              {!presentationMode && (
                <>
                  <MiniMap
                    nodeColor={(node) => '#06b6d4'}
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                    position="top-left"
                    style={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                  />
                  <Controls />
                </>
              )}
            </ReactFlow>
          </CanvasContainer>
        )}
      </div>
    </div>
  );
}
