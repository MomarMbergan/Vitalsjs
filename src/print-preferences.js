// ============================================================================
// PRINT PREFERENCES MANAGER - Agent Chat Integration
// ============================================================================
// Manages user printing preferences and triggers agent communication
// Loads on page refresh and displays chat interface for Copilot agent
// ============================================================================

const PrintPreferencesManager = {
  
  // Configuration
  config: {
    agentCheckInterval: 1000, // Check for agent URL every 1 second
    maxWaitTime: 5000, // Wait max 5 seconds for agent initialization
    chatWidgetId: 'agent-chat-widget',
    storageKey: 'biometric_print_prefs'
  },

  // Print preferences state
  preferences: {
    includeEquations: true,
    includeMetrics: true,
    includeCharts: true,
    includePDFReport: true,
    selectedEquations: [],
    reportFormat: 'pdf', // pdf, json, csv
    timestamp: null
  },

  // Agent communication data
  agentData: {
    equations: null,
    currentMetrics: null,
    printOptions: null
  },

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  init() {
    console.log('[PrintPreferencesManager] Initializing...');
    
    // Load saved preferences
    this.loadPreferences();
    
    // Create chat widget
    this.createChatWidget();
    
    // Load equation registry
    this.loadEquationRegistry();
    
    // Setup agent communication
    this.setupAgentCommunication();
    
    // Listen for print triggers
    this.setupPrintListeners();
    
    console.log('[PrintPreferencesManager] Initialized successfully');
  },

  // ============================================================================
  // EQUATION REGISTRY LOADING
  // ============================================================================

  loadEquationRegistry() {
    if (typeof EquationRegistry !== 'undefined') {
      this.agentData.equations = EquationRegistry.toJSON();
      console.log('[PrintPreferencesManager] Loaded', this.agentData.equations.totalEquations, 'equations');
      return true;
    } else {
      console.warn('[PrintPreferencesManager] EquationRegistry not found');
      return false;
    }
  },

  // ============================================================================
  // CHAT WIDGET
  // ============================================================================

  createChatWidget() {
    // Check if widget already exists
    if (document.getElementById(this.config.chatWidgetId)) {
      return;
    }

    const widget = document.createElement('div');
    widget.id = this.config.chatWidgetId;
    widget.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 400px;
        max-height: 500px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #0099ff;
        border-radius: 12px;
        box-shadow: 0 0 20px rgba(0, 153, 255, 0.3);
        z-index: 9998;
        font-family: 'Courier New', monospace;
        display: none;
      " id="agent-widget-container">
        
        <!-- Header -->
        <div style="
          background: linear-gradient(90deg, #0099ff, #00ccff);
          padding: 15px;
          border-radius: 10px 10px 0 0;
          color: white;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span>🤖 Biometric Agent</span>
          <button id="agent-widget-close" style="
            background: transparent;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
          ">×</button>
        </div>

        <!-- Content -->
        <div style="
          padding: 15px;
          overflow-y: auto;
          max-height: 380px;
          color: #00ff00;
          font-size: 12px;
          line-height: 1.6;
        " id="agent-widget-content">
          <p>⏳ Initializing agent communication...</p>
        </div>

        <!-- Print Options -->
        <div style="
          padding: 12px;
          border-top: 1px solid #0099ff;
          display: none;
        " id="agent-print-options">
          <p style="margin: 0 0 10px 0; font-weight: bold;">Print Preferences:</p>
          
          <label style="display: block; margin: 8px 0; cursor: pointer;">
            <input type="checkbox" id="pref-equations" checked> Include Equations
          </label>
          
          <label style="display: block; margin: 8px 0; cursor: pointer;">
            <input type="checkbox" id="pref-metrics" checked> Include Live Metrics
          </label>
          
          <label style="display: block; margin: 8px 0; cursor: pointer;">
            <input type="checkbox" id="pref-charts" checked> Include Charts
          </label>

          <div style="margin-top: 10px; display: flex; gap: 5px;">
            <button id="agent-print-btn" style="
              flex: 1;
              padding: 8px;
              background: #00ff00;
              color: black;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: bold;
            ">Print Report</button>
            
            <button id="agent-export-json" style="
              flex: 1;
              padding: 8px;
              background: #0099ff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: bold;
            ">Export JSON</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
    
    // Setup event listeners
    document.getElementById('agent-widget-close').addEventListener('click', () => {
      this.toggleWidget(false);
    });

    document.getElementById('agent-print-btn').addEventListener('click', () => {
      this.handlePrintReport();
    });

    document.getElementById('agent-export-json').addEventListener('click', () => {
      this.handleExportJSON();
    });

    // Setup preference checkboxes
    ['equations', 'metrics', 'charts'].forEach(pref => {
      const el = document.getElementById(`pref-${pref}`);
      if (el) {
        el.addEventListener('change', (e) => {
          this.preferences[`include${pref.charAt(0).toUpperCase() + pref.slice(1)}`] = e.target.checked;
          this.savePreferences();
        });
      }
    });
  },

  toggleWidget(show) {
    const container = document.getElementById('agent-widget-container');
    if (container) {
      container.style.display = show ? 'block' : 'none';
    }
  },

  // ============================================================================
  // AGENT COMMUNICATION
  // ============================================================================

  setupAgentCommunication() {
    const self = this;
    
    // Wait for page to fully load
    window.addEventListener('load', () => {
      setTimeout(() => {
        self.initializeAgentConnection();
      }, 1000);
    });

    // Also try on DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          self.initializeAgentConnection();
        }, 500);
      });
    } else {
      setTimeout(() => {
        self.initializeAgentConnection();
      }, 500);
    }
  },

  initializeAgentConnection() {
    console.log('[PrintPreferencesManager] Initializing agent connection...');
    
    const content = document.getElementById('agent-widget-content');
    if (!content) return;

    // Check if agent parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const agentMode = urlParams.get('agent');

    if (agentMode === 'print') {
      this.setupAgentPrintMode();
    } else {
      this.setupStandardMode();
    }

    // Gather current metrics
    this.captureCurrentMetrics();
  },

  setupAgentPrintMode() {
    console.log('[PrintPreferencesManager] Operating in AGENT PRINT MODE');
    
    const content = document.getElementById('agent-widget-content');
    const options = document.getElementById('agent-print-options');

    content.innerHTML = `
      <p style="color: #00ff00; font-weight: bold;">🚀 AGENT MODE ACTIVE</p>
      <p>Diagnostic equations ready for processing</p>
      <p style="color: #ffff00;">Total equations: ${this.agentData.equations ? this.agentData.equations.totalEquations : 'N/A'}</p>
      <p style="color: #00ccff; margin-top: 10px;">Ready for print/export requests</p>
    `;

    if (options) options.style.display = 'block';
    this.toggleWidget(true);
  },

  setupStandardMode() {
    console.log('[PrintPreferencesManager] Operating in STANDARD MODE');
    
    const content = document.getElementById('agent-widget-content');
    const options = document.getElementById('agent-print-options');

    if (this.agentData.equations) {
      content.innerHTML = `
        <p style="color: #00ff00; font-weight: bold;">✓ System Ready</p>
        <p>Equations: <span style="color: #ffff00;">${this.agentData.equations.totalEquations}</span></p>
        <p>Categories: <span style="color: #00ccff;">${this.agentData.equations.categories.length}</span></p>
        <p style="margin-top: 10px; font-size: 11px;">Configure print options below</p>
      `;
    } else {
      content.innerHTML = '<p style="color: #ff9900;">⚠ Initializing equations...</p>';
    }

    if (options) options.style.display = 'block';
    this.toggleWidget(true);
  },

  // ============================================================================
  // METRICS CAPTURE
  // ============================================================================

  captureCurrentMetrics() {
    // Capture live metrics from dashboard
    const metrics = {
      heartRate: document.getElementById('hrValue')?.textContent || '--',
      eegAlpha: document.getElementById('eegAlpha')?.textContent || '--',
      eegBeta: document.getElementById('eegBeta')?.textContent || '--',
      fusionScore: document.getElementById('fusionScore')?.textContent || '--',
      cpuUsage: document.getElementById('cpuUsage')?.textContent || '--',
      gpuUsage: document.getElementById('gpuUsage')?.textContent || '--',
      temperature: document.getElementById('tempValue')?.textContent || '--',
      scanTime: document.getElementById('scanTime')?.textContent || '--',
      timestamp: new Date().toISOString()
    };

    this.agentData.currentMetrics = metrics;
    console.log('[PrintPreferencesManager] Metrics captured:', metrics);
  },

  // ============================================================================
  // PRINT LISTENERS
  // ============================================================================

  setupPrintListeners() {
    // Listen for print button clicks
    const printBtn = document.getElementById('export100');
    const asciiBtn = document.getElementById('showascii');
    const snapshotBtn = document.getElementById('snapshot');

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.onPrintTriggered('export100');
      });
    }

    if (asciiBtn) {
      asciiBtn.addEventListener('click', () => {
        this.onPrintTriggered('showascii');
      });
    }

    if (snapshotBtn) {
      snapshotBtn.addEventListener('click', () => {
        this.onPrintTriggered('snapshot');
      });
    }
  },

  onPrintTriggered(trigger) {
    console.log('[PrintPreferencesManager] Print triggered:', trigger);
    this.captureCurrentMetrics();
    this.notifyAgent(trigger);
  },

  // ============================================================================
  // PRINT HANDLERS
  // ============================================================================

  handlePrintReport() {
    console.log('[PrintPreferencesManager] Generating print report...');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      preferences: this.preferences,
      metrics: this.agentData.currentMetrics,
      equations: this.preferences.includeEquations ? this.agentData.equations : null,
      reportType: 'biometric-analysis'
    };

    console.log('Report Data:', reportData);
    this.showNotification('Report generated. Check console for details.');
  },

  handleExportJSON() {
    console.log('[PrintPreferencesManager] Exporting JSON...');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      system: 'Biometric Network - Vitalsjs',
      preferences: this.preferences,
      currentMetrics: this.agentData.currentMetrics,
      equationRegistry: this.agentData.equations,
      exportedAt: new Date().toLocaleString()
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biometric_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification('JSON exported successfully');
  },

  // ============================================================================
  // PREFERENCES MANAGEMENT
  // ============================================================================

  savePreferences() {
    this.preferences.timestamp = new Date().toISOString();
    localStorage.setItem(this.config.storageKey, JSON.stringify(this.preferences));
    console.log('[PrintPreferencesManager] Preferences saved');
  },

  loadPreferences() {
    const saved = localStorage.getItem(this.config.storageKey);
    if (saved) {
      this.preferences = JSON.parse(saved);
      console.log('[PrintPreferencesManager] Preferences loaded');
    }
  },

  // ============================================================================
  // AGENT NOTIFICATION
  // ============================================================================

  notifyAgent(action) {
    // Create notification for agent
    const notification = {
      type: 'print_action',
      action: action,
      timestamp: new Date().toISOString(),
      data: {
        metrics: this.agentData.currentMetrics,
        preferences: this.preferences,
        equations: this.agentData.equations
      }
    };

    console.log('[Agent Notification]', notification);

    // Store for agent to read
    sessionStorage.setItem('biometric_agent_notification', JSON.stringify(notification));

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('biometric-agent-notify', { detail: notification }));
  },

  // ============================================================================
  // UTILITIES
  // ============================================================================

  showNotification(message) {
    const content = document.getElementById('agent-widget-content');
    if (content) {
      const time = new Date().toLocaleTimeString();
      content.innerHTML += `<p style="color: #00ff00;">[${time}] ${message}</p>`;
      content.scrollTop = content.scrollHeight;
    }
  },

  // Get formatted data for agent
  getAgentData() {
    return {
      equations: this.agentData.equations,
      metrics: this.agentData.currentMetrics,
      preferences: this.preferences,
      readyForProcessing: !!this.agentData.equations
    };
  }
};

// ============================================================================
// INITIALIZATION ON PAGE LOAD
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PrintPreferencesManager.init();
  });
} else {
  PrintPreferencesManager.init();
}

// Expose globally for agent access
window.BiometricAgent = {
  getPreferences: () => PrintPreferencesManager.preferences,
  getEquations: () => PrintPreferencesManager.agentData.equations,
  getMetrics: () => PrintPreferencesManager.agentData.currentMetrics,
  setPreferences: (prefs) => {
    PrintPreferencesManager.preferences = { ...PrintPreferencesManager.preferences, ...prefs };
    PrintPreferencesManager.savePreferences();
  },
  triggerPrint: (type) => PrintPreferencesManager.handlePrintReport(),
  triggerExport: (type) => PrintPreferencesManager.handleExportJSON()
};

console.log('[PrintPreferencesManager] Loaded and ready for agent communication');
console.log('Access via: window.BiometricAgent');
