// Enhanced Debug Tracker for Development
export interface DebugEvent {
  id: string;
  timestamp: number;
  type: 'click' | 'api_call' | 'navigation' | 'form_submit' | 'input_change' | 'performance' | 'error' | 'post_fetch' | 'post_update' | 'db_interaction' | 'console_log' | 'console_warn' | 'console_error' | 'console_info' | 'api_route_mismatch';
  data: any;
  metadata?: {
    url?: string;
    userAgent?: string;
    viewport?: { width: number; height: number };
    element?: {
      tagName?: string;
      className?: string;
      id?: string;
      textContent?: string;
      selector?: string;
    };
    performance?: {
      loadTime?: number;
      apiResponseTime?: number;
      firstContentfulPaint?: number;
    };
    // Post-specific metadata
    post?: {
      id?: string | number;
      title?: string;
      status?: 'loading' | 'success' | 'error';
      fetchSuccess?: boolean;
      updateSuccess?: boolean;
      dbOperation?: string;
      error?: string;
    };
  };
}

interface DebugSession {
  sessionId: string;
  startTime: number;
  events: DebugEvent[];
  userAgent: string;
  viewport: { width: number; height: number };
  url: string;
}

interface DatabaseFailureAnalysis {
  step: string;
  issue: string;
  possibleCauses: string[];
  troubleshootingSteps: string[];
  projectFiles: string[];
  configChecks: string[];
}

interface PostFetchDiagnostics {
  postId: string;
  urlFormat: string;
  endpointUsed: string;
  httpStatus?: number;
  errorType: 'network' | 'server' | 'database' | 'id_mismatch' | 'permission' | 'unknown';
  failureStep: 'url_parsing' | 'api_request' | 'database_query' | 'id_resolution' | 'data_formatting' | 'response_parsing';
  detailedAnalysis: DatabaseFailureAnalysis;
  mongodbChecks?: {
    connectionStatus: string;
    databaseName: string;
    collectionExists: boolean;
    postExists: boolean;
    idStrategy: 'explicit_id' | 'generated_id' | 'object_id' | 'not_found';
  };
}

class DebugTracker {
  private session: DebugSession;
  private isEnabled: boolean;
  private eventBuffer: DebugEvent[] = [];
  private maxEvents = 1000; // Prevent memory issues
  private currentPostId: string | null = null;
  private postFetchAttempts = 0;
  private postUpdateAttempts = 0;
  private postFetchDiagnostics: Map<string, PostFetchDiagnostics>;
  
  // Store original console methods
  private originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  constructor() {
    this.isEnabled = import.meta.env.DEV; // Only enable in development
    this.postFetchDiagnostics = new Map();
    this.session = this.initializeSession();
    
    if (this.isEnabled) {
      this.setupGlobalListeners();
      this.setupPerformanceTracking();
      this.setupErrorTracking();
      this.interceptFetch();
      this.interceptConsole();
      this.originalConsole.log('🔍 Debug Tracker initialized', this.session.sessionId);
    }
  }

  private detectCurrentPostId(): string | null {
    const path = window.location.pathname;
    const editPostMatch = path.match(/\/edit-post\/(.+)/);
    if (editPostMatch) {
      return editPostMatch[1];
    }
    return null;
  }

  private updateCurrentPostContext() {
    const newPostId = this.detectCurrentPostId();
    if (newPostId !== this.currentPostId) {
      this.currentPostId = newPostId;
      if (newPostId) {
        this.trackEvent('navigation', {
          action: 'edit_post_page_entered',
          postId: newPostId,
          url: window.location.href
        }, {
          post: {
            id: newPostId,
            status: 'loading'
          }
        });
      }
    }
  }

