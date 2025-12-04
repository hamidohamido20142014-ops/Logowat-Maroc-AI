import React, { useState, useEffect, useRef } from 'react';
import { MOROCCAN_PALETTE } from '../types';
import { Download, X, ZoomIn, ZoomOut, Check, Palette, Undo, Redo, Moon, Settings, Sun, Grid, Move, RotateCcw } from 'lucide-react';

interface LogoEditorProps {
  svgContent: string;
  onSave: (newSvg: string) => void;
  onClose: () => void;
}

type ExportQuality = 'high' | 'medium' | 'low';
type BackgroundMode = 'dark' | 'light' | 'transparent';

const LogoEditor: React.FC<LogoEditorProps> = ({ svgContent, onSave, onClose }) => {
  // History State
  const [history, setHistory] = useState<string[]>([svgContent]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Derived state for the currently visible SVG
  const currentSvg = history[currentIndex];

  const [fillColor, setFillColor] = useState<string | null>(null);
  
  // View State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [bgMode, setBgMode] = useState<BackgroundMode>('dark');
  const dragStart = useRef({ x: 0, y: 0 });
  
  const [downloadQuality, setDownloadQuality] = useState<ExportQuality>('high');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current) {
        previewRef.current.innerHTML = currentSvg;
    }
  }, [currentSvg]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const isCmdOrCtrl = e.ctrlKey || e.metaKey;
        
        if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                if (currentIndex < history.length - 1) setCurrentIndex(prev => prev + 1);
            } else {
                if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
            }
        } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            if (currentIndex < history.length - 1) setCurrentIndex(prev => prev + 1);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, history.length]);

  const addToHistory = (newSvg: string) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newSvg);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handleColorChange = (color: string) => {
    setFillColor(color);
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentSvg, "image/svg+xml");
    const paths = doc.querySelectorAll('path, circle, rect, polygon');
    
    let hasChanges = false;
    paths.forEach(node => {
        const path = node as SVGElement;
        const currentFill = path.getAttribute('fill');
        if (currentFill !== 'none') {
            path.setAttribute('fill', color);
            path.style.fill = color;
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        const serializer = new XMLSerializer();
        const newString = serializer.serializeToString(doc.documentElement);
        addToHistory(newString);
    }
  };

  const handleMonochrome = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentSvg, "image/svg+xml");
    const elements = doc.querySelectorAll('path, circle, rect, polygon, ellipse, line, polyline');
    
    let hasChanges = false;
    elements.forEach(node => {
        const el = node as SVGElement;
        
        // Handle Fill
        const currentFill = el.getAttribute('fill');
        if (currentFill !== 'none') {
            el.setAttribute('fill', '#000000');
            el.style.fill = '#000000';
            hasChanges = true;
        }

        // Handle Stroke
        const currentStroke = el.getAttribute('stroke');
        if (currentStroke && currentStroke !== 'none') {
            el.setAttribute('stroke', '#000000');
            el.style.stroke = '#000000';
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        const serializer = new XMLSerializer();
        const newString = serializer.serializeToString(doc.documentElement);
        addToHistory(newString);
        setFillColor('#000000');
    }
  };

  const optimizeSvg = (svg: string, quality: ExportQuality): string => {
    if (quality === 'high') return svg;
    const precision = quality === 'medium' ? 2 : 0;
    return svg.replace(/(\d+\.\d+)/g, (match) => {
        const num = parseFloat(match);
        return Number(num.toFixed(precision)).toString();
    });
  };

  const handleDownload = () => {
    const finalSvg = optimizeSvg(currentSvg, downloadQuality);
    const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logo-maroc-edited-${downloadQuality}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Panning Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Background Styles
  const getBgStyle = () => {
    switch (bgMode) {
        case 'light': return 'bg-slate-100 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]';
        case 'transparent': return 'bg-[#f0f0f0] bg-[url("data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h10v10H0zm10%2010h10v10H10z%22%20fill%3D%22%23e0e0e0%22%20fill-opacity%3D%221%22%2F%3E%3C%2Fsvg%3E")]';
        case 'dark': default: return 'bg-[#121212] bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px]';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1e1e1e] w-full max-w-7xl h-[95vh] rounded-3xl overflow-hidden flex shadow-2xl border border-white/10 flex-col md:flex-row">
        
        {/* Toolbar (Sidebar) */}
        <div className="w-full md:w-80 bg-[#252525] p-5 border-b md:border-b-0 md:border-l border-white/5 flex flex-col h-auto md:h-full z-10 overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Palette className="text-morocco-gold" />
                    <span>المحرر</span>
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10 md:hidden">
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
                
                {/* History Controls */}
                <div className="flex gap-2 bg-black/20 p-2 rounded-xl">
                    <button 
                        onClick={handleUndo} 
                        disabled={!canUndo}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${canUndo ? 'bg-white/10 hover:bg-white/20 text-white' : 'opacity-30 cursor-not-allowed text-gray-500'}`}
                        title="تراجع (Ctrl+Z)"
                    >
                        <Undo size={16} />
                    </button>
                    <button 
                        onClick={handleRedo}
                        disabled={!canRedo} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${canRedo ? 'bg-white/10 hover:bg-white/20 text-white' : 'opacity-30 cursor-not-allowed text-gray-500'}`}
                        title="إعادة (Ctrl+Y)"
                    >
                         <Redo size={16} />
                    </button>
                </div>

                {/* View Options */}
                <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                        <Sun size={12} /> خلفية العمل (Background)
                    </label>
                    <div className="flex bg-black/20 p-1 rounded-xl">
                        <button 
                            onClick={() => setBgMode('dark')}
                            className={`flex-1 py-2 flex justify-center rounded-lg transition-all ${bgMode === 'dark' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Dark Mode"
                        >
                            <Moon size={16} />
                        </button>
                        <button 
                            onClick={() => setBgMode('light')}
                            className={`flex-1 py-2 flex justify-center rounded-lg transition-all ${bgMode === 'light' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Light Mode"
                        >
                            <Sun size={16} />
                        </button>
                        <button 
                            onClick={() => setBgMode('transparent')}
                            className={`flex-1 py-2 flex justify-center rounded-lg transition-all ${bgMode === 'transparent' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Transparent Grid"
                        >
                            <Grid size={16} />
                        </button>
                    </div>
                </div>

                {/* Colors */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">تغيير اللون (Recolor)</label>
                    <div className="grid grid-cols-5 gap-3 mb-4">
                        {MOROCCAN_PALETTE.map((c) => (
                            <button
                                key={c}
                                onClick={() => handleColorChange(c)}
                                className={`w-10 h-10 rounded-full transition-all relative flex items-center justify-center group ${fillColor === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-110'}`}
                                style={{ backgroundColor: c }}
                                title={c}
                            >
                                {fillColor === c && <Check size={14} className={c === '#FFFFFF' || c === '#F2EBD4' ? 'text-black' : 'text-white'} />}
                            </button>
                        ))}
                    </div>

                     <button 
                        onClick={handleMonochrome}
                        className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm border border-white/10"
                    >
                        <Moon size={16} />
                        أبيض وأسود (Monochrome)
                    </button>
                </div>

                {/* Export Settings */}
                <div className="pt-4 border-t border-white/5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Settings size={12} />
                        جودة التصدير (Export Quality)
                    </label>
                    <div className="flex bg-black/20 p-1 rounded-xl">
                        <button 
                            onClick={() => setDownloadQuality('high')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${downloadQuality === 'high' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            عالية
                        </button>
                        <button 
                            onClick={() => setDownloadQuality('medium')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${downloadQuality === 'medium' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            متوسطة
                        </button>
                        <button 
                            onClick={() => setDownloadQuality('low')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${downloadQuality === 'low' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            منخفضة
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 mt-auto space-y-3 shrink-0">
                <button 
                    onClick={handleDownload}
                    className="w-full bg-morocco-green hover:bg-[#004d28] text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-black/20 transition-all"
                >
                    <Download size={20} />
                    حفظ وتنزيل
                </button>
                <button 
                    onClick={onClose}
                    className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm"
                >
                    إلغاء
                </button>
            </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-[#0a0a0a]">
            {/* Top Bar controls */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                 <button onClick={onClose} className="hidden md:flex bg-black/50 hover:bg-red-500/80 text-white p-3 rounded-full backdrop-blur-md transition-all">
                    <X size={20} />
                </button>
            </div>

            {/* Zoom & Reset Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl">
                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="text-white hover:text-morocco-green p-2 transition-colors"><ZoomOut size={18}/></button>
                <span className="text-white text-xs font-mono min-w-[3ch] text-center border-x border-white/10 px-3 py-1">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="text-white hover:text-morocco-green p-2 transition-colors"><ZoomIn size={18}/></button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button 
                    onClick={resetView} 
                    className="text-white hover:text-morocco-gold p-2 transition-colors"
                    title="Reset View"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
            
            {/* Panning indicator */}
            <div className="absolute top-4 right-4 z-20 pointer-events-none opacity-50 flex items-center gap-2 text-white text-xs bg-black/30 px-3 py-1 rounded-full">
                <Move size={12} />
                <span>Space / Drag to Pan</span>
            </div>

            {/* The Stage */}
            <div 
                className={`flex-1 flex items-center justify-center p-0 cursor-move overflow-hidden transition-colors duration-300 ${getBgStyle()}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div 
                    className={`transition-transform duration-75 ease-out origin-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` 
                    }}
                >
                     {/* SVG Container */}
                    <div className="relative shadow-2xl bg-transparent" style={{width: '500px', height: '500px'}}>
                         <div ref={previewRef} className="w-full h-full pointer-events-none [&>svg]:w-full [&>svg]:h-full" />
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default LogoEditor;