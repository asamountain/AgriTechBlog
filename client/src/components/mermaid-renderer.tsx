import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with a clean theme
mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  themeVariables: {
    primaryColor: '#2D5016', // Forest Green
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#2D5016',
    lineColor: '#6B7280',
    secondaryColor: '#f0fdf4',
    tertiaryColor: '#ffffff',
  },
  securityLevel: 'loose',
});

interface MermaidRendererProps {
  content: string;
}

export default function MermaidRenderer({ content }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !content.trim()) return;

      try {
        setError(null);
        // Generate a unique ID for each render to avoid conflicts
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Use the mermaid.render API
        const { svg } = await mermaid.render(id, content);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Invalid diagram syntax. Please check your Mermaid code.');
      }
    };

    // Debounce or small delay to prevent excessive re-renders while typing
    const timer = setTimeout(renderDiagram, 200);
    return () => clearTimeout(timer);
  }, [content]);

  if (error) {
    return (
      <div className="my-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-mono whitespace-pre-wrap">
        <p className="font-bold mb-2">Diagram Error:</p>
        {error}
        <pre className="mt-2 text-xs text-gray-500">{content}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="mermaid-container my-8 flex justify-center overflow-x-auto p-4 bg-white rounded-xl shadow-sm border border-gray-100"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
