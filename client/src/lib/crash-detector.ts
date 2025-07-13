// Crash Detection and Early Warning System
import { debugTracker } from './debug-tracker';

interface CrashPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detector: (events: any[]) => boolean;
  suggestions: string[];
}

class CrashDetector {
  private patterns: CrashPattern[] = [];
  private isEnabled: boolean;
  private checkInterval: number = 5000; // Check every 5 seconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.isEnabled = import.meta.env.DEV;
    this.initializePatterns();
    
    if (this.isEnabled) {
      this.startMonitoring();
      console.log('🚨 Crash Detector initialized');
    }
  }

  private initializePatterns() {
    this.patterns = [
      {
        id: 'rapid_errors',
        name: 'Rapid Error Burst',
        description: 'Multiple errors occurring in quick succession',
        severity: 'critical',
        detector: (events) => {
          const recentErrors = events.filter(e => 
            e.type === 'error' && 
            Date.now() - e.timestamp < 10000 // Last 10 seconds
          );
          return recentErrors.length >= 3;
        },
        suggestions: [
          'Check browser console for detailed error messages',
          'Verify API endpoints are responding correctly',
          'Check network connectivity',
          'Review recent code changes'
        ]
      },
      {
        id: 'api_failures',
        name: 'API Request Failures',
        description: 'Multiple API requests failing',
        severity: 'high',
        detector: (events) => {
          const recentApiErrors = events.filter(e => 
            e.type === 'api_call' && 
            e.data.action === 'fetch_complete' &&
            e.data.status >= 400 &&
            Date.now() - e.timestamp < 30000 // Last 30 seconds
          );
          return recentApiErrors.length >= 2;
        },
        suggestions: [
          'Check if backend server is running',
          'Verify API endpoint URLs',
          'Check authentication status',
          'Review server logs for errors'
        ]
      },
      {
        id: 'slow_responses',
        name: 'Slow API Responses',
        description: 'API responses taking longer than expected',
        severity: 'medium',
        detector: (events) => {
          const recentApiCalls = events.filter(e => 
            e.type === 'api_call' && 
            e.data.action === 'fetch_complete' &&
            e.performance?.apiResponseTime &&
            Date.now() - e.timestamp < 60000 // Last minute
          );
          
          if (recentApiCalls.length < 2) return false;
          
          const avgTime = recentApiCalls.reduce((sum, e) => 
            sum + (e.performance?.apiResponseTime || 0), 0
          ) / recentApiCalls.length;
          
          return avgTime > 3000; // Average > 3 seconds
        },
        suggestions: [
          'Check network connection speed',
          'Monitor server performance',
          'Consider implementing request caching',
          'Optimize database queries'
        ]
      },
      {
        id: 'memory_leak',
        name: 'Potential Memory Leak',
        description: 'Excessive number of events suggesting memory issues',
        severity: 'medium',
        detector: (events) => {
          return events.length > 800; // Too many events in session
        },
        suggestions: [
          'Refresh the page to clear memory',
          'Check for event listener leaks',
          'Review component cleanup in useEffect',
          'Monitor browser memory usage'
        ]
      },
      {
        id: 'infinite_loop',
        name: 'Potential Infinite Loop',
        description: 'Rapid repeated actions suggesting infinite loop',
        severity: 'high',
        detector: (events) => {
          const recentEvents = events.filter(e => 
            Date.now() - e.timestamp < 5000 // Last 5 seconds
          );
          
          // Check for same action repeated rapidly
          const actionCounts = recentEvents.reduce((acc, e) => {
            const key = `${e.type}_${e.data.action}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          return Object.values(actionCounts).some(count => (count as number) > 20);
        },
        suggestions: [
          'Check for infinite loops in React useEffect',
          'Verify state update dependencies',
          'Review recursive function calls',
          'Check for circular API calls'
        ]
      },
      {
        id: 'ui_freeze',
        name: 'UI Freeze Detection',
        description: 'No user interactions for extended period during active session',
        severity: 'low',
        detector: (events) => {
          const userActions = events.filter(e => 
            ['click', 'user_action'].includes(e.type)
          );
          
          if (userActions.length === 0) return false;
          
          const lastUserAction = Math.max(...userActions.map(e => e.timestamp));
          const timeSinceLastAction = Date.now() - lastUserAction;
          
          // No user action for 2 minutes but page is active
          return timeSinceLastAction > 120000 && events.length > 10;
        },
        suggestions: [
          'Check if page is responsive to clicks',
          'Verify JavaScript is not blocked',
          'Check for CSS issues preventing interactions',
          'Review loading states and spinners'
        ]
      }
    ];
  }

  private startMonitoring() {
    this.intervalId = setInterval(() => {
      this.checkForCrashes();
    }, this.checkInterval);
  }

  private checkForCrashes() {
    if (!this.isEnabled) return;

    const recentEvents = debugTracker.getRecentEvents(100);
    
    for (const pattern of this.patterns) {
      if (pattern.detector(recentEvents)) {
        this.reportCrashPattern(pattern);
      }
    }
  }

  private reportCrashPattern(pattern: CrashPattern) {
    const message = `🚨 ${pattern.name}: ${pattern.description}`;
    
    // Different notification methods based on severity
    switch (pattern.severity) {
      case 'critical':
        console.error(message);
        this.showCriticalAlert(pattern);
        break;
      case 'high':
        console.warn(message);
        this.showWarningNotification(pattern);
        break;
      case 'medium':
        console.warn(message);
        break;
      case 'low':
        console.info(message);
        break;
    }

    // Track the crash pattern detection
    debugTracker.trackCustomEvent('crash_pattern_detected', {
      patternId: pattern.id,
      severity: pattern.severity,
      timestamp: Date.now()
    });
  }

  private showCriticalAlert(pattern: CrashPattern) {
    // Create a modal-like alert for critical issues
    const alertDiv = document.createElement('div');
    alertDiv.id = 'crash-alert';
    alertDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fee2e2;
      border: 2px solid #dc2626;
      border-radius: 8px;
      padding: 20px;
      max-width: 500px;
      z-index: 10001;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      font-family: system-ui, sans-serif;
    `;

    alertDiv.innerHTML = `
      <div style="color: #dc2626; font-weight: bold; font-size: 18px; margin-bottom: 10px;">
        🚨 Critical Issue Detected
      </div>
      <div style="color: #7f1d1d; margin-bottom: 10px;">
        <strong>${pattern.name}</strong><br>
        ${pattern.description}
      </div>
      <div style="color: #7f1d1d; margin-bottom: 15px; font-size: 14px;">
        <strong>Suggestions:</strong>
        <ul style="margin: 5px 0; padding-left: 20px;">
          ${pattern.suggestions.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      <div style="text-align: center;">
        <button onclick="document.getElementById('crash-alert').remove()" 
                style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Acknowledge
        </button>
      </div>
    `;

    // Remove existing alert if present
    const existing = document.getElementById('crash-alert');
    if (existing) existing.remove();

    document.body.appendChild(alertDiv);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (document.getElementById('crash-alert')) {
        alertDiv.remove();
      }
    }, 30000);
  }

  private showWarningNotification(pattern: CrashPattern) {
    // Create a less intrusive notification for warnings
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 12px;
      max-width: 300px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: system-ui, sans-serif;
      font-size: 14px;
    `;

    notification.innerHTML = `
      <div style="color: #92400e; font-weight: bold; margin-bottom: 5px;">
        ⚠️ ${pattern.name}
      </div>
      <div style="color: #78350f; margin-bottom: 8px;">
        ${pattern.description}
      </div>
      <button onclick="this.parentElement.remove()" 
              style="background: #f59e0b; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">
        Dismiss
      </button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  public addCustomPattern(pattern: CrashPattern) {
    this.patterns.push(pattern);
  }

  public getDetectedIssues() {
    const events = debugTracker.getRecentEvents(100);
    const issues = [];

    for (const pattern of this.patterns) {
      if (pattern.detector(events)) {
        issues.push({
          pattern: pattern.name,
          severity: pattern.severity,
          description: pattern.description,
          suggestions: pattern.suggestions
        });
      }
    }

    return issues;
  }

  public generateHealthReport() {
    const metrics = debugTracker.getPerformanceMetrics();
    const issues = this.getDetectedIssues();
    
    return {
      timestamp: new Date().toISOString(),
      overallHealth: issues.length === 0 ? 'healthy' : 
                    issues.some(i => i.severity === 'critical') ? 'critical' :
                    issues.some(i => i.severity === 'high') ? 'warning' : 'minor_issues',
      metrics,
      detectedIssues: issues,
      recommendations: this.generateRecommendations(metrics, issues)
    };
  }

  private generateRecommendations(metrics: any, issues: any[]) {
    const recommendations = [];

    if (metrics.errors > 0) {
      recommendations.push('Review error logs and fix JavaScript errors');
    }

    if (metrics.averageApiResponseTime > 2000) {
      recommendations.push('Optimize API response times or implement caching');
    }

    if (metrics.totalEvents > 500) {
      recommendations.push('Consider reducing event tracking frequency');
    }

    if (issues.length > 0) {
      recommendations.push('Address detected crash patterns immediately');
    }

    return recommendations;
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Create global instance
export const crashDetector = new CrashDetector();

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).crashDetector = crashDetector;
}

export default crashDetector; 