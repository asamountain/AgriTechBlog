import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { debugTracker } from '@/lib/debug-tracker';
import { flowDiagramGenerator } from '@/lib/flow-diagram';
import type { DebugEvent } from '@/lib/debug-tracker';
import { Download, Play, Pause, RefreshCw, Database, FileText, AlertTriangle, CheckCircle, Bug, Settings, FileCode, HelpCircle } from 'lucide-react';

interface FlowNode {
  id: string;
  type: 'action' | 'api' | 'error' | 'navigation' | 'db_interaction';
  label: string;
  timestamp: number;
  data: any;
  success?: boolean;
  postRelated?: boolean;
}

export default function DebugFlowVisualizer() {
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [isTracking, setIsTracking] = useState(true);
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
  const [postSummary, setPostSummary] = useState<any>(null);
  // Hidden by default, restore from localStorage if previously shown
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('debug-visualizer-visible');
    return saved === 'true'; // Defaults to false (hidden)
  });

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('🔧 DebugFlowVisualizer mounted');
    return () => console.log('🔧 DebugFlowVisualizer unmounted');
  }, []);

  // Listen for keyboard shortcut toggle from App.tsx
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('debug-visualizer-visible');
      setIsVisible(saved === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const updateEvents = () => {
      if (isTracking) {
        const recentEvents = debugTracker.instance.getRecentEvents(100);
        setEvents(recentEvents);
        
        // Get post-specific summary
        const summary = debugTracker.instance.getCurrentPostSummary();
        setPostSummary(summary);
        
        // Convert events to flow nodes
        const nodes: FlowNode[] = recentEvents.map((event: DebugEvent) => ({
          id: event.id,
          type: event.type === 'db_interaction' ? 'db_interaction' : 
                event.type === 'api_call' ? 'api' :
                event.type === 'error' ? 'error' :
                event.type === 'navigation' ? 'navigation' : 'action',
          label: event.type === 'db_interaction' ? 
                   `${event.data.dbOperation}: ${event.data.postId || 'unknown'}` :
                 event.type === 'click' ? 
                   `Click: ${event.metadata?.element?.selector || event.data.tagName}` :
                 event.type === 'api_call' ? 
                   `API: ${event.data.action}` :
                 event.type === 'navigation' ?
                   `Nav: ${event.data.action}` :
                 event.data.action || event.type,
          timestamp: event.timestamp,
          data: event.data,
          success: event.data.success,
          postRelated: !!(event.metadata?.post || event.data?.postId || event.type === 'db_interaction')
        }));
        
        setFlowNodes(nodes);
      }
    };

    // Update immediately
    updateEvents();
    
    // Update every 2 seconds
    const interval = setInterval(updateEvents, 2000);
    return () => clearInterval(interval);
  }, [isTracking]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const clearEvents = () => {
    debugTracker.instance.clear();
    setEvents([]);
    setFlowNodes([]);
    setPostSummary(null);
  };

  const exportFlowData = () => {
    const flowData = {
      timestamp: new Date().toISOString(),
      postSummary,
      events: events.map(e => ({
        type: e.type,
        timestamp: e.timestamp,
        data: e.data,
        metadata: e.metadata
      })),
             mermaidDiagram: flowDiagramGenerator.instance.generateUserJourneyDiagram()
    };
    
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-flow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getNodeColor = (node: FlowNode): string => {
    if (node.type === 'error') return '#ef4444';
    if (node.type === 'db_interaction') return node.success ? '#10b981' : '#ef4444';
    if (node.type === 'api') return node.success ? '#3b82f6' : '#ef4444';
    if (node.type === 'navigation') return '#6366f1';
    if (node.postRelated) return '#f59e0b';
    return '#6b7280';
  };

  const getStatusIcon = (success?: boolean) => {
    if (success === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (success === false) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return null;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const dbInteractions = events.filter(e => e.type === 'db_interaction');
  const postEvents = events.filter(e => e.metadata?.post || e.data?.postId);
  const metrics = debugTracker.instance.getPerformanceMetrics();

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem('debug-visualizer-visible', String(newVisibility));
  };

  // If not visible, show only a small toggle button
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleVisibility}
          className="bg-forest-green hover:bg-forest-green/90 text-white shadow-lg"
          size="sm"
        >
          🔍 Show Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-h-96 overflow-y-auto bg-white shadow-2xl border-t-4 border-blue-500">
      <Card className="w-full border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🔍 Debug Flow Visualizer
              {postSummary && (
                <Badge variant="outline" className="ml-2">
                  <FileText className="h-3 w-3 mr-1" />
                  Post: {postSummary.postId}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleVisibility}
                className="flex items-center gap-1"
              >
                👁️ Hide
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTracking}
                className="flex items-center gap-1"
              >
                {isTracking ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearEvents}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportFlowData}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="flow" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flow">Flow Diagram</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="post">Post Details</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="flow" className="space-y-4">
            <div className="h-96 border rounded-lg p-4 overflow-auto bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {flowNodes.slice(-20).map((node, index) => (
                  <div
                    key={node.id}
                    className="flex items-center gap-2 p-2 bg-white rounded border shadow-sm min-w-[200px]"
                    style={{ borderLeft: `4px solid ${getNodeColor(node)}` }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        {node.type === 'db_interaction' && <Database className="h-3 w-3" />}
                        {node.postRelated && <FileText className="h-3 w-3 text-orange-500" />}
                        {node.label}
                        {getStatusIcon(node.success)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(node.timestamp)}
                      </div>
                      {node.type === 'db_interaction' && (
                        <div className="text-xs mt-1">
                          <Badge variant={node.success ? "default" : "destructive"} className="text-xs">
                            {node.data.method} {node.success ? 'Success' : 'Failed'}
                          </Badge>
                          {node.data.responseTime && (
                            <span className="ml-1 text-gray-500">
                              {Math.round(node.data.responseTime)}ms
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {index < flowNodes.length - 1 && (
                      <div className="text-gray-400">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="timeline" className="space-y-4">
            <div className="h-96 overflow-auto border rounded-lg">
              <div className="space-y-2 p-4">
                {events.slice(-50).reverse().map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded border-l-4 ${
                      event.type === 'error' ? 'border-red-500 bg-red-50' :
                      event.type === 'db_interaction' ? 'border-blue-500 bg-blue-50' :
                      event.metadata?.post || event.data?.postId ? 'border-orange-500 bg-orange-50' :
                      'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {event.type === 'db_interaction' && (
                          <Badge variant={event.data.success ? "default" : "destructive"} className="text-xs">
                            <Database className="h-3 w-3 mr-1" />
                            {event.data.dbOperation}
                          </Badge>
                        )}
                        {(event.metadata?.post || event.data?.postId) && (
                          <Badge variant="outline" className="text-xs text-orange-600">
                            <FileText className="h-3 w-3 mr-1" />
                            Post Related
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="font-medium">
                        {event.data.action || event.data.url || 'Unknown action'}
                      </div>
                      {event.type === 'db_interaction' && event.data.postId && (
                        <div className="text-xs text-gray-600 mt-1">
                          Post ID: {event.data.postId}
                          {event.data.responseTime && ` • ${Math.round(event.data.responseTime)}ms`}
                          {event.data.error && (
                            <div className="text-red-600 mt-1">Error: {event.data.error}</div>
                          )}
                        </div>
                      )}
                      {event.metadata?.element?.selector && (
                        <div className="text-xs text-gray-600 mt-1">
                          Element: {event.metadata.element.selector}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="post" className="space-y-4">
            {postSummary ? (
              <div className="grid grid-cols-1 gap-4">
                {/* Post Information and Database Status Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Post Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="font-medium">Post ID:</span> {postSummary.postId}
                      </div>
                      <div>
                        <span className="font-medium">Fetch Attempts:</span> {postSummary.fetchAttempts}
                      </div>
                      <div>
                        <span className="font-medium">Update Attempts:</span> {postSummary.updateAttempts}
                      </div>
                      {postSummary.lastSuccessfulFetch && (
                        <div className="border-t pt-3">
                          <div className="font-medium text-green-600 mb-2">✓ Last Successful Fetch:</div>
                          <div className="space-y-1 text-sm">
                            <div><span className="font-medium">Title:</span> {postSummary.lastSuccessfulFetch.postData?.title || 'N/A'}</div>
                            <div><span className="font-medium">Published:</span> {postSummary.lastSuccessfulFetch.postData?.isPublished ? 'Yes' : 'No'}</div>
                            <div><span className="font-medium">Content Length:</span> {postSummary.lastSuccessfulFetch.postData?.contentLength || 0} characters</div>
                            <div><span className="font-medium">Tags:</span> {postSummary.lastSuccessfulFetch.postData?.tags?.length || 0}</div>
                            <div><span className="font-medium">Fetched:</span> {formatTime(postSummary.lastSuccessfulFetch.timestamp)}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Database Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {postSummary.lastFetch && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">Last Fetch:</span>
                            {getStatusIcon(postSummary.lastFetch.success)}
                            <Badge variant={postSummary.lastFetch.success ? "default" : "destructive"}>
                              {postSummary.lastFetch.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(postSummary.lastFetch.timestamp)}
                            {postSummary.lastFetch.responseTime && ` • ${Math.round(postSummary.lastFetch.responseTime)}ms`}
                          </div>
                          {postSummary.lastFetch.error && (
                            <div className="text-sm text-red-600 mt-1">
                              Error: {postSummary.lastFetch.error}
                            </div>
                          )}
                        </div>
                      )}

                      {postSummary.lastUpdate && (
                        <div className="border-t pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">Last Update:</span>
                            {getStatusIcon(postSummary.lastUpdate.success)}
                            <Badge variant={postSummary.lastUpdate.success ? "default" : "destructive"}>
                              {postSummary.lastUpdate.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(postSummary.lastUpdate.timestamp)}
                            {postSummary.lastUpdate.responseTime && ` • ${Math.round(postSummary.lastUpdate.responseTime)}ms`}
                          </div>
                          {postSummary.lastUpdate.error && (
                            <div className="text-sm text-red-600 mt-1">
                              Error: {postSummary.lastUpdate.error}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="border-t pt-3">
                        <div className="text-sm text-gray-600">
                          <div>Total DB Interactions: {dbInteractions.length}</div>
                          <div>Post-related Events: {postEvents.length}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Failure Analysis Section */}
                {(postSummary.lastFetch && !postSummary.lastFetch.success) && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                        <Bug className="h-5 w-5" />
                        🚨 Failure Analysis & Troubleshooting
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {postSummary.lastFetch.diagnostics && (
                        <div className="space-y-4">
                          {/* Error Summary */}
                          <div className="bg-white p-4 rounded border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-700">
                                {postSummary.lastFetch.diagnostics.detailedAnalysis.step}
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                {postSummary.lastFetch.diagnostics.errorType.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Issue:</strong> {postSummary.lastFetch.diagnostics.detailedAnalysis.issue}
                            </p>
                            <div className="text-xs text-gray-600">
                              <strong>Endpoint:</strong> {postSummary.lastFetch.diagnostics.urlFormat}<br/>
                              <strong>HTTP Status:</strong> {postSummary.lastFetch.diagnostics.httpStatus || 'Network Error'}<br/>
                              <strong>Failure Step:</strong> {postSummary.lastFetch.diagnostics.failureStep.replace('_', ' ')}
                            </div>
                          </div>

                          {/* Troubleshooting Steps */}
                          <div className="bg-white p-4 rounded border border-orange-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Settings className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-orange-700">🔧 Troubleshooting Steps</span>
                            </div>
                            <ol className="space-y-1 text-sm">
                              {postSummary.lastFetch.diagnostics.detailedAnalysis.troubleshootingSteps.map((step: string, index: number) => (
                                <li key={index} className="text-gray-700">
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Possible Causes */}
                          <div className="bg-white p-4 rounded border border-yellow-200">
                            <div className="flex items-center gap-2 mb-3">
                              <HelpCircle className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-yellow-700">🤔 Possible Causes</span>
                            </div>
                            <ul className="space-y-1 text-sm">
                              {postSummary.lastFetch.diagnostics.detailedAnalysis.possibleCauses.map((cause: string, index: number) => (
                                <li key={index} className="text-gray-700 flex items-start gap-2">
                                  <span className="text-yellow-600 mt-1">•</span>
                                  {cause}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Project Files to Check */}
                          <div className="bg-white p-4 rounded border border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                              <FileCode className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-700">📁 Project Files to Check</span>
                            </div>
                            <ul className="space-y-1 text-sm">
                              {postSummary.lastFetch.diagnostics.detailedAnalysis.projectFiles.map((file: string, index: number) => (
                                <li key={index} className="text-gray-700 font-mono text-xs bg-gray-100 p-1 rounded">
                                  {file}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Configuration Checks */}
                          <div className="bg-white p-4 rounded border border-purple-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Settings className="h-4 w-4 text-purple-600" />
                              <span className="font-medium text-purple-700">⚙️ Configuration to Verify</span>
                            </div>
                            <ul className="space-y-1 text-sm">
                              {postSummary.lastFetch.diagnostics.detailedAnalysis.configChecks.map((check: string, index: number) => (
                                <li key={index} className="text-gray-700 flex items-start gap-2">
                                  <span className="text-purple-600 mt-1">✓</span>
                                  {check}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Quick Actions */}
                          <div className="bg-gray-50 p-4 rounded border">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-medium text-gray-700">🚀 Quick Actions</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  console.log('🔍 Debug Analysis:', postSummary.lastFetch.diagnostics);
                                  console.log('📋 Copy this debug info to share with developers');
                                }}
                                className="text-xs"
                              >
                                📋 Copy Debug Info
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  window.open('/admin', '_blank');
                                }}
                                className="text-xs"
                              >
                                🔍 Check Admin Panel
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  window.location.reload();
                                }}
                                className="text-xs"
                              >
                                🔄 Refresh Page
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const guide = debugTracker.instance.getDetailedTroubleshootingGuide();
                                  console.log('📖 Detailed Troubleshooting Guide:', guide);
                                }}
                                className="text-xs"
                              >
                                📖 Full Guide
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No post data detected. Navigate to an edit-post page to see post-specific information.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{metrics.totalEvents}</div>
                  <div className="text-sm text-gray-500">Total Events</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{metrics.dbInteractions}</div>
                  <div className="text-sm text-gray-500">DB Interactions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{metrics.errors}</div>
                  <div className="text-sm text-gray-500">Errors</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {Math.round(metrics.averageApiResponseTime)}ms
                  </div>
                  <div className="text-sm text-gray-500">Avg Response</div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Session Duration:</span>
                    <div>{Math.round(metrics.sessionDuration / 1000)}s</div>
                  </div>
                  <div>
                    <span className="font-medium">Page Load Time:</span>
                    <div>{metrics.pageLoadTime ? `${Math.round(metrics.pageLoadTime)}ms` : 'N/A'}</div>
                  </div>
                  <div>
                    <span className="font-medium">API Calls:</span>
                    <div>{metrics.apiCalls}</div>
                  </div>
                  <div>
                    <span className="font-medium">Performance Events:</span>
                    <div>{metrics.performanceEvents}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </div>
  );
} 