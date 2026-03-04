// Simple Flow Diagram Generator for Debugging
import { debugTracker } from './debug-tracker';

interface DiagramNode {
  id: string;
  label: string;
  type: 'start' | 'action' | 'decision' | 'api' | 'error' | 'end';
  x: number;
  y: number;
  connections: string[];
  metadata?: any;
}

interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
  type: 'success' | 'error' | 'normal';
}

class FlowDiagramGenerator {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private nodes: DiagramNode[] = [];
  private connections: DiagramConnection[] = [];

  public generateUserJourneyDiagram(): string {
    const events = debugTracker.instance.getRecentEvents(50);
    this.createUserJourneyFromEvents(events);
    return this.exportAsMermaid();
  }

  public generateCrashFlowDiagram(): string {
    const events = debugTracker.instance.getEventsByType('error');
    this.createCrashFlowFromEvents(events);
    return this.exportAsMermaid();
  }

  private createUserJourneyFromEvents(events: any[]) {
    // Track the diagram generation
    debugTracker.instance.trackCustomEvent('flow_diagram_generated', {
      type: 'user_journey',
      eventCount: events.length
    });

    this.nodes = [];
    this.connections = [];

    // Group events by type and create nodes
    const pageViews = events.filter(e => e.type === 'navigation');
    const clicks = events.filter(e => e.type === 'click');
    const apiCalls = events.filter(e => e.type === 'api_call');
    const errors = events.filter(e => e.type === 'error');

    let nodeId = 1;

    // Start node
    this.nodes.push({
      id: 'start',
      label: 'User Session Start',
      type: 'start',
      x: 0,
      y: 0,
      connections: []
    });

    let lastNodeId = 'start';

    // Process events chronologically
    events.forEach((event, index) => {
      const currentNodeId = `node_${nodeId++}`;
      let nodeType: DiagramNode['type'] = 'action';
      let label = '';

      switch (event.type) {
        case 'navigation':
          nodeType = 'action';
          label = `Navigate: ${event.data.action}`;
          break;
        case 'click':
          nodeType = 'action';
          label = `Click: ${this.truncateText(event.element || 'Unknown', 20)}`;
          break;
        case 'api_call':
          nodeType = 'api';
          label = `API: ${event.data.action}`;
          break;
        case 'error':
          nodeType = 'error';
          label = `Error: ${this.truncateText(event.data.message, 25)}`;
          break;
        default:
          nodeType = 'action';
          label = `${event.type}: ${event.data.action || 'Unknown'}`;
      }

      this.nodes.push({
        id: currentNodeId,
        label: label,
        type: nodeType,
        x: index * 100,
        y: nodeType === 'error' ? 100 : 0,
        connections: [],
        metadata: event
      });

      // Create connection from previous node
      this.connections.push({
        from: lastNodeId,
        to: currentNodeId,
        type: nodeType === 'error' ? 'error' : 'normal'
      });

      lastNodeId = currentNodeId;
    });

    // End node
    this.nodes.push({
      id: 'end',
      label: 'Current State',
      type: 'end',
      x: events.length * 100,
      y: 0,
      connections: []
    });

    this.connections.push({
      from: lastNodeId,
      to: 'end',
      type: 'normal'
    });
  }

