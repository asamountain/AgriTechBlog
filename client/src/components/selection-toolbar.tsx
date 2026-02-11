import { Highlighter, MessageCircle, Share2, StickyNote } from 'lucide-react';

export type AnnotationAction = 'highlight' | 'respond' | 'share' | 'note';

interface SelectionToolbarProps {
  position: { top: number; left: number };
  onAction: (action: AnnotationAction) => void;
}

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded transition-colors text-xs font-medium"
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function SelectionToolbar({ position, onAction }: SelectionToolbarProps) {
  return (
    <div
      className="fixed z-50 flex items-center bg-gray-900 rounded-lg shadow-xl border border-gray-700 animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <ToolbarButton
        icon={<Highlighter className="h-3.5 w-3.5" />}
        label="Highlight"
        onClick={() => onAction('highlight')}
      />
      <div className="w-px h-5 bg-gray-600" />
      <ToolbarButton
        icon={<MessageCircle className="h-3.5 w-3.5" />}
        label="Respond"
        onClick={() => onAction('respond')}
      />
      <div className="w-px h-5 bg-gray-600" />
      <ToolbarButton
        icon={<Share2 className="h-3.5 w-3.5" />}
        label="Share"
        onClick={() => onAction('share')}
      />
      <div className="w-px h-5 bg-gray-600" />
      <ToolbarButton
        icon={<StickyNote className="h-3.5 w-3.5" />}
        label="Note"
        onClick={() => onAction('note')}
      />
    </div>
  );
}
