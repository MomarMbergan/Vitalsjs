// ============================================================================
// EQUATION REGISTRY - Diagnostic Equations for Agent Processing
// ============================================================================
// This module provides machine-readable access to all diagnostic equations
// Triggered on page load and accessible via chat interface
// ============================================================================

const EquationRegistry = {
  // Core diagnostic equations from the biometric network
  diagnosticEquations: [
    {
      id: 'ldl-cholesterol',
      name: 'LDL Cholesterol',
      category: 'Cardiology',
      description: 'Calculates Low Density Lipoprotein Cholesterol from total cholesterol, triglycerides, and HDL',
      formula: 'chol - ((TG/5) + HDL)',
      latex: 'LDL = C - \\left( \\frac{TG}{5} + HDL \\right)',
      ascii: 'chol - ((TG/5) + HDL)',
      variables: [
        { name: 'chol', description: 'Total Cholesterol (mg/dL)', unit: 'mg/dL', type: 'input' },
        { name: 'TG', description: 'Triglycerides (mg/dL)', unit: 'mg/dL', type: 'input' },
        { name: 'HDL', description: 'High Density Lipoprotein (mg/dL)', unit: 'mg/dL', type: 'input' }
      ],
      clinicalRelevance: 'Lower LDL is better for cardiovascular health. Target: <100 mg/dL',
      references: 'Friedewald-Fredrickson formula'
    },
    {
      id: 'cardiovascular-fusion',
      name: 'Cardiovascular Fusion Index',
      category: 'Cardiology',
      description: 'Combines heart rate and fusion score for comprehensive cardiac assessment',
      formula: 'HR × Fusion / 100',
      latex: 'CFI = \\frac{HR \\times Fusion}{100}',
      ascii: 'HR * Fusion / 100',
      variables: [
        { name: 'HR', description: 'Heart Rate (bpm)', unit: 'bpm', type: 'input', range: '60-120' },
        { name: 'Fusion', description: 'Biometric Fusion Score (%)', unit: '%', type: 'input', range: '0-100' }
      ],
      clinicalRelevance: 'Integrated measure of cardiac performance',
      normalRange: '50-100'
    },
    {
      id: 'neural-frequency',
      name: 'Neural Frequency Sum',
      category: 'Neurology/EEG',
      description: 'Combines alpha and beta EEG frequencies for neural activity assessment',
      formula: 'α (Hz) + β (Hz)',
      latex: '\\alpha (Hz) + \\beta (Hz)',
      ascii: 'alpha + beta',
      variables: [
        { name: 'alpha', description: 'EEG Alpha Wave Frequency (Hz)', unit: 'Hz', type: 'input', range: '8-12' },
        { name: 'beta', description: 'EEG Beta Wave Frequency (Hz)', unit: 'Hz', type: 'input', range: '12-30' }
      ],
      clinicalRelevance: 'Higher values indicate increased neural activity and alertness',
      eegBandDefinitions: {
        delta: '0.5-4 Hz (sleep, unconsciousness)',
        theta: '4-8 Hz (drowsiness)',
        alpha: '8-12 Hz (relaxation)',
        beta: '12-30 Hz (active thinking)',
        gamma: '30-100 Hz (cognition)'
      }
    },
    {
      id: 'system-load',
      name: 'System Load Index',
      category: 'System Metrics',
      description: 'Calculates average CPU and GPU utilization',
      formula: '(CPU + GPU) / 2',
      latex: 'Load = \\frac{CPU + GPU}{2}',
      ascii: '(CPU + GPU) / 2',
      variables: [
        { name: 'CPU', description: 'CPU Usage (%)', unit: '%', type: 'input', range: '0-100' },
        { name: 'GPU', description: 'GPU Usage (%)', unit: '%', type: 'input', range: '0-100' }
      ],
      clinicalRelevance: 'Indicates system computational burden during biometric processing',
      normalRange: '0-80%'
    },
    {
      id: 'thermal-index',
      name: 'Thermal Index',
      category: 'System Metrics',
      description: 'Calculates deviation from normal body temperature scaled by 0.5',
      formula: '(T - 37) × 0.5',
      latex: 'TI = (T - 37) \\times 0.5',
      ascii: '(T - 37) * 0.5',
      variables: [
        { name: 'T', description: 'Temperature (°C)', unit: '°C', type: 'input', range: '35-45' }
      ],
      clinicalRelevance: 'Measures thermal deviation from normal human body temperature (37°C)',
      criticalThreshold: '> 3°C deviation'
    },
    {
      id: 'biometric-index',
      name: 'Biometric Composite Index',
      category: 'Integrated Analysis',
      description: 'Multi-dimensional biometric assessment combining cardiac, neural, and thermal metrics',
      formula: '√(HR² + (EEG)² + Fusion²)',
      latex: 'BCI = \\sqrt{HR^2 + (EEG)^2 + Fusion^2}',
      ascii: 'sqrt(HR^2 + EEG^2 + Fusion^2)',
      variables: [
        { name: 'HR', description: 'Heart Rate (bpm)', unit: 'bpm', type: 'input' },
        { name: 'EEG', description: 'EEG Frequency Sum (Hz)', unit: 'Hz', type: 'input' },
        { name: 'Fusion', description: 'Fusion Score (%)', unit: '%', type: 'input' }
      ],
      clinicalRelevance: 'Comprehensive health status indicator using multiple biometric dimensions',
      scalingNote: 'Normalized for comparison across different measurement scales'
    },
    {
      id: 'hemodynamic-flow',
      name: 'Hemodynamic Flow Rate',
      category: 'Hemodynamics',
      description: 'Calculates blood flow based on pressure difference and vessel resistance',
      formula: 'Q = ΔP / R',
      latex: 'Q = \\frac{\\Delta P}{R}',
      ascii: 'Flow = DeltaP / Resistance',
      variables: [
        { name: 'DeltaP', description: 'Pressure Difference (mmHg)', unit: 'mmHg', type: 'input' },
        { name: 'R', description: 'Vascular Resistance (mmHg·s/mL)', unit: 'mmHg·s/mL', type: 'input' }
      ],
      clinicalRelevance: 'Fundamental cardiovascular equation based on Ohm\'s law of circulation',
      references: 'Poiseuille\'s Equation'
    },
    {
      id: 'mean-arterial-pressure',
      name: 'Mean Arterial Pressure',
      category: 'Cardiology',
      description: 'Calculates mean pressure throughout cardiac cycle',
      formula: 'MAP = DBP + (SBP - DBP) / 3',
      latex: 'MAP = DBP + \\frac{SBP - DBP}{3}',
      ascii: 'MAP = DBP + (SBP - DBP) / 3',
      variables: [
        { name: 'SBP', description: 'Systolic Blood Pressure (mmHg)', unit: 'mmHg', type: 'input', range: '90-130' },
        { name: 'DBP', description: 'Diastolic Blood Pressure (mmHg)', unit: 'mmHg', type: 'input', range: '60-85' }
      ],
      clinicalRelevance: 'Primary indicator of overall perfusion pressure',
      normalRange: '70-100 mmHg'
    },
    {
      id: 'cardiac-output',
      name: 'Cardiac Output',
      category: 'Cardiology',
      description: 'Volume of blood pumped by heart per minute',
      formula: 'CO = HR × SV',
      latex: 'CO = HR \\times SV',
      ascii: 'CO = HR * SV',
      variables: [
        { name: 'HR', description: 'Heart Rate (bpm)', unit: 'bpm', type: 'input' },
        { name: 'SV', description: 'Stroke Volume (mL)', unit: 'mL', type: 'input', range: '60-130' }
      ],
      clinicalRelevance: 'Essential measure of cardiac performance and tissue perfusion',
      normalRange: '4-8 L/min'
    },
    {
      id: 'ppg-signal',
      name: 'Photoplethysmography (PPG) Signal',
      category: 'Signal Processing',
      description: 'AC/DC signal extraction from optical heart rate measurement',
      formula: 'AC = Detrend(Signal), DC = Mean(Signal)',
      latex: 'AC = Detrend(S), DC = Mean(S)',
      ascii: 'AC = detrend(signal), DC = mean(signal)',
      variables: [
        { name: 'Signal', description: 'Raw PPG Optical Signal', unit: 'normalized 0-1', type: 'input' }
      ],
      clinicalRelevance: 'Foundation for optical heart rate and blood oxygen monitoring',
      references: 'Ventricle-Arterial Coupling Analysis'
    }
  ],

  // Live metrics equations (calculated in real-time)
  liveMetricsEquations: [
    {
      id: 'live-hr-calculation',
      name: 'Real-time Heart Rate',
      formula: 'HR = 60 + Math.random() * 60 + sin(t/5000) * 20',
      category: 'Live Metrics',
      updateFrequency: '500ms'
    },
    {
      id: 'live-eeg-alpha',
      name: 'Live EEG Alpha',
      formula: 'α = 8 + Math.random() * 4',
      category: 'Live Metrics',
      updateFrequency: '500ms'
    },
    {
      id: 'live-eeg-beta',
      name: 'Live EEG Beta',
      formula: 'β = 12 + Math.random() * 8',
      category: 'Live Metrics',
      updateFrequency: '500ms'
    }
  ],

  // Get all equations
  getAll() {
    return this.diagnosticEquations;
  },

  // Get equations by category
  getByCategory(category) {
    return this.diagnosticEquations.filter(eq => eq.category === category);
  },

  // Get unique categories
  getCategories() {
    return [...new Set(this.diagnosticEquations.map(eq => eq.category))];
  },

  // Get equation by ID
  getById(id) {
    return this.diagnosticEquations.find(eq => eq.id === id);
  },

  // Format equations for display
  formatForDisplay(equation) {
    return {
      title: equation.name,
      formula: equation.formula,
      latex: equation.latex,
      description: equation.description,
      category: equation.category,
      variables: equation.variables,
      clinical: equation.clinicalRelevance
    };
  },

  // Format all equations as JSON for API response
  toJSON() {
    return {
      timestamp: new Date().toISOString(),
      totalEquations: this.diagnosticEquations.length,
      categories: this.getCategories(),
      equations: this.diagnosticEquations
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EquationRegistry;
}

console.log('[EquationRegistry] Loaded:', EquationRegistry.diagnosticEquations.length, 'diagnostic equations');
