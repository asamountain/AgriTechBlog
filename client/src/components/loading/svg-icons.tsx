/**
 * SVG Icon Components for Nature-Tech Loading System
 * Optimized, animated SVG graphics for loading states
 */

import React from 'react';

// ============================================================================
// HEXAGON SEED ICON
// ============================================================================

interface HexagonSeedProps {
  size?: number;
  color?: string;
  className?: string;
}

export const HexagonSeed: React.FC<HexagonSeedProps> = ({ 
  size = 40, 
  color = '#2D5016',
  className = '' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Outer hexagon */}
    <path
      d="M20 2L34.6410 11V29L20 38L5.35898 29V11L20 2Z"
      stroke={color}
      strokeWidth="2"
      fill="none"
      opacity="0.3"
    />
    
    {/* Inner hexagon (seed core) */}
    <path
      d="M20 10L28.3205 15V25L20 30L11.6795 25V15L20 10Z"
      fill={color}
      opacity="0.6"
    />
    
    {/* Center dot */}
    <circle
      cx="20"
      cy="20"
      r="3"
      fill={color}
    />
    
    {/* Growth lines (roots) */}
    <g className="growth-roots" opacity="0.5">
      <line x1="20" y1="30" x2="20" y2="35" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="30" x2="15" y2="34" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="30" x2="25" y2="34" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

// ============================================================================
// LEAF FRACTAL PATTERN
// ============================================================================

interface LeafFractalProps {
  size?: number;
  color?: string;
  className?: string;
}

export const LeafFractal: React.FC<LeafFractalProps> = ({ 
  size = 56, 
  color = '#2D5016',
  className = '' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Center */}
    <circle cx="28" cy="28" r="3" fill={color} />
    
    {/* Main branches (6 directions) */}
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const angle = (i * 60) * (Math.PI / 180);
      const endX = 28 + Math.cos(angle) * 20;
      const endY = 28 + Math.sin(angle) * 20;
      
      return (
        <g key={i} className={`branch-${i}`}>
          {/* Main branch */}
          <line
            x1="28"
            y1="28"
            x2={endX}
            y2={endY}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          
          {/* Branch tip */}
          <circle
            cx={endX}
            cy={endY}
            r="2"
            fill={color}
            opacity="0.5"
          />
        </g>
      );
    })}
  </svg>
);

// ============================================================================
// GROWTH NETWORK NODE
// ============================================================================

interface GrowthNodeProps {
  size?: number;
  color?: string;
  className?: string;
}

export const GrowthNode: React.FC<GrowthNodeProps> = ({ 
  size = 16, 
  color = '#2D5016',
  className = '' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Outer ring */}
    <circle
      cx="8"
      cy="8"
      r="6"
      stroke={color}
      strokeWidth="1"
      fill="none"
      opacity="0.3"
    />
    
    {/* Inner dot */}
    <circle
      cx="8"
      cy="8"
      r="3"
      fill={color}
      opacity="0.7"
    />
  </svg>
);

// ============================================================================
// DATA PARTICLE
// ============================================================================

interface DataParticleProps {
  size?: number;
  color?: string;
  accentColor?: string;
  className?: string;
}

export const DataParticle: React.FC<DataParticleProps> = ({ 
  size = 12, 
  color = '#2D5016',
  accentColor = '#7CB342',
  className = '' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Outer glow */}
    <circle
      cx="6"
      cy="6"
      r="5"
      fill={accentColor}
      opacity="0.1"
    />
    
    {/* Main particle */}
    <circle
      cx="6"
      cy="6"
      r="2.5"
      fill={color}
      opacity="0.8"
    />
    
    {/* Center highlight */}
    <circle
      cx="6"
      cy="6"
      r="1"
      fill="white"
      opacity="0.6"
    />
  </svg>
);

// ============================================================================
// LEAF VEIN PATTERN (for skeleton backgrounds)
// ============================================================================

export const LeafVeinPattern: React.FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <pattern
        id="leaf-vein-pattern"
        x="0"
        y="0"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        {/* Subtle leaf vein lines */}
        <path
          d="M0 20 Q10 15, 20 20 T40 20"
          stroke="rgba(45, 80, 22, 0.03)"
          strokeWidth="0.5"
          fill="none"
        />
        <path
          d="M0 25 Q10 22, 20 25 T40 25"
          stroke="rgba(45, 80, 22, 0.02)"
          strokeWidth="0.5"
          fill="none"
        />
      </pattern>
    </defs>
  </svg>
);

// ============================================================================
// GROWTH NETWORK FULL (complex animation component)
// ============================================================================

interface GrowthNetworkFullProps {
  size?: number;
  color?: string;
  className?: string;
}

export const GrowthNetworkFull: React.FC<GrowthNetworkFullProps> = ({ 
  size = 72, 
  color = '#2D5016',
  className = '' 
}) => {
  // Generate circular network of nodes
  const nodeCount = 8;
  const radius = 28;
  const nodes = Array.from({ length: nodeCount }, (_, i) => {
    const angle = (i * (360 / nodeCount)) * (Math.PI / 180);
    return {
      x: 36 + Math.cos(angle) * radius,
      y: 36 + Math.sin(angle) * radius,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Connection lines */}
      {nodes.map((node, i) => {
        const nextNode = nodes[(i + 1) % nodeCount];
        return (
          <line
            key={`line-${i}`}
            x1={node.x}
            y1={node.y}
            x2={nextNode.x}
            y2={nextNode.y}
            stroke={color}
            strokeWidth="1"
            opacity="0.2"
            className={`connection-${i}`}
          />
        );
      })}
      
      {/* Center connecting lines */}
      {nodes.map((node, i) => (
        <line
          key={`center-line-${i}`}
          x1="36"
          y1="36"
          x2={node.x}
          y2={node.y}
          stroke={color}
          strokeWidth="1"
          opacity="0.15"
          className={`center-connection-${i}`}
        />
      ))}
      
      {/* Nodes */}
      {nodes.map((node, i) => (
        <g key={`node-${i}`} className={`node-${i}`}>
          <circle
            cx={node.x}
            cy={node.y}
            r="5"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          <circle
            cx={node.x}
            cy={node.y}
            r="2.5"
            fill={color}
            opacity="0.6"
          />
        </g>
      ))}
      
      {/* Center node */}
      <circle
        cx="36"
        cy="36"
        r="4"
        fill={color}
        opacity="0.8"
      />
    </svg>
  );
};
