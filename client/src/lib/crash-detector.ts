// Crash Detection and Early Warning System
import { debugTracker } from './debug-tracker';

interface CrashPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detector: (events: any[]) => boolean | ApiFailureDetail[];
  suggestions: string[];
}

interface ApiFailureDetail {
  url: string;
  method: string;
  status: number;
  error: string;
  timestamp: number;
  duration?: number;
}

class CrashDetector {
  private patterns: CrashPattern[] = [];
  private isEnabled: boolean;
  private checkInterval: number = 5000; // Check every 5 seconds
  private intervalId: NodeJS.Timeout | null = null;
  private failureHistory: ApiFailureDetail[] = [];
  private maxHistorySize: number = 20;

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
          
          if (recentApiErrors.length < 2) return false;
          
          // Extract detailed failure information
          const failures: ApiFailureDetail[] = recentApiErrors.map(e => ({
            url: e.data.url || 'Unknown endpoint',
            method: e.data.method || 'GET',
            status: e.data.status,
            error: e.data.error || e.data.statusText || `HTTP ${e.data.status}`,
            timestamp: e.timestamp,
            duration: e.performance?.apiResponseTime
          }));
          
          return failures;
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
          
          // Exclude normal user input events from loop detection
          const relevantEvents = recentEvents.filter(e => 
            !['input_change', 'console_log', 'viewport_resize'].includes(e.type) &&
            e.type !== 'user_action'
          );
          
          // Check for same action repeated rapidly (excluding normal user input)
          const actionCounts = relevantEvents.reduce((acc, e) => {
            const key = `${e.type}_${e.data.action}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          // Higher threshold - 30+ identical non-user events suggests real loop
          return Object.values(actionCounts).some(count => (count as number) > 30);
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

    const recentEvents = debugTracker.instance.getRecentEvents(100);
    
    for (const pattern of this.patterns) {
      const result = pattern.detector(recentEvents);
      if (result) {
        // Check if result contains API failure details
        const apiFailures = Array.isArray(result) ? result : undefined;
        this.reportCrashPattern(pattern, apiFailures);
      }
    }
  }

  private reportCrashPattern(pattern: CrashPattern, apiFailures?: ApiFailureDetail[]) {
    const message = `🚨 ${pattern.name}: ${pattern.description}`;
    
    // Store API failures in history
    if (apiFailures) {
      this.failureHistory.push(...apiFailures);
      // Keep only recent failures
      if (this.failureHistory.length > this.maxHistorySize) {
        this.failureHistory = this.failureHistory.slice(-this.maxHistorySize);
      }
    }
    
    // Different notification methods based on severity
    switch (pattern.severity) {
      case 'critical':
        console.error(message);
        this.showCriticalAlert(pattern);
        break;
      case 'high':
        console.warn(message);
        if (pattern.id === 'api_failures' && apiFailures) {
          this.showApiFailureNotification(apiFailures);
        } else {
          this.showWarningNotification(pattern);
        }
        break;
      case 'medium':
        console.warn(message);
        break;
      case 'low':
        console.info(message);
        break;
    }

    // Track the crash pattern detection
    debugTracker.instance.trackCustomEvent('crash_pattern_detected', {
      patternId: pattern.id,
      severity: pattern.severity,
      timestamp: Date.now(),
      apiFailures: apiFailures ? apiFailures.length : undefined
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

  private showApiFailureNotification(failures: ApiFailureDetail[]) {
    // Log detailed table to console
    console.group('🚨 API Request Failures Detected');
    console.table(failures.map(f => ({
      Method: f.method,
      Endpoint: f.url,
      Status: f.status,
      Error: f.error,
      Time: new Date(f.timestamp).toLocaleTimeString(),
      Duration: f.duration ? `${f.duration}ms` : 'N/A'
    })));
    console.groupEnd();

    // Get smart suggestions
    const suggestions = this.getSmartSuggestions(failures);
    
    // Show top 3 most recent failures
    const displayFailures = failures.slice(0, 3);
    const hasMore = failures.length > 3;

    // Create enhanced notification
    const notification = document.createElement('div');
    notification.id = 'api-failure-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 14px;
      max-width: 450px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.4;
    `;

    const failuresHtml = displayFailures.map(f => {
      const statusColor = f.status >= 500 ? '#dc2626' : f.status >= 400 ? '#f59e0b' : '#3b82f6';
      const timeAgo = this.formatTimeAgo(f.timestamp);
      
      return `
        <div style="background: white; border-left: 3px solid ${statusColor}; padding: 8px; margin: 6px 0; border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="background: ${statusColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;">
              ${f.method}
            </span>
            <span style="color: #78350f; font-weight: 500; font-size: 12px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${f.url}
            </span>
            <span style="color: ${statusColor}; font-weight: bold; font-size: 12px;">
              ${f.status}
            </span>
          </div>
          <div style="color: #92400e; font-size: 12px; margin-left: 4px;">
            ${f.error}
          </div>
          <div style="color: #a16207; font-size: 11px; margin-top: 3px; margin-left: 4px;">
            ${timeAgo}${f.duration ? ` • ${f.duration}ms` : ''}
          </div>
        </div>
      `;
    }).join('');

    const suggestionsHtml = suggestions.length > 0 ? `
      <div style="background: #fffbeb; border-radius: 4px; padding: 8px; margin-top: 8px;">
        <div style="color: #92400e; font-weight: 600; font-size: 12px; margin-bottom: 4px;">
          💡 Suggestions:
        </div>
        ${suggestions.map(s => `
          <div style="color: #78350f; font-size: 11px; margin-left: 8px; margin-top: 2px;">
            • ${s}
          </div>
        `).join('')}
      </div>
    ` : '';

    notification.innerHTML = `
      <div style="color: #92400e; font-weight: bold; font-size: 14px; margin-bottom: 8px;">
        ⚠️ API Request Failures (${failures.length} failed)
      </div>
      <div style="color: #78350f; font-size: 12px; margin-bottom: 8px;">
        Recent failures in the last 30 seconds:
      </div>
      ${failuresHtml}
      ${hasMore ? `
        <div style="color: #a16207; font-size: 11px; margin-top: 6px; text-align: center;">
          + ${failures.length - 3} more failures (see console for details)
        </div>
      ` : ''}
      ${suggestionsHtml}
      <div style="display: flex; gap: 6px; margin-top: 10px;">
        <button onclick="console.log('API Failures:', ${JSON.stringify(failures).replace(/"/g, '&quot;')})" 
                style="background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; flex: 1;">
          View in Console
        </button>
        <button onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(failures).replace(/"/g, '&quot;')}, null, 2))" 
                style="background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; flex: 1;">
          Copy Details
        </button>
        <button onclick="this.closest('#api-failure-notification').remove()" 
                style="background: #f59e0b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
          Dismiss
        </button>
      </div>
    `;

    // Remove existing notification if present
    const existing = document.getElementById('api-failure-notification');
    if (existing) existing.remove();

    document.body.appendChild(notification);

    // Auto-remove after 15 seconds (longer for detailed info)
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 15000);
  }