  private initializeSession(): DebugSession {
    return {
      sessionId: `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      events: [],
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      url: window.location.href
    };
  }

  private setupGlobalListeners() {
    // Update post context on navigation
    this.updateCurrentPostContext();

    // Track ALL clicks with detailed information
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackEvent('click', {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.substring(0, 100),
        coordinates: { x: event.clientX, y: event.clientY },
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey
      }, {
        element: {
          tagName: target.tagName,
          className: target.className,
          id: target.id,
          textContent: target.textContent?.substring(0, 100),
          selector: this.getElementSelector(target)
        }
      });
    }, true);

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackEvent('form_submit', {
        action: 'form_submit',
        formId: form.id,
        formAction: form.action,
        formMethod: form.method
      }, {
        element: {
          tagName: form.tagName,
          id: form.id,
          selector: this.getElementSelector(form)
        }
      });
    }, true);

    // Track input changes
    document.addEventListener('input', (event) => {
      const input = event.target as HTMLInputElement;
      this.trackEvent('input_change', {
        action: 'input_change',
        inputType: input.type,
        inputName: input.name,
        valueLength: input.value?.length || 0
      }, {
        element: {
          tagName: input.tagName,
          id: input.id,
          selector: this.getElementSelector(input)
        }
      });
    }, true);

    // Track navigation
    window.addEventListener('popstate', () => {
      this.updateCurrentPostContext();
      this.trackEvent('navigation', {
        action: 'browser_back_forward',
        url: window.location.href,
        referrer: document.referrer
      });
    });

    // Track viewport changes
    window.addEventListener('resize', () => {
      this.trackEvent('navigation', {
        action: 'viewport_resize',
        newViewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }, {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    });

    // Monitor for URL changes (for SPA navigation)
    let lastUrl = window.location.href;
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.updateCurrentPostContext();
        this.trackEvent('navigation', {
          action: 'url_change',
          url: currentUrl,
          timestamp: Date.now()
        });
      }
    };
    
    // Check for URL changes periodically
    setInterval(checkUrlChange, 100);
  }

  private setupPerformanceTracking() {
    // Track page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.trackEvent('performance', {
        action: 'page_load',
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: this.getFirstContentfulPaint(),
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
      }, {
        performance: {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          firstContentfulPaint: this.getFirstContentfulPaint() || undefined
        }
      });
    });
  }

  private setupErrorTracking() {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackEvent('error', {
        action: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('error', {
        action: 'unhandled_promise_rejection',
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });
  }

  private analyzePostFetchFailure(
    postId: string,
    url: string,
    method: string,
    status: number,
    error: string,
    responseTime: number
  ): PostFetchDiagnostics {
    
    let errorType: PostFetchDiagnostics['errorType'] = 'unknown';
    let failureStep: PostFetchDiagnostics['failureStep'] = 'api_request';
    let analysis: DatabaseFailureAnalysis;

    // Determine error type and failure step
    if (status === 0) {
      errorType = 'network';
      failureStep = 'api_request';
    } else if (status === 404) {
      errorType = 'id_mismatch';
      failureStep = 'id_resolution';
    } else if (status === 500) {
      errorType = 'database';
      failureStep = 'database_query';
    } else if (status >= 400 && status < 500) {
      errorType = 'permission';
      failureStep = 'api_request';
    } else if (responseTime > 10000) {
      errorType = 'network';
      failureStep = 'database_query';
    }

    // Generate detailed analysis based on error type
    switch (errorType) {
      case 'network':
        analysis = {
          step: 'Network Connection',
          issue: status === 0 ? 'Failed to connect to server' : 'Request timeout or slow response',
          possibleCauses: [
            'Development server not running',
            'Wrong port number (should be 5001)',
            'Network connectivity issues',
            'MongoDB connection timeout',
            'Server overloaded'
          ],
          troubleshootingSteps: [
            '1. Check if dev server is running: npm run dev',
            '2. Verify server URL: http://localhost:5001',
            '3. Check browser console for CORS errors',
            '4. Test MongoDB connection in terminal',
            '5. Check server logs for connection errors'
          ],
          projectFiles: [
            'server/index.ts - Main server file',
            'server/mongodb-connection-manager.ts - DB connection',
            'package.json - Scripts and dependencies',
            '.env - Environment variables'
          ],
          configChecks: [
            'MONGODB_URI environment variable set',
            'Development server port (default 5001)',
            'MongoDB Atlas connection string',
            'Network firewall settings'
          ]
        };
        break;

      case 'id_mismatch':
        analysis = {
          step: 'Post ID Resolution',
          issue: `Post with ID "${postId}" not found in database`,
          possibleCauses: [
            'Post ID doesn\'t exist in MongoDB',
            'ID generation algorithm mismatch',
            'Post was deleted or never created',
            'Database collection is empty',
            'Wrong database being queried'
          ],
          troubleshootingSteps: [
            '1. Check if post exists: Open /admin page and verify post list',
            '2. Compare ID in URL with post IDs in admin panel',
            '3. Check MongoDB directly: Use MongoDB Compass or CLI',
            '4. Verify ID generation in api/admin/blog-posts.ts',
            '5. Check if you\'re on the right database (blog_database)'
          ],
          projectFiles: [
            'api/admin/blog-posts.ts - ID resolution logic',
            'server/mongodb-storage-updated.ts - Database queries',
            'api/blog-post.ts - mapPostDocument function',
            'shared/schema.ts - Data types'
          ],
          configChecks: [
            'MongoDB collection "posts" exists',
            'Posts have consistent ID fields',
            'Database name matches MONGODB_DATABASE env var',
            'ID generation algorithm consistency'
          ]
        };
        break;

      case 'database':
        analysis = {
          step: 'Database Query Execution',
          issue: 'MongoDB query failed or database error',
          possibleCauses: [
            'MongoDB connection lost',
            'Database authentication failed',
            'Collection doesn\'t exist',
            'Query syntax error',
            'Database server down'
          ],
          troubleshootingSteps: [
            '1. Check MongoDB connection: Look for "Connected to MongoDB" in server logs',
            '2. Verify database credentials in .env file',
            '3. Test MongoDB Atlas connection',
            '4. Check database name: should be "blog_database"',
            '5. Verify collection "posts" exists'
          ],
          projectFiles: [
            'server/mongodb-connection-manager.ts - Connection logic',
            '.env - Database credentials',
            'server/mongodb-storage-updated.ts - Query implementation',
            'api/admin/blog-posts.ts - API endpoint'
          ],
          configChecks: [
            'MONGODB_URI format and credentials',
            'Database name: blog_database',
            'Collection name: posts',
            'Network access in MongoDB Atlas'
          ]
        };
        break;

      case 'permission':
        analysis = {
          step: 'API Permission Check',
          issue: 'Access denied or authentication failed',
          possibleCauses: [
            'Missing authentication headers',
            'Invalid API endpoint',
            'CORS policy blocking request',
            'Admin privileges required',
            'Session expired'
          ],
          troubleshootingSteps: [
            '1. Check if you\'re logged in as admin',
            '2. Verify API endpoint format: /api/admin/blog-posts?id=...',
            '3. Check browser network tab for request details',
            '4. Clear browser cache and cookies',
            '5. Check server CORS configuration'
          ],
          projectFiles: [
            'api/admin/blog-posts.ts - Admin endpoint',
            'server/auth.ts - Authentication logic',
            'client/src/hooks/useAuth.ts - Client auth',
            'server/routes.ts - Route definitions'
          ],
          configChecks: [
            'Admin authentication status',
            'API endpoint URL format',
            'CORS headers configuration',
            'Session management'
          ]
        };
        break;

      default:
        analysis = {
          step: 'Unknown Error',
          issue: 'Unexpected error occurred',
          possibleCauses: [
            'JavaScript runtime error',
            'Unexpected server response',
            'Data parsing error',
            'Browser compatibility issue'
          ],
          troubleshootingSteps: [
            '1. Check browser console for detailed errors',
            '2. Check server logs for error messages',
            '3. Try refreshing the page',
            '4. Test in different browser',
            '5. Check network tab for response details'
          ],
          projectFiles: [
            'client/src/pages/create-post.tsx - Frontend logic',
            'api/admin/blog-posts.ts - Backend logic',
            'client/src/lib/queryClient.ts - API client'
          ],
          configChecks: [
            'Browser JavaScript enabled',
            'No ad blockers interfering',
            'Valid JSON response format'
          ]
        };
    }

    const diagnostics: PostFetchDiagnostics = {
      postId,
      urlFormat: url,
      endpointUsed: method === 'GET' ? 'Fetch Post' : 'Update Post',
      httpStatus: status,
      errorType,
      failureStep,
      detailedAnalysis: analysis
    };

    // Store diagnostics for later reference
    this.postFetchDiagnostics.set(postId, diagnostics);

    return diagnostics;
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      const startTime = performance.now();
      const method = options.method || 'GET';
      
      let urlString = url.toString();
      let isPostRelated = false;
      let postId: string | null = null;
      let dbOperation = '';

      // Detect API route mismatches BEFORE making the call
      if (urlString.includes('/api/admin/posts') && !urlString.includes('/api/admin/blog-posts')) {
        console.error(`🚨 API ROUTE MISMATCH DETECTED!`);
        console.error(`   ❌ Called: ${urlString}`);
        console.error(`   ✅ Should be: ${urlString.replace('/api/admin/posts', '/api/admin/blog-posts')}`);
        console.error(`   🔧 Fix: Update frontend to use /api/admin/blog-posts`);
        console.error(`   📍 Method: ${method}`);
        console.error(`   📁 Check: client/src/pages/create-post.tsx or admin-working.tsx`);
        
        // Track this as a specific debug event
        this.trackEvent('api_route_mismatch', {
          incorrectUrl: urlString,
          correctUrl: urlString.replace('/api/admin/posts', '/api/admin/blog-posts'),
          method: method,
          fix: 'Update frontend to use /api/admin/blog-posts',
          files: ['client/src/pages/create-post.tsx', 'client/src/pages/admin-working.tsx']
        });
      }

      // Detect post-related API calls
      if (urlString.includes('/api/admin/blog-posts') || urlString.includes('/api/blog-post') || urlString.includes('/api/admin/posts')) {
        isPostRelated = true;
        
        // Extract post ID from various URL formats
        const idMatch = urlString.match(/[?&]id=([^&]+)/);
        const pathIdMatch = urlString.match(/\/blog-posts\/([^/?]+)/);
        const slugMatch = urlString.match(/[?&]slug=([^&]+)/);
        
        postId = idMatch?.[1] || pathIdMatch?.[1] || slugMatch?.[1] || this.currentPostId;
        
        // Determine database operation
        if (method === 'GET' && urlString.includes('/api/admin/blog-posts')) {
          dbOperation = 'fetch_post_for_editing';
          this.postFetchAttempts++;
        } else if (method === 'PATCH' && urlString.includes('/api/admin/blog-posts')) {
          dbOperation = 'update_post';
          this.postUpdateAttempts++;
        } else if (method === 'GET' && urlString.includes('/api/blog-post')) {
          dbOperation = 'fetch_post_public';
        }
      }

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Clone response to read body without consuming it
        const responseClone = response.clone();
        let responseData: any = null;
        let postData: any = null;
        let diagnostics: PostFetchDiagnostics | null = null;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await responseClone.json();
            
            // Extract post-specific data
            if (isPostRelated && responseData) {
              postData = {
                id: responseData.id || postId,
                title: responseData.title,
                status: response.ok ? 'success' : 'error',
                fetchSuccess: response.ok,
                dbOperation,
                contentLength: responseData.content?.length || 0,
                tags: responseData.tags || [],
                isPublished: responseData.isPublished,
                lastModified: responseData.updatedAt || responseData.lastModified
              };
            }
          }
        } catch (jsonError) {
          // Response wasn't JSON, that's okay
        }

        // Generate diagnostics for failed post operations
        if (isPostRelated && !response.ok && postId) {
          diagnostics = this.analyzePostFetchFailure(
            postId,
            urlString,
            method,
            response.status,
            `HTTP ${response.status}: ${response.statusText}`,
            responseTime
          );
        }

        if (isPostRelated) {
          this.trackEvent('db_interaction', {
            action: dbOperation,
            url: urlString,
            method,
            status: response.status,
            success: response.ok,
            responseTime,
            postId,
            attempt: method === 'GET' ? this.postFetchAttempts : this.postUpdateAttempts,
            responseData: response.ok ? responseData : null,
            error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
            diagnostics: diagnostics || null
          }, {
            performance: { apiResponseTime: responseTime },
            post: postData || {
              id: postId || undefined,
              status: response.ok ? 'success' : 'error',
              fetchSuccess: response.ok,
              dbOperation,
              error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
            }
          });
        } else {
          this.trackEvent('api_call', {
            action: 'fetch_complete',
            url: urlString,
            method,
            status: response.status,
            success: response.ok,
            responseTime
          }, {
            performance: { apiResponseTime: responseTime }
          });
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        let diagnostics: PostFetchDiagnostics | null = null;

        // Generate diagnostics for network errors
        if (isPostRelated && postId) {
          diagnostics = this.analyzePostFetchFailure(
            postId,
            urlString,
            method,
            0, // Network error
            error instanceof Error ? error.message : 'Network error',
            responseTime
          );
        }
        
        if (isPostRelated) {
          this.trackEvent('db_interaction', {
            action: dbOperation,
            url: urlString,
            method,
            status: 0,
            success: false,
            responseTime,
            postId,
            attempt: method === 'GET' ? this.postFetchAttempts : this.postUpdateAttempts,
            error: error instanceof Error ? error.message : 'Network error',
            diagnostics: diagnostics || null
          }, {
            performance: { apiResponseTime: responseTime },
            post: {
              id: postId || undefined,
              status: 'error',
              fetchSuccess: false,
              dbOperation,
              error: error instanceof Error ? error.message : 'Network error'
            }
          });
        } else {
          this.trackEvent('api_call', {
            action: 'fetch_error',
            url: urlString,
            method,
            status: 0,
            success: false,
            responseTime,
            error: error instanceof Error ? error.message : 'Network error'
          }, {
            performance: { apiResponseTime: responseTime }
          });
        }
        
        throw error;
      }
    };
  }

  private interceptConsole() {
    // Safe serialization function to prevent circular reference errors
    const safeStringify = (obj: any): string => {
      try {
        if (obj === null || obj === undefined) {
          return String(obj);
        }
        if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
          return String(obj);
        }
        if (typeof obj === 'function') {
          return '[Function]';
        }
        if (obj instanceof Error) {
          return `Error: ${obj.message}`;
        }
        // For objects, use a safe stringify with circular reference handling
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'function') {
            return '[Function]';
          }
          if (value instanceof Error) {
            return `Error: ${value.message}`;
          }
          if (typeof value === 'object' && value !== null) {
            // Simple circular reference check
            if (value.constructor && value.constructor.name === 'Object') {
              return value;
            }
            return '[Object]';
          }
          return value;
        });
      } catch (error) {
        return '[Unserializable Object]';
      }
    };

    // Intercept console.log
    console.log = (...args: any[]) => {
      try {
        this.trackEvent('console_log', {
          message: args.map(arg => safeStringify(arg)).join(' '),
          args: args.map(arg => safeStringify(arg)),
          location: this.getStackTrace()
        });
      } catch (error) {
        // If tracking fails, don't crash - just continue
      }
      this.originalConsole.log(...args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      try {
        this.trackEvent('console_warn', {
          message: args.map(arg => safeStringify(arg)).join(' '),
          args: args.map(arg => safeStringify(arg)),
          location: this.getStackTrace()
        });
      } catch (error) {
        // If tracking fails, don't crash - just continue
      }
      this.originalConsole.warn(...args);
    };

    // Intercept console.error
    console.error = (...args: any[]) => {
      try {
        this.trackEvent('console_error', {
          message: args.map(arg => safeStringify(arg)).join(' '),
          args: args.map(arg => safeStringify(arg)),
          location: this.getStackTrace()
        });
      } catch (error) {
        // If tracking fails, don't crash - just continue
      }
      this.originalConsole.error(...args);
    };

    // Intercept console.info
    console.info = (...args: any[]) => {
      try {
        this.trackEvent('console_info', {
          message: args.map(arg => safeStringify(arg)).join(' '),
          args: args.map(arg => safeStringify(arg)),
          location: this.getStackTrace()
        });
      } catch (error) {
        // If tracking fails, don't crash - just continue
      }
      this.originalConsole.info(...args);
    };
  }

  private getStackTrace(): string {
    try {
      throw new Error();
    } catch (e) {
      try {
        const stack = (e as Error).stack?.split('\n') || [];
        // Return relevant stack trace (skip first 3 lines which are this function and console override)
        return stack.slice(3, 6).join('\n');
      } catch (error) {
        return 'Stack trace unavailable';
      }
    }
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    let selector = element.tagName.toLowerCase();
    
    if (element.className) {
      selector += '.' + element.className.split(' ').join('.');
    }
    
    // Add position if needed for uniqueness
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => 
        child.tagName === element.tagName && child.className === element.className
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(element);
        selector += `:nth-child(${index + 1})`;
      }
    }
    
    return selector;
  }

  private getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  public trackEvent(type: DebugEvent['type'], data: any, metadata?: DebugEvent['metadata']) {
    if (!this.isEnabled) return;

    try {
      const event: DebugEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type,
        data,
        metadata
      };

      this.session.events.push(event);
      this.eventBuffer.push(event);

      // Prevent memory issues
      if (this.session.events.length > this.maxEvents) {
        this.session.events = this.session.events.slice(-this.maxEvents * 0.8);
      }

      // Use original console to avoid infinite loop when tracking console events
      if (type.startsWith('console_')) {
        // Don't log console events to avoid infinite recursion
        return;
      }
      
      // Console log for immediate debugging (using original console)
      this.originalConsole.log(`🔍 [${event.type.toUpperCase()}]`, event.metadata?.element?.selector || event.data.action, event.data);
    } catch (error) {
      // If tracking fails, use original console to log error but don't crash
      this.originalConsole.error('Debug tracker error:', error);
    }
  }

  // Public methods for manual tracking
  public trackCustomEvent(type: string, data: any) {
    this.trackEvent('navigation', {
      action: 'custom_event',
      customType: type,
      ...data
    });
  }

  public trackPageView(page: string) {
    this.trackEvent('navigation', {
      action: 'page_view',
      page: page,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    });
  }

  public getSession(): DebugSession {
    return { ...this.session };
  }

  public getRecentEvents(count: number = 50): DebugEvent[] {
    return this.session.events.slice(-count);
  }

  public getEventsByType(type: DebugEvent['type']): DebugEvent[] {
    return this.session.events.filter(event => event.type === type);
  }

  public getConsoleEvents(): DebugEvent[] {
    return this.session.events.filter(event => 
      ['console_log', 'console_warn', 'console_error', 'console_info'].includes(event.type)
    );
  }

  public getConsoleEventsByLevel(level: 'log' | 'warn' | 'error' | 'info'): DebugEvent[] {
    return this.session.events.filter(event => event.type === `console_${level}`);
  }

  public exportSession(): string {
    return JSON.stringify(this.session, null, 2);
  }

  public getPerformanceMetrics() {
    const performanceEvents = this.getEventsByType('performance');
    const apiEvents = this.getEventsByType('api_call');
    const errorEvents = this.getEventsByType('error');
    const dbEvents = this.getEventsByType('db_interaction');

    return {
      totalEvents: this.session.events.length,
      performanceEvents: performanceEvents.length,
      apiCalls: apiEvents.filter(e => e.data.action === 'fetch_complete').length,
      dbInteractions: dbEvents.length,
      errors: errorEvents.length,
      averageApiResponseTime: this.calculateAverageApiTime([...apiEvents, ...dbEvents]),
      pageLoadTime: performanceEvents.find(e => e.data.action === 'page_load')?.metadata?.performance?.loadTime,
      sessionDuration: Date.now() - this.session.startTime
    };
  }

  private calculateAverageApiTime(apiEvents: DebugEvent[]): number {
    const completedCalls = apiEvents.filter(e => 
      (e.data.action === 'fetch_complete' || e.type === 'db_interaction') && 
      e.metadata?.performance?.apiResponseTime
    );
    if (completedCalls.length === 0) return 0;
    
    const total = completedCalls.reduce((sum, event) => 
      sum + (event.metadata?.performance?.apiResponseTime || 0), 0
    );
    return total / completedCalls.length;
  }

  public getPostSpecificEvents(): DebugEvent[] {
    if (!this.currentPostId) return [];
    
    return this.session.events.filter(event => 
      event.metadata?.post?.id === this.currentPostId ||
      event.data?.postId === this.currentPostId ||
      (event.type === 'db_interaction' && event.data?.postId === this.currentPostId)
    );
  }

  public getCurrentPostSummary() {
    if (!this.currentPostId) return null;
    
    const postEvents = this.getPostSpecificEvents();
    const fetchEvents = postEvents.filter(e => e.type === 'db_interaction' && e.data?.dbOperation?.includes('fetch'));
    const updateEvents = postEvents.filter(e => e.type === 'db_interaction' && e.data?.dbOperation === 'update_post');
    
    const lastSuccessfulFetch = fetchEvents.filter(e => e.data?.success).pop();
    const lastFetchAttempt = fetchEvents.pop();
    const lastUpdateAttempt = updateEvents.pop();
    
    // Get diagnostics for failed operations
    const diagnostics = this.postFetchDiagnostics.get(this.currentPostId);
    
    return {
      postId: this.currentPostId,
      fetchAttempts: fetchEvents.length,
      updateAttempts: updateEvents.length,
      lastFetch: lastFetchAttempt ? {
        success: lastFetchAttempt.data?.success,
        timestamp: lastFetchAttempt.timestamp,
        error: lastFetchAttempt.data?.error,
        responseTime: lastFetchAttempt.data?.responseTime,
        diagnostics: lastFetchAttempt.data?.diagnostics || null
      } : null,
      lastSuccessfulFetch: lastSuccessfulFetch ? {
        timestamp: lastSuccessfulFetch.timestamp,
        postData: {
          title: lastSuccessfulFetch.metadata?.post?.title,
          status: lastSuccessfulFetch.metadata?.post?.status,
          contentLength: lastSuccessfulFetch.data?.responseData?.content?.length,
          tags: lastSuccessfulFetch.data?.responseData?.tags,
          isPublished: lastSuccessfulFetch.data?.responseData?.isPublished
        }
      } : null,
      lastUpdate: lastUpdateAttempt ? {
        success: lastUpdateAttempt.data?.success,
        timestamp: lastUpdateAttempt.timestamp,
        error: lastUpdateAttempt.data?.error,
        responseTime: lastUpdateAttempt.data?.responseTime,
        diagnostics: lastUpdateAttempt.data?.diagnostics || null
      } : null,
      failureAnalysis: diagnostics || null
    };
  }

  public getDetailedTroubleshootingGuide(postId?: string): DatabaseFailureAnalysis | null {
    const targetPostId = postId || this.currentPostId;
    if (!targetPostId) return null;
    
    const diagnostics = this.postFetchDiagnostics.get(targetPostId);
    return diagnostics?.detailedAnalysis || null;
  }

  // Visual debugging methods
  public showDebugOverlay() {
    if (!this.isEnabled) return;
    
    const overlay = this.createDebugOverlay();
    document.body.appendChild(overlay);
  }

  private createDebugOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'debug-tracker-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 400px;
      max-height: 600px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      overflow-y: auto;
      border: 2px solid #00ff00;
    `;

    const recentEvents = this.getRecentEvents(10);
    const metrics = this.getPerformanceMetrics();
    const postSummary = this.getCurrentPostSummary();

    overlay.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #00ff00;">
        🔍 Debug Tracker - ${this.session.sessionId}
      </div>
      
      <div style="margin-bottom: 10px;">
        <strong>Session:</strong> ${Math.round(metrics.sessionDuration / 1000)}s<br>
        <strong>Events:</strong> ${metrics.totalEvents}<br>
        <strong>Errors:</strong> ${metrics.errors}<br>
        <strong>API Calls:</strong> ${metrics.apiCalls}<br>
        <strong>DB Interactions:</strong> ${metrics.dbInteractions}<br>
        <strong>Avg API Time:</strong> ${Math.round(metrics.averageApiResponseTime)}ms
      </div>

      ${postSummary ? `
        <div style="margin-bottom: 10px; border: 1px solid #ff6600; padding: 8px; border-radius: 4px;">
          <strong style="color: #ff6600;">📝 Current Post: ${postSummary.postId}</strong><br>
          <strong>Fetch Attempts:</strong> ${postSummary.fetchAttempts}<br>
          <strong>Update Attempts:</strong> ${postSummary.updateAttempts}<br>
          ${postSummary.lastSuccessfulFetch ? `
            <strong>Last Successful Fetch:</strong><br>
            - Title: ${postSummary.lastSuccessfulFetch.postData?.title || 'N/A'}<br>
            - Published: ${postSummary.lastSuccessfulFetch.postData?.isPublished ? 'Yes' : 'No'}<br>
            - Content Length: ${postSummary.lastSuccessfulFetch.postData?.contentLength || 0} chars<br>
            - Tags: ${postSummary.lastSuccessfulFetch.postData?.tags?.length || 0}<br>
          ` : '<strong style="color: #ff0000;">No successful fetch yet</strong><br>'}
          ${postSummary.lastFetch && !postSummary.lastFetch.success ? `
            <strong style="color: #ff0000;">Last Fetch Error:</strong> ${postSummary.lastFetch.error}<br>
          ` : ''}
        </div>
      ` : ''}
      
      <div style="margin-bottom: 10px;">
        <strong>Recent Events:</strong>
      </div>
      
      <div style="max-height: 300px; overflow-y: auto;">
        ${recentEvents.map(event => `
          <div style="margin-bottom: 5px; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; border-left: 3px solid ${this.getEventColor(event.type)};">
            <span style="color: ${this.getEventColor(event.type)}; font-weight: bold;">${event.type.toUpperCase()}</span>
            ${event.type === 'db_interaction' ? `
              <span style="color: #ff6600;">[${event.data.dbOperation}]</span>
            ` : ''}
            <br>
            ${event.data.action || event.data.url || 'Unknown'}
            ${event.data.success !== undefined ? `
              <span style="color: ${event.data.success ? '#00ff00' : '#ff0000'};">
                ${event.data.success ? '✓' : '✗'}
              </span>
            ` : ''}
            ${event.data.responseTime ? `<br><small>${Math.round(event.data.responseTime)}ms</small>` : ''}
          </div>
        `).join('')}
      </div>
      
      <div style="margin-top: 10px; text-align: center;">
        <button onclick="document.getElementById('debug-tracker-overlay').remove()" 
                style="background: #ff0000; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
          Close
        </button>
        <button onclick="console.log('Debug Session:', debugTracker.exportSession())" 
                style="background: #0066ff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-left: 5px;">
          Export
        </button>
      </div>
    `;

    return overlay;
  }

  private getEventColor(type: DebugEvent['type']): string {
    const colors = {
      click: '#00ff00',
      navigation: '#0066ff',
      api_call: '#ff6600',
      db_interaction: '#ff6600',
      error: '#ff0000',
      performance: '#ffff00',
      form_submit: '#00ffff',
      input_change: '#ff00ff',
      post_fetch: '#ff6600',
      post_update: '#ff6600',
      console_log: '#888888',
      console_warn: '#ffaa00',
      console_error: '#ff0000',
      console_info: '#0088ff',
      api_route_mismatch: '#ff4444'
    };
    return colors[type] || '#ffffff';
  }

  public start() {
    // Already started in constructor for development mode
    console.log('🔍 Debug Tracker is running');
  }

  public stop() {
    this.isEnabled = false;
    this.restoreConsole();
    this.originalConsole.log('🔍 Debug Tracker stopped');
  }

  private restoreConsole() {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
  }

  public clear() {
    this.session.events = [];
    this.eventBuffer = [];
    console.log('🔍 Debug Tracker cleared');
  }
}

// Create lazy instance
let _debugTracker: DebugTracker | null = null;

export const debugTracker = {
  get instance() {
    if (!_debugTracker) {
      _debugTracker = new DebugTracker();
    }
    return _debugTracker;
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugTracker = debugTracker.instance;
} 