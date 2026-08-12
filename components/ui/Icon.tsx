import React from 'react';
// Import ONLY used icons to allow tree shaking.
import {
    Cpu, Activity, Star, Square, Pause, Menu, Layout, FileText, BarChart2, Edit, Plus, Check,
    SkipForward, ArrowRight, TrendingUp, TrendingDown, RefreshCw, Settings, DownloadCloud, Minus, Dumbbell,
    ChevronLeft, Eye, Link, Unlink, Sun, Moon, Info, Download, Upload, CloudOff, Clock, Search,
    GripVertical, MoreVertical, ExternalLink, VideoOff, Layers, Zap, Calendar, Home, User, LogOut,
    Trash2, X, CornerDownRight, Share2, AlertTriangle, Play, ChevronRight, Bot, Lock, Crown, Copy,
    ChevronUp, ChevronDown, Anchor, EyeOff, CheckCircle, Flame, Heart, Apple, UtensilsCrossed, Bike, Timer, Utensils, Droplet, Scale,
    Trophy, Pencil, Target, RotateCcw, CirclePlus, Circle, Repeat, Repeat2, Grid3X3,
    BookOpen, AlertCircle, ArrowLeft, Shield
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
    Bot, Cpu, Activity, Star, Square, Pause, Menu, Layout, FileText, BarChart2, Edit, Plus, Check,
    SkipForward, ArrowRight, TrendingUp, TrendingDown, RefreshCw, Settings, DownloadCloud, Minus, Dumbbell,
    ChevronLeft, Eye, Link, Unlink, Sun, Moon, Info, Download, Upload, CloudOff, Clock, Search,
    GripVertical, MoreVertical, ExternalLink, VideoOff, Layers, Zap, Calendar, Home, User, LogOut,
    Trash2, X, CornerDownRight, Share2, AlertTriangle, Play, ChevronRight, Lock, Crown, Copy,
    ChevronUp, ChevronDown, Anchor, EyeOff, CheckCircle, Flame, Heart, Apple, UtensilsCrossed, Bike, Timer, Utensils, Droplet, Scale,
    Trophy, Pencil, Target, RotateCcw, Circle, Repeat, Repeat2,
    BookOpen, AlertCircle, ArrowLeft, Shield,
    PlusCircle: CirclePlus,
    Grid3x3: Grid3X3,
    BrainCircuit: Activity,
    Sparkles: Star,
    Running: Activity
};

// Build the compatibility lookup once at module load instead of allocating
// Object.keys()/lowercase strings inside every missing/case-variant icon render.
const ICON_MAP_LOWER: Record<string, React.ElementType> = Object.fromEntries(
    Object.entries(ICON_MAP).map(([key, value]) => [key.toLowerCase(), value])
);

export type IconName = keyof typeof ICON_MAP;

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
    size?: number | string;
    strokeWidth?: number | string;
}

export const Icon: React.FC<IconProps> = React.memo(({ name, size = 20, className, ...props }) => {
    const LucideIcon = ICON_MAP[name] || ICON_MAP_LOWER[name.toLowerCase()];

    if (!LucideIcon) {
        if (import.meta.env?.DEV) {
            console.warn(`[Icon] Missing icon "${name}" — register it in components/ui/Icon.tsx`);
            return (
                <div
                    title={`Missing icon: ${name}`}
                    style={{ width: size, height: size }}
                    className={`inline-flex items-center justify-center bg-red-600 text-white text-[8px] font-black border-2 border-yellow-300 rounded ${className || ''}`}
                >
                    !
                </div>
            );
        }
        return <div style={{ width: size, height: size, background: 'currentColor', opacity: 0.1, borderRadius: 4 }} className={className} />;
    }

    return <LucideIcon size={size as number} className={className} {...(props as any)} />;
});
