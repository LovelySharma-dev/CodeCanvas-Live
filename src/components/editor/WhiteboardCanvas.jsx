import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Pencil, 
  Square, 
  Circle as CircleIcon, 
  ArrowUpRight, 
  Type, 
  Eraser, 
  Trash2, 
  Download
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

const COLORS = ['#06b6d4', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#ffffff', '#000000'];

export default function WhiteboardCanvas() {
  const { workspaceId: paramWorkspaceId } = useParams();
  const { workspaceId: contextWorkspaceId, realtimeChannel } = useWorkspace();
  const workspaceId = paramWorkspaceId || contextWorkspaceId;

  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pencil'); // 'pencil' | 'rect' | 'circle' | 'arrow' | 'text' | 'eraser'
  const [color, setColor] = useState('#06b6d4');
  const [lineWidth, setLineWidth] = useState(3);
  const [shapes, setShapes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState(null);

  // Redraw canvas from shapes array
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark grid background
    ctx.fillStyle = '#0b101d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render stored shapes
    shapes.forEach((item) => {
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;
      ctx.lineWidth = item.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (item.type === 'pencil' || item.type === 'eraser') {
        if (item.type === 'eraser') {
          ctx.strokeStyle = '#0b101d';
          ctx.lineWidth = item.lineWidth * 4;
        }
        ctx.beginPath();
        item.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else if (item.type === 'rect') {
        ctx.strokeRect(item.x, item.y, item.width, item.height);
      } else if (item.type === 'circle') {
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow(item.width, 2) + Math.pow(item.height, 2)) / 2;
        ctx.arc(item.x + item.width / 2, item.y + item.height / 2, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (item.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(item.x, item.y);
        ctx.lineTo(item.x + item.width, item.y + item.height);
        ctx.stroke();
      } else if (item.type === 'text') {
        ctx.font = '16px sans-serif';
        ctx.fillText(item.text, item.x, item.y);
      }
    });
  };

  // Resize canvas to parent container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      redrawCanvas();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    redrawCanvas();
  }, [shapes]);

  // Bind Whiteboard shapes directly to Yjs Y.Array document for live multi-user sync
  useEffect(() => {
    if (!realtimeChannel?.doc || !workspaceId) return;

    const ydoc = realtimeChannel.doc;
    const yElements = ydoc.getArray(`whiteboard-${workspaceId}`);

    const handleSync = () => {
      setShapes(yElements.toArray());
    };

    // Initial sync
    setShapes(yElements.toArray());

    yElements.observe(handleSync);
    return () => yElements.unobserve(handleSync);
  }, [realtimeChannel?.doc, workspaceId]);

  const broadcastWhiteboardUpdate = (updatedShapes) => {
    if (!realtimeChannel?.doc || !workspaceId) return;
    const ydoc = realtimeChannel.doc;
    const yElements = ydoc.getArray(`whiteboard-${workspaceId}`);

    ydoc.transact(() => {
      yElements.delete(0, yElements.length);
      if (updatedShapes && updatedShapes.length > 0) {
        yElements.push(updatedShapes);
      }
    });
  };

  // Mouse Handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'text') {
      setTextPos({ x, y });
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPath([{ x, y }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pencil' || tool === 'eraser') {
      setCurrentPath(prev => [...prev, { x, y }]);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = tool === 'eraser' ? '#0b101d' : color;
      ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const lastPoint = currentPath[currentPath.length - 1] || { x, y };
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    let newShape = null;
    if (tool === 'pencil' || tool === 'eraser') {
      newShape = {
        type: tool,
        points: currentPath,
        color,
        lineWidth
      };
    } else if (tool === 'rect') {
      newShape = {
        type: 'rect',
        x: startPos.x,
        y: startPos.y,
        width: endX - startPos.x,
        height: endY - startPos.y,
        color,
        lineWidth
      };
    } else if (tool === 'circle') {
      newShape = {
        type: 'circle',
        x: startPos.x,
        y: startPos.y,
        width: endX - startPos.x,
        height: endY - startPos.y,
        color,
        lineWidth
      };
    } else if (tool === 'arrow') {
      newShape = {
        type: 'arrow',
        x: startPos.x,
        y: startPos.y,
        width: endX - startPos.x,
        height: endY - startPos.y,
        color,
        lineWidth
      };
    }

    if (newShape) {
      const updated = [...shapes, newShape];
      broadcastWhiteboardUpdate(updated);
    }
    setCurrentPath([]);
  };

  const handleAddText = (e) => {
    e.preventDefault();
    if (!textInput.trim() || !textPos) return;

    const newShape = {
      type: 'text',
      text: textInput.trim(),
      x: textPos.x,
      y: textPos.y,
      color,
      lineWidth
    };

    const updated = [...shapes, newShape];
    broadcastWhiteboardUpdate(updated);
    setTextInput('');
    setTextPos(null);
  };

  const handleClearCanvas = () => {
    if (confirm('Clear entire collaborative whiteboard?')) {
      broadcastWhiteboardUpdate([]);
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `codecanvas-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b101d] relative overflow-hidden select-none">
      
      {/* Floating Toolbar Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 bg-canvas-panel/90 backdrop-blur-md p-2 rounded-2xl border border-canvas-border shadow-glass">
        
        {/* Tool Buttons */}
        <button
          onClick={() => setTool('pencil')}
          className={`p-2 rounded-xl transition-all ${tool === 'pencil' ? 'bg-cyan-500 text-canvas-bg shadow-glow-cyan' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Pencil / Draw"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTool('rect')}
          className={`p-2 rounded-xl transition-all ${tool === 'rect' ? 'bg-cyan-500 text-canvas-bg shadow-glow-cyan' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Rectangle Shape"
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTool('circle')}
          className={`p-2 rounded-xl transition-all ${tool === 'circle' ? 'bg-cyan-500 text-canvas-bg shadow-glow-cyan' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Circle Shape"
        >
          <CircleIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTool('arrow')}
          className={`p-2 rounded-xl transition-all ${tool === 'arrow' ? 'bg-cyan-500 text-canvas-bg shadow-glow-cyan' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Arrow Line"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTool('text')}
          className={`p-2 rounded-xl transition-all ${tool === 'text' ? 'bg-cyan-500 text-canvas-bg shadow-glow-cyan' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Text Note"
        >
          <Type className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-xl transition-all ${tool === 'eraser' ? 'bg-cyan-500 text-canvas-bg shadow-glow-cyan' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          title="Eraser"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Color Swatches */}
        <div className="flex items-center space-x-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border transition-transform ${color === c ? 'scale-125 border-white shadow-glow-cyan' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Action Buttons */}
        <button
          onClick={handleExportPNG}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          title="Export PNG Image"
        >
          <Download className="w-3.5 h-3.5 text-brand-sky" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <button
          onClick={handleClearCanvas}
          className="p-2 rounded-xl text-slate-400 hover:text-brand-coral hover:bg-rose-500/10"
          title="Clear Whiteboard"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Drawing Canvas */}
      <div className="flex-1 w-full h-full relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full block"
        />

        {/* Floating Text Form Input overlay */}
        {textPos && (
          <form
            onSubmit={handleAddText}
            style={{ left: textPos.x, top: textPos.y }}
            className="absolute z-30"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type text note & press Enter..."
              autoFocus
              className="px-3 py-1.5 rounded-xl bg-canvas-panel border border-cyan-500 text-xs text-white shadow-lg outline-none"
            />
          </form>
        )}
      </div>
    </div>
  );
}