  private getSmartSuggestions(failures: ApiFailureDetail[]): string[] {
    const suggestions: string[] = [];
    const statuses = failures.map(f => f.status);
    const uniqueStatuses = Array.from(new Set(statuses));

    // Authentication issues
    if (uniqueStatuses.some(s => s === 401 || s === 403)) {
      suggestions.push('🔐 Authentication issue - Try logging in again');
    }

    // Not found errors
    if (uniqueStatuses.some(s => s === 404)) {
      suggestions.push('🔍 Endpoint not found - Check API route configuration');
    }

    // Server errors
    if (uniqueStatuses.some(s => s >= 500)) {
      suggestions.push('🔥 Server error - Check backend logs and database connection');
    }

    // Service unavailable
    if (uniqueStatuses.some(s => s === 503)) {
      suggestions.push('⚠️ Service unavailable - Verify backend server is running');
    }

    // Admin endpoints
    if (failures.some(f => f.url.includes('/admin/'))) {
      suggestions.push('👤 Admin endpoint - Verify admin authentication');
    }

    // MongoDB/Database related
    if (failures.some(f => f.error.toLowerCase().includes('database') || f.error.toLowerCase().includes('mongo'))) {
      suggestions.push('🗄️ Database issue - Check MongoDB connection');
    }

    // Network/CORS issues
    if (failures.some(f => f.error.toLowerCase().includes('cors') || f.error.toLowerCase().includes('network'))) {
      suggestions.push('🌐 Network/CORS issue - Check backend CORS configuration');
    }

    return suggestions;
  }

  private formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  public addCustomPattern(pattern: CrashPattern) {
    this.patterns.push(pattern);
  }

  public getDetectedIssues() {
    const events = debugTracker.instance.getRecentEvents(100);
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
    const metrics = debugTracker.instance.getPerformanceMetrics();
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

  public getFailureHistory(): ApiFailureDetail[] {
    return [...this.failureHistory];
  }

  public clearFailureHistory() {
    this.failureHistory = [];
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Create lazy instance
let _crashDetector: CrashDetector | null = null;

export const crashDetector = {
  get instance() {
    if (!_crashDetector) {
      _crashDetector = new CrashDetector();
    }
    return _crashDetector;
  }
};

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).crashDetector = crashDetector.instance;
}

export default crashDetector; 