import { useEffect, useRef, useState } from 'react';
import { FileEntry, FileType } from '../types';
import { parseLinks } from '../lib/linkParser';
import { ZoomIn, ZoomOut, RefreshCw, Layers } from 'lucide-react';

interface Props {
  files: FileEntry[];
  cachedFiles: Record<string, { content: string; name: string; type: FileType; path: string }>;
  onOpenFile: (path: string, type: FileType, name: string) => void;
}

interface GraphNode {
  id: string; // absolute path
  name: string;
  type: FileType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GraphLink {
  source: string; // source node id
  target: string; // target node id
}

export function GraphView({ files, cachedFiles, onOpenFile }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const dragStartPos = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });
  const isDraggingCanvas = useRef(false);

  // Flat files helper
  const getFlatFiles = (list: FileEntry[]): FileEntry[] => {
    let result: FileEntry[] = [];
    list.forEach(item => {
      if (item.isDirectory && item.children) {
        result = [...result, ...getFlatFiles(item.children)];
      } else if (item.type && item.type !== 'folder') {
        result.push(item);
      }
    });
    return result;
  };

  // Build nodes and links from files
  useEffect(() => {
    const flatList = getFlatFiles(files);
    
    // Create nodes
    const initialNodes: GraphNode[] = flatList.map((file, idx) => {
      const angle = (idx / flatList.length) * Math.PI * 2;
      const radius = 180 + Math.random() * 50;
      return {
        id: file.path,
        name: file.name,
        type: file.type as FileType,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: file.type === 'md' ? 8 : 6
      };
    });

    // Create links by scanning file contents
    const initialLinks: GraphLink[] = [];
    
    flatList.forEach(file => {
      // Get file content from cache if loaded, else empty
      const cache = cachedFiles[file.path];
      if (!cache) return;

      const referencedNames = parseLinks(cache.content);
      referencedNames.forEach(refName => {
        // Find matching node with this name (case-insensitive)
        const targetNode = initialNodes.find(n => n.name.toLowerCase() === refName.toLowerCase());
        if (targetNode && targetNode.id !== file.path) {
          initialLinks.push({
            source: file.path,
            target: targetNode.id
          });
        }
      });
    });

    setNodes(initialNodes);
    setLinks(initialLinks);
  }, [files, cachedFiles]);

  // Simulation physics and render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    const kRepulsion = 400; // Force repelling nodes from each other
    const kAttraction = 0.04; // Spring force pulling linked nodes
    const kCenter = 0.01; // Center force pulling nodes to origin (0,0)
    const damping = 0.88;

    const updatePhysics = () => {
      // 1. Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);
          
          if (dist < 400) {
            const force = kRepulsion / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 2. Attraction along links
      links.forEach(link => {
        const sNode = nodes.find(n => n.id === link.source);
        const tNode = nodes.find(n => n.id === link.target);
        if (sNode && tNode) {
          const dx = tNode.x - sNode.x;
          const dy = tNode.y - sNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          
          const force = (dist - 100) * kAttraction;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          sNode.vx += fx;
          sNode.vy += fy;
          tNode.vx -= fx;
          tNode.vy -= fy;
        }
      });

      // 3. Center gravity and update positions
      nodes.forEach(node => {
        if (node === draggedNode) return;

        // Center pull
        node.vx -= node.x * kCenter;
        node.vy -= node.y * kCenter;

        // Apply velocities
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;
      });
    };

    const draw = () => {
      // Handle High DPI canvas
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, rect.width, rect.height);
      
      ctx.save();
      // Apply pan and zoom
      ctx.translate(rect.width / 2 + pan.x, rect.height / 2 + pan.y);
      ctx.scale(zoom, zoom);

      // Get CSS variables colors
      const isDarkMode = document.documentElement.classList.contains('theme-dark') || document.documentElement.classList.contains('theme-amoled');
      const edgeColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
      const activeEdgeColor = '#0a84ff';
      const labelColor = isDarkMode ? '#98989d' : '#86868b';
      const activeLabelColor = isDarkMode ? '#ffffff' : '#1d1d1f';

      // 1. Draw Edges
      links.forEach(link => {
        const s = nodes.find(n => n.id === link.source);
        const t = nodes.find(n => n.id === link.target);
        if (s && t) {
          const isLinkedToHovered = hoveredNode && (hoveredNode.id === s.id || hoveredNode.id === t.id);
          
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.lineWidth = isLinkedToHovered ? 1.5 : 0.75;
          ctx.strokeStyle = isLinkedToHovered ? activeEdgeColor : edgeColor;
          ctx.stroke();
        }
      });

      // 2. Draw Nodes
      nodes.forEach(node => {
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isNeighbor = hoveredNode && links.some(l => 
          (l.source === node.id && l.target === hoveredNode.id) ||
          (l.target === node.id && l.source === hoveredNode.id)
        );

        // Node style by type
        let color = '#0066cc'; // md default
        if (node.type === 'Tasks') color = '#34c759'; // green
        if (node.type === 'Board') color = '#af52de'; // purple

        ctx.beginPath();
        ctx.arc(node.x, node.y, isHovered ? node.radius + 3 : node.radius, 0, Math.PI * 2);
        
        ctx.fillStyle = color;
        ctx.fill();

        // Node border
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isDarkMode ? '#1c1c1e' : '#f5f5f7';
        ctx.stroke();

        // Shadow/glow for hovered/connected node
        if (isHovered || isNeighbor) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + (isHovered ? 6 : 4), 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? 'rgba(10, 132, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
          ctx.fill();
        }

        // Draw Labels
        ctx.font = isHovered ? 'bold 11px system-ui' : '10px system-ui';
        ctx.fillStyle = (isHovered || isNeighbor) ? activeLabelColor : labelColor;
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + node.radius + 14);
      });

      ctx.restore();
    };

    const render = () => {
      updatePhysics();
      draw();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, links, hoveredNode, draggedNode, zoom, pan]);

  // Canvas interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Convert click coordinates to simulated space
    const clickX = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom;

    // Check if clicked on a node
    let clickedNode: GraphNode | null = null;
    for (const node of nodes) {
      const dist = Math.sqrt((node.x - clickX) ** 2 + (node.y - clickY) ** 2);
      if (dist < node.radius + 15) {
        clickedNode = node;
        break;
      }
    }

    if (clickedNode) {
      setDraggedNode(clickedNode);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    } else {
      isDraggingCanvas.current = true;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const curX = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom;
    const curY = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom;

    mousePos.current = { x: curX, y: curY };

    if (draggedNode) {
      // Drag node position
      draggedNode.x = curX;
      draggedNode.y = curY;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    } else if (isDraggingCanvas.current) {
      // Pan canvas
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    } else {
      // Hover detection
      let hovered: GraphNode | null = null;
      for (const node of nodes) {
        const dist = Math.sqrt((node.x - curX) ** 2 + (node.y - curY) ** 2);
        if (dist < node.radius + 12) {
          hovered = node;
          break;
        }
      }
      if (hovered !== hoveredNode) {
        setHoveredNode(hovered);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNode) {
      const dx = Math.abs(e.clientX - dragStartPos.current.x);
      const dy = Math.abs(e.clientY - dragStartPos.current.y);
      // If barely moved, count it as a click to open
      if (dx < 4 && dy < 4) {
        onOpenFile(draggedNode.id, draggedNode.type, draggedNode.name);
      }
      setDraggedNode(null);
    }
    isDraggingCanvas.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    setZoom(prev => Math.max(0.2, Math.min(3, prev - e.deltaY * 0.001)));
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[var(--bg-base)]">
      <div className="absolute top-6 left-6 z-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-1 flex items-center gap-2">
          <Layers className="text-[var(--accent)]" size={26} /> Graph View
        </h1>
        <p className="text-xs text-[var(--text-muted)]">Interactive network connecting notes through [[double brackets]]</p>
      </div>

      {/* Floating Toolbar Controls */}
      <div className="absolute bottom-6 right-6 z-10 flex bg-[var(--bg-glass)] border border-[var(--border-glass)] rounded-2xl p-1.5 backdrop-blur-md shadow-[var(--shadow-glass)] gap-1">
        <button
          onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))}
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={resetZoom}
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          title="Reset Zoom"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Interactive WebGL/Canvas Graph */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}
