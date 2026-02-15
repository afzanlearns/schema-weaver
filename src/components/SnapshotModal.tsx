import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Maximize, Download, Move } from "lucide-react";

interface SnapshotModalProps {
    imageDataUrl: string;
    onClose: () => void;
}

export const SnapshotModal = ({ imageDataUrl, onClose }: SnapshotModalProps) => {
    const [scale, setScale] = useState(0.5);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const offsetStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Zoom controls
    const zoomIn = () => setScale((s) => Math.min(s * 1.3, 5));
    const zoomOut = () => setScale((s) => Math.max(s / 1.3, 0.1));
    const fitToView = useCallback(() => {
        setScale(0.5);
        setOffset({ x: 0, y: 0 });
    }, []);

    // Mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((s) => Math.max(0.1, Math.min(s * factor, 5)));
    }, []);

    // Pan via mouse drag
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        setDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        offsetStart.current = { ...offset };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [offset]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging) return;
        setOffset({
            x: offsetStart.current.x + (e.clientX - dragStart.current.x),
            y: offsetStart.current.y + (e.clientY - dragStart.current.y),
        });
    }, [dragging]);

    const handlePointerUp = useCallback(() => {
        setDragging(false);
    }, []);

    // Touch pinch-to-zoom
    const lastTouchDist = useRef<number | null>(null);
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (lastTouchDist.current !== null) {
                const factor = dist / lastTouchDist.current;
                setScale((s) => Math.max(0.1, Math.min(s * factor, 5)));
            }
            lastTouchDist.current = dist;
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        lastTouchDist.current = null;
    }, []);

    // Download the full-res image
    const handleDownload = useCallback(() => {
        const a = document.createElement("a");
        a.href = imageDataUrl;
        a.download = `schema-weaver-snapshot-${Date.now()}.png`;
        a.click();
    }, [imageDataUrl]);

    // Escape key to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Move className="h-4 w-4 text-white/50" />
                    <span className="text-xs text-white/60 hidden sm:inline">
                        Drag to pan • Scroll to zoom • Pinch on mobile
                    </span>
                    <span className="text-xs text-white/60 sm:hidden">
                        Drag to pan • Pinch to zoom
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                        onClick={zoomOut}
                        title="Zoom Out"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-white/60 w-12 text-center tabular-nums">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                        onClick={zoomIn}
                        title="Zoom In"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                        onClick={fitToView}
                        title="Fit to View"
                    >
                        <Maximize className="h-4 w-4" />
                    </Button>
                    <div className="h-4 w-px bg-white/20 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                        onClick={onClose}
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Canvas area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none"
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <img
                        src={imageDataUrl}
                        alt="Diagram snapshot"
                        draggable={false}
                        className="max-w-none"
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            transformOrigin: "center center",
                            transition: dragging ? "none" : "transform 0.15s ease-out",
                        }}
                    />
                </div>
            </div>

            {/* Bottom download bar */}
            <div className="flex items-center justify-center px-4 py-3 bg-black/60 border-t border-white/10">
                <Button
                    onClick={handleDownload}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full text-sm font-medium gap-2"
                >
                    <Download className="h-4 w-4" />
                    Download PNG
                </Button>
            </div>
        </div>
    );
};