  private createCrashFlowFromEvents(errorEvents: any[]) {
    // Track the crash flow generation
    debugTracker.instance.trackCustomEvent('flow_diagram_generated', {
      type: 'crash_flow',
      eventCount: errorEvents.length
    });

    this.nodes = [];
    this.connections = [];

    if (errorEvents.length === 0) {
      this.nodes.push({
        id: 'no_errors',
        label: 'No Errors Detected',
        type: 'start',
        x: 0,
        y: 0,
        connections: []
      });
      return;
    }

    let nodeId = 1;

    errorEvents.forEach((error, index) => {
      const nodeIdStr = `error_${nodeId++}`;
      
      this.nodes.push({
        id: nodeIdStr,
        label: `Error: ${this.truncateText(error.data.message, 30)}`,
        type: 'error',
        x: index * 150,
        y: 0,
        connections: [],
        metadata: error
      });

      if (index > 0) {
        this.connections.push({
          from: `error_${nodeId - 2}`,
          to: nodeIdStr,
          type: 'error',
          label: `${Math.round((error.timestamp - errorEvents[index - 1].timestamp) / 1000)}s later`
        });
      }
    });
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private exportAsMermaid(): string {
    let mermaid = 'graph TD\n';

    // Add nodes
    this.nodes.forEach(node => {
      const shape = this.getMermaidShape(node.type);
      const sanitizedLabel = node.label.replace(/["\n]/g, ' ');
      mermaid += `    ${node.id}${shape.start}"${sanitizedLabel}"${shape.end}\n`;
    });

    mermaid += '\n';

    // Add connections
    this.connections.forEach(conn => {
      const arrow = conn.type === 'error' ? '-.->|' : '-->';
      const label = conn.label ? `|${conn.label}|` : '';
      mermaid += `    ${conn.from} ${arrow}${label} ${conn.to}\n`;
    });

    // Add styling
    mermaid += '\n';
    mermaid += '    classDef errorNode fill:#fee2e2,stroke:#dc2626,stroke-width:2px\n';
    mermaid += '    classDef apiNode fill:#fef3c7,stroke:#f59e0b,stroke-width:2px\n';
    mermaid += '    classDef actionNode fill:#dcfce7,stroke:#16a34a,stroke-width:2px\n';

    // Apply classes
    this.nodes.forEach(node => {
      if (node.type === 'error') {
        mermaid += `    class ${node.id} errorNode\n`;
      } else if (node.type === 'api') {
        mermaid += `    class ${node.id} apiNode\n`;
      } else if (node.type === 'action') {
        mermaid += `    class ${node.id} actionNode\n`;
      }
    });

    return mermaid;
  }

  private getMermaidShape(type: DiagramNode['type']): { start: string; end: string } {
    const shapes = {
      start: { start: '([', end: '])' },
      end: { start: '([', end: '])' },
      action: { start: '[', end: ']' },
      decision: { start: '{', end: '}' },
      api: { start: '((', end: '))' },
      error: { start: '>', end: ']' }
    };
    return shapes[type] || shapes.action;
  }

  public createCanvasDiagram(containerId: string, width: number = 800, height: number = 400): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.border = '1px solid #ccc';
    this.canvas.style.borderRadius = '8px';
    
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    if (this.ctx) {
      this.drawDiagram();
    }
  }

  private drawDiagram(): void {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw connections first
    this.connections.forEach(conn => {
      this.drawConnection(conn);
    });

    // Draw nodes
    this.nodes.forEach(node => {
      this.drawNode(node);
    });
  }

  private drawNode(node: DiagramNode): void {
    if (!this.ctx) return;

    const x = node.x + 50;
    const y = node.y + 50;
    const width = 120;
    const height = 40;

    // Set colors based on type
    const colors = {
      start: { bg: '#dcfce7', border: '#16a34a' },
      end: { bg: '#dcfce7', border: '#16a34a' },
      action: { bg: '#dbeafe', border: '#2563eb' },
      decision: { bg: '#fef3c7', border: '#f59e0b' },
      api: { bg: '#f3e8ff', border: '#9333ea' },
      error: { bg: '#fee2e2', border: '#dc2626' }
    };

    const color = colors[node.type];

    // Draw node background
    this.ctx.fillStyle = color.bg;
    this.ctx.fillRect(x - width/2, y - height/2, width, height);

    // Draw border
    this.ctx.strokeStyle = color.border;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - width/2, y - height/2, width, height);

    // Draw text
    this.ctx.fillStyle = '#000';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Wrap text if too long
    const maxWidth = width - 10;
    const words = node.label.split(' ');
    let line = '';
    let lineY = y - 5;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, lineY);
        line = words[n] + ' ';
        lineY += 15;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, lineY);
  }

  private drawConnection(conn: DiagramConnection): void {
    if (!this.ctx) return;

    const fromNode = this.nodes.find(n => n.id === conn.from);
    const toNode = this.nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) return;

    const fromX = fromNode.x + 50 + 60;
    const fromY = fromNode.y + 50;
    const toX = toNode.x + 50 - 60;
    const toY = toNode.y + 50;

    // Set line style based on connection type
    this.ctx.strokeStyle = conn.type === 'error' ? '#dc2626' : '#6b7280';
    this.ctx.lineWidth = conn.type === 'error' ? 3 : 2;
    
    if (conn.type === 'error') {
      this.ctx.setLineDash([5, 5]);
    } else {
      this.ctx.setLineDash([]);
    }

    // Draw line
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();

    // Draw arrow
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 10;
    
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowLength * Math.cos(angle - Math.PI / 6),
      toY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowLength * Math.cos(angle + Math.PI / 6),
      toY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();

    // Reset line dash
    this.ctx.setLineDash([]);
  }

  public exportDiagramAsImage(): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL('image/png');
  }
}

// Create lazy instance
let _flowDiagramGenerator: FlowDiagramGenerator | null = null;

export const flowDiagramGenerator = {
  get instance() {
    if (!_flowDiagramGenerator) {
      _flowDiagramGenerator = new FlowDiagramGenerator();
    }
    return _flowDiagramGenerator;
  }
};

export default flowDiagramGenerator; 