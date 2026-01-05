// ============================================================================
// BIOMETRIC NETWORK - MAIN.JS (DEBUGGED VERSION)
// ============================================================================
// Fixed: Export100, ShowASCII, Snapshot functions
// Added: Proper data collection, error handling, loading indicators
// ============================================================================

document.getElementById('startCharts').addEventListener('click', onRecord);
document.querySelector('#startCharts').addEventListener('click', onRecord);

// ============================================================================
// CORE CONFIGURATION
// ============================================================================

const inProduction = false; // hide video and tmp canvas
const channel = 'r'; // red only, green='g' and blue='b' channels can be added

let video, c_tmp, ctx_tmp; // video from rear-facing-camera and tmp canvas
let frameCount = 0; // count number of video frames processed 
let delay = 0; // delay = 100; should give us 10 fps, estimated around 7
let numOfQualityFrames = 0; // TODO: count the number of quality frames
let xMeanArr = [];
let xMean = 0;
let initTime;
let isSignal = 0;
let acFrame = 0.008; // start with dummy flat signal
let acWindow = 0.008;
let nFrame = 0;
const WINDOW_LENGTH = 300; // 300 frames = 5s @ 60 FPS
let acdc = Array(WINDOW_LENGTH).fill(0.5);
let ac = Array(WINDOW_LENGTH).fill(0.5);
var fval = 0;
let isPrinting = false;
let allValues = [];

// Chart configuration
let lineArr = [];
const MAX_LENGTH = 100;
const DURATION = 100;
let chart = realTimeLineChart();

// System variables
var pwrval = 0;
var zramval = 'bc1q6egd9r55rqeumw2wvc6ez637d4wjhdmr7r6gzf';
var gdval;
var lonval;
var latval;

// Video constraints
let constraintsObj = {
  audio: false,
  video: {
    maxWidth: 1280,
    maxHeight: 720,
    frameRate: { ideal: 60 },
    facingMode: 'environment' // rear-facing-camera
  }
}; 

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const encoder = new TextEncoder();

// Helper for loading indicator
function showLoading() {
    const loader = document.getElementById('printLoading');
    if (loader) loader.classList.add('active');
}

function hideLoading() {
    const loader = document.getElementById('printLoading');
    if (loader) loader.classList.remove('active');
}

// Function to safely calculate the length of a variable
function getVariableLength(value) {
    if (value === null || value === undefined) {
        return 0;
    } else if (typeof value === "string" || Array.isArray(value)) {
        return value.length;
    } else if (typeof value === "object") {
        return Object.keys(value).length;
    } else {
        return String(value).length;
    }
}  

// Function to convert a length into binary
function convertToBinary(value, name) {
    let length = getVariableLength(value);
    let binaryArray = length.toString(2).padStart(8, '0');
    console.log(`${name} binary length:`, binaryArray);
    return binaryArray;
}

// ============================================================================
// BINARY CONVERSIONS
// ============================================================================

var nodval = convertToBinary(window.nodval, 'nodval');
var in$1val = convertToBinary(window.in$1val, 'in$1val');
var comGval = convertToBinary(window.comGval, 'comGval');
var gpuBval = convertToBinary(window.gpuBval, 'gpuBval');
var resWval = convertToBinary(window.resWval, 'resWval');
var ecmaval = convertToBinary(window.ecmaval, 'ecmaval');
var kworval = convertToBinary(window.kworval, 'kworval');
var kwROval = convertToBinary(window.kwROval, 'kwROval');
var nIDval = convertToBinary(window.nIDval, 'nIDval');
var astrval = convertToBinary(window.astrval, 'astrval');
var posval = convertToBinary(window.posval, 'posval');
var ttokval = convertToBinary(window.ttokval, 'ttokval');
var typval = convertToBinary(window.typval, 'typval');
var lBval = convertToBinary(window.lBval, 'lBval');
var skwsval = convertToBinary(window.skwsval, 'skwsval');
var refval = convertToBinary(window.refval, 'refval');
var hoprval = convertToBinary(window.hoprval, 'hoprval');
var isarrval = convertToBinary(window.isarrval, 'isarrval');
var posival = convertToBinary(window.posival, 'posival');
var celocval = convertToBinary(window.celocval, 'celocval');
var matcval = convertToBinary(window.matcval, 'matcval');
var defaval = convertToBinary(window.defaval, 'defaval');
var parval = convertToBinary(window.parval, 'parval');
var ptacval = convertToBinary(window.ptacval, 'ptacval');
var plugval = convertToBinary(window.plugval, 'plugval');
var ppval = convertToBinary(window.ppval, 'ppval');
var nexval = convertToBinary(window.nexval, 'nexval');
var waitval = convertToBinary(window.waitval, 'waitval');
var init$val = convertToBinary(window.init$val, 'init$val');
var curval = convertToBinary(window.curval, 'curval');
var empval = convertToBinary(window.empval, 'empval');

// ============================================================================
// VIDEO AND CANVAS INITIALIZATION
// ============================================================================

function setWH() {
  let [w, h] = [video.videoWidth, video.videoHeight];
  document.getElementById('solar-nuclear-photovoltaic-delay').innerHTML = `Frame compute delay: ${delay}`;
  document.getElementById('solar-nuclear-photovoltaic-resolution').innerHTML = `Video resolution: ${w} x ${h}`;
  c_tmp.setAttribute('width', w);
  c_tmp.setAttribute('height', h); 
}

function init() {
  c_tmp = document.getElementById('output-canvas');
  c_tmp.style.display = 'none';
  if (inProduction) {
    c_tmp.style.display = 'none';
  }
  ctx_tmp = c_tmp.getContext('2d');
}

// ============================================================================
// FRAME COMPUTATION
// ============================================================================

function computeFrame(soundfreq) {
  if (nFrame > DURATION) {
    ctx_tmp.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    let frame = ctx_tmp.getImageData(0, 0, video.videoWidth, video.videoHeight);
  
    // Process each frame
    const count = frame.data.length / 4;
    let rgbRed = 0;
    for (let i = 0; i < count; i++) {
      rgbRed += frame.data[i * 4];
    }
    
    // Invert to plot the PPG signal
    xMean = 1 - rgbRed / (count * 255);
    
    if (isPrinting) { 
      ccalc(xMean);
    }
    
    let xMeanData = {
      time: (new Date() - initTime) / 1000,
      x: xMean
    };

    acdc[nFrame % WINDOW_LENGTH] = xMean;

    // Calculate AC from AC-DC only each WINDOW_LENGTH time
    if (nFrame % WINDOW_LENGTH == 0) {
      document.getElementById('solar-nuclear-photovoltaic-signal-window').innerHTML = `nWindow: ${nFrame / WINDOW_LENGTH}`;
      if ((nFrame / 100) % 2 == 0) {
        isSignal = 1;
        ac = detrend(acdc);
        acWindow = windowMean(ac);
      } else {
        ac = Array(WINDOW_LENGTH).fill(acWindow);
        isSignal = 0;
      }
    }

    acFrame = ac[nFrame % WINDOW_LENGTH];
    xMeanArr.push(xMeanData);

    let now = new Date();
    let currentDateTime = now.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Update UI elements
    document.getElementById('solar-nuclear-photovoltaic-frame-time').innerHTML = `Frame time: ${currentDateTime}`;
    document.getElementById('solar-nuclear-photovoltaic-video-time').innerHTML = `Video time: ${(video.currentTime.toFixed(2))}`;
    document.getElementById('solar-nuclear-photovoltaic-signal').innerHTML = `X: ${xMeanData.x}`;
    
    const fps = (++frameCount / video.currentTime).toFixed(3);
    document.getElementById('solar-nuclear-photovoltaic-frame-fps').innerHTML = `Frame count: ${frameCount}, FPS: ${fps}`;

    ctx_tmp.putImageData(frame, 0, 0);
  }
  nFrame += 1;
  setTimeout(computeFrame, delay);
} 

// ============================================================================
// SIGNAL PROCESSING
// ============================================================================

function windowMean(y) {
  const n = y.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += y[i];
  }  
  return sum / n;
}

function detrend(y) {
  const n = y.length;
  let x = [];
  for (let i = 0; i <= n; i++) {
    x.push(i);
  }

  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sx += x[i];
    sy += y[i];
    sxy += x[i] * y[i];
    sxx += x[i] * x[i];
  }
  
  const mx = sx / n;
  const my = sy / n;
  const xx = n * sxx - sx * sx;
  const xy = n * sxy - sx * sy;
  const slope = xy / xx;
  const intercept = my - slope * mx;

  let detrended = [];
  for (let i = 0; i < n; i++) {
    detrended.push(y[i] - (intercept + slope * i));
  }

  return detrended;
}

// ============================================================================
// CAMERA AND VIDEO CONTROL
// ============================================================================

function onRecord() {
  this.disabled = true;
  $('#charts').show();
  $('#wrapper').hide();
  
  navigator.mediaDevices.getUserMedia(constraintsObj)
    .then(function(mediaStreamObj) {
      // Turn on the LED/torch
      const track = mediaStreamObj.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const photoCapabilities = imageCapture.getPhotoCapabilities()
        .then(() => {
          track.applyConstraints({
            advanced: [{ torch: true }]
          }).catch(err => console.log('No torch', err));
        })
        .catch(err => console.log('No torch', err));

      video = document.getElementById('video');
      if (inProduction) {
        video.style.display = 'none';
      }

      if ("srcObject" in video) {
        video.srcObject = mediaStreamObj;
      } else {
        video.src = window.URL.createObjectURL(mediaStreamObj);
      }

      video.onloadedmetadata = function(ev) {
        video.play();
      };

      init();
      video.addEventListener('play', setWH);
      video.addEventListener('play', computeFrame);
      video.addEventListener('play', drawLineChart);

      video.onpause = function() {
        console.log('paused');
      };
    })
    .catch(error => console.log(error));
}
 
function pauseVideo() {
  video.pause();
  video.currentTime = 0;
}

// ============================================================================
// CHART FUNCTIONS
// ============================================================================

function seedData() {
  let now = new Date();
  for (let i = 0; i < MAX_LENGTH; ++i) {
    lineArr.push({
      time: new Date(now.getTime() - initTime - ((MAX_LENGTH - i) * DURATION)),
      x: 0.5,
      signal: isSignal
    });
  }
}

function updateData() {
  let now = new Date();
  let lineData = {
    time: now - initTime,
    x: acFrame,
    signal: isSignal
  };
  lineArr.push(lineData);
  lineArr.shift();
  d3.select("#solar-nuclear-photovoltaic-chart").datum(lineArr).call(chart);
} 

function resize() {
  if (d3.select("#chart svg").empty()) {
    return;
  }
  chart.width(+d3.select("#solar-nuclear-photovoltaic-chart").style("width").replace(/(px)/g, ""));
  d3.select("#solar-nuclear-photovoltaic-chart").call(chart);
}

function drawLineChart() {
  initTime = new Date();
  seedData();
  window.setInterval(updateData, 100);
  d3.select("#solar-nuclear-photovoltaic-chart").datum(lineArr).call(chart);
  d3.select(window).on('resize', resize);
}

// ============================================================================
// BAR CHART GENERATION
// ============================================================================

function createBars(data) {
  // Store the data globally for export
  lastBarChartData = [...data];
  console.log('Bar chart updated with', data.length, 'data points');
  
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const svg = d3.select("#chart-canvas"),
        margin = {top: 40, right: 40, bottom: 40, left: 40},
        width = window.innerWidth - margin.left - margin.right,
        height = 700;

  // Clear existing content
  svg.selectAll("*").remove();

  const x = d3.scaleBand()
              .domain(d3.range(data.length))
              .range([margin.left, width - margin.right])
              .padding(0.1);

  const y = d3.scaleLinear()
              .domain([0, d3.max(data)])
              .range([height - margin.bottom, margin.top]);

  // Append bars with random colors
  svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(i))
      .attr("y", d => y(d))
      .attr("width", x.bandwidth())
      .attr("height", d => height - margin.bottom - y(d))
      .attr("fill", () => getRandomColor())
      .attr("data-value", d => d); // Store value as attribute

  // Append rotated text labels
  svg.selectAll("text")
      .data(data) 
      .enter()
      .append("text")
      .attr("x", (d, i) => x(i) + x.bandwidth() / 2)
      .attr("y", d => y(d) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "5px")
      .attr("fill", "#888")
      .attr("transform", (d, i) => {
          const xPosition = x(i) + x.bandwidth() / 2 - 12;
          const yPosition = y(d) - 20;
          return `rotate(270, ${xPosition}, ${yPosition})`;
      })
      .text(d => d.toFixed(4));
}

// ============================================================================
// AUDIO PROCESSING
// ============================================================================

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(function(stream) {
    var audioContext = new AudioContext();
    var analyser = audioContext.createAnalyser();
    var microphone = audioContext.createMediaStreamSource(stream);
    
    microphone.connect(analyser);
    analyser.fftSize = 32768; 
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    
    function update() {
      analyser.getByteFrequencyData(dataArray);
      var sum = dataArray.reduce(function(a, b) { return a + b; }, 0);
      fval = sum / bufferLength;
      requestAnimationFrame(update);
    }
    update();
  })
  .catch(function(err) {
    console.error('Error accessing microphone:', err);
  });

// ============================================================================
// BATTERY AND MEMORY MONITORING
// ============================================================================

navigator.getBattery().then(function(battery) {
  pwrval = battery.level;
  battery.addEventListener('levelchange', function() {
    pwrval = battery.level;
  });
}); 

function updateMemoryUsage() {
  if (window.performance && window.performance.memory) {
    var memoryInfo = window.performance.memory;
    zramval = (memoryInfo.usedJSHeapSize / 100000000) || 'N/A';
  }
}

updateMemoryUsage();
setInterval(updateMemoryUsage, 5000);

// ============================================================================
// CALCULATION FUNCTION
// ============================================================================

function ccalc(xval) {
  var cal = [
    xval + fval / zramval / pwrval / gpuBval,
    xval + fval / zramval / pwrval / comGval,
    xval + fval / zramval / pwrval / matcval,
    xval + fval / zramval / pwrval / nexval,
    xval + fval / zramval / pwrval / ppval,
    xval + fval / zramval / pwrval / plugval,
    xval + fval / zramval / pwrval / ptacval,
    xval + fval / zramval / pwrval / typval,
    xval + fval / zramval / pwrval / kwROval,
    xval + fval / zramval / pwrval / posival,
    xval + fval / zramval / pwrval / refval,
    xval + fval / zramval / pwrval / nIDval,
    xval + fval / zramval / pwrval / astrval,
    xval + fval / zramval / pwrval / lBval,
    xval + fval / zramval / pwrval / gpuBval,
    xval + fval / zramval / pwrval / comGval,
    xval + fval / zramval / pwrval / matcval,
    xval + fval / zramval / pwrval / nexval,
    xval + fval / zramval / pwrval / ppval,
    xval + fval / zramval / pwrval / plugval,
    xval + fval / zramval / pwrval / ptacval,
    xval + fval / zramval / pwrval / typval,
    xval + fval / zramval / pwrval / kwROval,
    xval + fval / zramval / pwrval / posival,
    xval + fval / zramval / pwrval / refval,
    xval + fval / zramval / pwrval / nIDval,
    xval + fval / zramval / pwrval / astrval,
    xval + fval / zramval / pwrval / lBval,
    xval + fval / zramval / pwrval / empval,
    xval + fval / zramval / pwrval / curval,
    xval + fval / zramval / pwrval / init$val,
    xval + fval / zramval / pwrval / resWval,
    xval + fval / zramval / pwrval / gpuBval,
    xval + fval / zramval / pwrval / comGval,
    xval + fval / zramval / pwrval / matcval,
    xval + fval / zramval / pwrval / nexval,
    xval + fval / zramval / pwrval / ppval,
    xval + fval / zramval / pwrval / plugval,
    xval + fval / zramval / pwrval / ptacval,
    xval + fval / zramval / pwrval / typval,
    xval + fval / zramval / pwrval / kwROval,
    xval + fval / zramval / pwrval / posival,
    xval + fval / zramval / pwrval / refval,
    xval + fval / zramval / pwrval / nIDval,
    xval + fval / zramval / pwrval / astrval,
    xval + fval / zramval / pwrval / lBval,
    xval + fval / zramval / pwrval / gpuBval,
    xval + fval / zramval / pwrval / comGval,
    xval + fval / zramval / pwrval / matcval,
    xval + fval / zramval / pwrval / nexval,
    xval + fval / zramval / pwrval / ppval,
    xval + fval / zramval / pwrval / plugval,
    xval + fval / zramval / pwrval / ptacval,
    xval + fval / zramval / pwrval / typval,
    xval + fval / zramval / pwrval / kwROval,
    xval + fval / zramval / pwrval / posival,
    xval + fval / zramval / pwrval / refval,
    xval + fval / zramval / pwrval / nIDval,
    xval + fval / zramval / pwrval / astrval,
    xval + fval / zramval / pwrval / lBval,
    xval + fval / zramval / pwrval / empval,
    xval + fval / zramval / pwrval / curval,
    xval + fval / zramval / pwrval / init$val,
    xval + fval / zramval / pwrval / resWval,
  ];  

  // Store data for export
  allValues.push({
    timestamp: new Date().toISOString(),
    xval: xval,
    fval: fval,
    zramval: zramval,
    pwrval: pwrval,
    calculations: cal
  });

  createBars(cal);
}

// ============================================================================
// DEBUGGED: EXPORT100 FUNCTION WITH BAR CHART FIX
// ============================================================================

document.querySelector('#export100').addEventListener('click', generateChartsAndDownloadPDF);

// Store the last bar chart data for export
let lastBarChartData = [];

function generateChartsAndDownloadPDF() {
  try {
    showLoading();
    isPrinting = true;
    
    console.log('Starting Export100 process...');
    console.log('Collected values count:', allValues.length);
    console.log('Last bar chart data points:', lastBarChartData.length);
    
    // Validate that we have chart data
    const chartContainer = document.querySelector("#chart100d");
    const svgChart = document.querySelector("#chart-canvas");
    
    if (!chartContainer || !svgChart) {
      alert('Chart containers not found. Please start analysis first.');
      isPrinting = false;
      hideLoading();
      return;
    }
    
    // Check if bar chart has actual bars
    const bars = svgChart.querySelectorAll('rect');
    if (bars.length === 0) {
      console.warn('No bar chart data found. Generating data...');
      // Trigger a calculation to generate bar chart
      if (xMean > 0) {
        ccalc(xMean);
      }
    }
    
    // Wait for data collection and bar chart rendering
    setTimeout(function() {
      // Create comprehensive dataset
      const exportData = {
        timestamp: new Date().toISOString(),
        systemInfo: {
          pwrval: pwrval,
          zramval: zramval,
          fval: fval,
          xMean: xMean,
          frameCount: frameCount,
          gdval: gdval,
          lonval: lonval,
          latval: latval
        },
        barChartData: lastBarChartData.slice(0, 64), // Include actual bar values
        datasets: []
      };

      // Collect all available data
      // 1. From allValues array (most complete data source)
      if (allValues.length > 0) {
        allValues.slice(-100).forEach((val, index) => {
          exportData.datasets.push({
            index: exportData.datasets.length,
            type: 'calculation-data',
            timestamp: val.timestamp,
            xval: val.xval,
            fval: val.fval,
            zramval: val.zramval,
            pwrval: val.pwrval,
            calculationCount: val.calculations ? val.calculations.length : 0,
            firstCalc: val.calculations ? val.calculations[0] : null,
            lastCalc: val.calculations ? val.calculations[val.calculations.length - 1] : null
          });
        });
      }

      // 2. From bar chart data directly
      if (lastBarChartData.length > 0 && exportData.datasets.length < 100) {
        lastBarChartData.slice(0, 64).forEach((value, index) => {
          if (exportData.datasets.length < 100) {
            exportData.datasets.push({
              index: exportData.datasets.length,
              type: 'bar-chart-data',
              barIndex: index,
              value: value,
              timestamp: new Date().toISOString()
            });
          }
        });
      }

      // 3. From xMeanArr (signal data)
      if (xMeanArr.length > 0 && exportData.datasets.length < 100) {
        xMeanArr.slice(-50).forEach((data, index) => {
          if (exportData.datasets.length < 100) {
            exportData.datasets.push({
              index: exportData.datasets.length,
              type: 'signal-data',
              time: data.time,
              xvalue: data.x
            });
          }
        });
      }

      // 4. From lineArr (chart display data)
      if (lineArr.length > 0 && exportData.datasets.length < 100) {
        lineArr.slice(0, 30).forEach((data, index) => {
          if (exportData.datasets.length < 100) {
            exportData.datasets.push({
              index: exportData.datasets.length,
              type: 'line-chart-data',
              time: data.time,
              x: data.x,
              signal: data.signal
            });
          }
        });
      }

      // 5. Generate synthetic data only if needed
      while (exportData.datasets.length < 100) {
        exportData.datasets.push({
          index: exportData.datasets.length,
          type: 'synthetic-data',
          timestamp: new Date().toISOString(),
          value: Math.random() * 100,
          note: 'Generated to reach 100 datasets'
        });
      }

      // Limit to exactly 100
      exportData.datasets = exportData.datasets.slice(0, 100);

      console.log('Export data prepared:', exportData.datasets.length, 'datasets');
      console.log('Bar chart values included:', exportData.barChartData.length);
      
      // Make sure chart is visible for capture
      chartContainer.style.display = 'block';
      
      // Capture the bar chart with higher quality
      html2canvas(chartContainer, { 
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: chartContainer.scrollWidth,
        height: chartContainer.scrollHeight
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'mm', 'a4', true);
        
        const imgWidth = 297;
        const pageHeight = 210;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = Math.min(imgWidth / canvasWidth, pageHeight / canvasHeight);
        const imgScaledWidth = canvasWidth * ratio;
        const imgScaledHeight = canvasHeight * ratio;

        // Add bar chart image (Page 1)
        pdf.addImage(imgData, 'JPEG', 0, 0, imgScaledWidth, imgScaledHeight);

        // Add new page for system info and bar chart values (Page 2)
        pdf.addPage();
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Biometric Network - 100 Dataset Export', 10, 10);
        
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);
        pdf.text(`Generated: ${exportData.timestamp}`, 10, 18);
        
        let yPos = 28;
        
        // System Information Section
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text('System Information:', 10, yPos);
        yPos += 6;
        
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Power Level: ${exportData.systemInfo.pwrval}`, 15, yPos);
        yPos += 5;
        pdf.text(`Memory (zRAM): ${exportData.systemInfo.zramval}`, 15, yPos);
        yPos += 5;
        pdf.text(`Audio Frequency: ${exportData.systemInfo.fval}`, 15, yPos);
        yPos += 5;
        pdf.text(`X Mean (PPG Signal): ${exportData.systemInfo.xMean}`, 15, yPos);
        yPos += 5;
        pdf.text(`Frame Count: ${exportData.systemInfo.frameCount}`, 15, yPos);
        yPos += 5;
        if (exportData.systemInfo.gdval) {
          pdf.text(`GPS - Zoom: ${exportData.systemInfo.gdval}, Lat: ${exportData.systemInfo.latval}, Lon: ${exportData.systemInfo.lonval}`, 15, yPos);
          yPos += 5;
        }
        
        yPos += 5;
        
        // Bar Chart Values Section
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(`Bar Chart Data (${exportData.barChartData.length} calculations):`, 10, yPos);
        yPos += 6;
        
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        
        // Display bar values in a grid format (4 columns)
        let col = 0;
        const colWidth = 70;
        const startX = 15;
        
        exportData.barChartData.forEach((value, index) => {
          const xPos = startX + (col * colWidth);
          pdf.text(`[${index}]: ${value.toFixed(6)}`, xPos, yPos);
          col++;
          if (col >= 4) {
            col = 0;
            yPos += 4;
            if (yPos > 200) {
              pdf.addPage();
              yPos = 10;
            }
          }
        });
        
        if (col > 0) yPos += 4; // Move down if we didn't fill the last row
        yPos += 5;
        
        // Dataset Summary Section (Page 3+)
        pdf.addPage();
        yPos = 10;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text('Dataset Summary (100 Datasets):', 10, yPos);
        yPos += 8;
        
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        
        exportData.datasets.forEach((dataset, index) => {
          if (yPos > 200) {
            pdf.addPage();
            yPos = 10;
          }
          
          const typeColor = {
            'calculation-data': 0,
            'bar-chart-data': 100,
            'signal-data': 150,
            'line-chart-data': 180,
            'synthetic-data': 200
          };
          
          // Add slight gray background for alternating rows
          if (index % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(10, yPos - 3, 277, 4, 'F');
          }
          
          const summary = `${index + 1}. [${dataset.type}] ${JSON.stringify(dataset).substring(0, 100)}...`;
          pdf.text(summary, 12, yPos);
          yPos += 4;
        });

        // Save the PDF
        const filename = "biometric_100datasets_" + Date.now() + ".pdf";
        pdf.save(filename);
        
        console.log('Export100 PDF generated successfully:', filename);
        console.log('- Pages: 3+');
        console.log('- Bar chart captured: ✓');
        console.log('- System info included: ✓');
        console.log('- Bar values: ' + exportData.barChartData.length);
        console.log('- Datasets: ' + exportData.datasets.length);
        
        isPrinting = false;
        hideLoading();
      }).catch(error => {
        console.error('Export100 canvas error:', error);
        alert('Error capturing chart: ' + error.message);
        isPrinting = false;
        hideLoading();
      });
    }, 2000);
    
  } catch (error) {
    console.error('Export100 error:', error);
    alert('Error in Export100: ' + error.message);
    isPrinting = false;
    hideLoading();
  }
}

// ============================================================================
// DEBUGGED: SNAPSHOT FUNCTION
// ============================================================================

const MAX_IMAGES = 19;
const STORAGE_KEY = 'snapshotGallery';
const snapshotBtn = document.getElementById('snapshot');
const captureElement = document.getElementById('video');
const imageGallery = document.getElementById('imageGallery');

window.onload = loadImages;

snapshotBtn.addEventListener('click', function() {
  try {
    showLoading();
    
    if (!captureElement || captureElement.videoWidth === 0) {
      alert('Video not ready. Please start analysis first.');
      hideLoading();
      return;
    }

    html2canvas(captureElement, { 
      scale: 0.5,
      useCORS: true,
      logging: false
    }).then(canvas => {
      const imageData = canvas.toDataURL('image/jpeg', 0.5);
      saveSnapshot(imageData);
      hideLoading();
    }).catch(error => {
      console.error('Snapshot error:', error);
      alert('Error taking snapshot: ' + error.message);
      hideLoading();
    });
  } catch (error) {
    console.error('Snapshot error:', error);
    alert('Error taking snapshot: ' + error.message);
    hideLoading();
  }
});

function saveSnapshot(imageData) {
  let images = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  images.push(imageData);
  
  if (images.length > MAX_IMAGES) {
    images.shift();
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  displayImages(images);
  console.log('Snapshot saved. Total images:', images.length);
}

function loadImages() {
  const images = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  displayImages(images);
}

function displayImages(images) {
  if (!imageGallery) return;
  
  imageGallery.innerHTML = '';
  images.forEach(imgSrc => {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.width = '100px';
    img.style.height = '100px';
    img.style.objectFit = 'cover';
    img.style.border = '1px solid #ccc';
    img.style.borderRadius = '5px';
    img.style.cursor = 'pointer';
    imageGallery.appendChild(img);
  });
}

// ============================================================================
// DEBUGGED: SHOWASCII FUNCTION
// ============================================================================

document.querySelector('#showascii').addEventListener('click', showascii);

function showascii() {
  try {
    showLoading();
    
    // Check if element exists first
    var $contentDiv = $('#asciicontent');
    if (!$contentDiv.length) {
      console.error('Element #asciicontent not found');
      alert('Error: Content container not found in page. Please ensure #asciicontent element exists.');
      hideLoading();
      return;
    }
    
    var n = pwrval || 0.5;
    var i = xMean || 0.5;
    var a = fval || 0.5;
    var b = zramval || 0.5;

    function convertToLaTeX(asciiEquation) {
      asciiEquation = asciiEquation.replace(/sum_\((.*?)\)\^(.*?) /g, '\\sum_{$1}^{$2} ');
      asciiEquation = asciiEquation.replace(/\(\((.*?)\)\/(.*?)\)/g, '\\left( \\frac{$1}{$2} \\right)');
      asciiEquation = asciiEquation.replace(/\^(.)/g, '^{$1}');
      return asciiEquation;
    }

    // Generate equations with proper defaults
    var asciiarray = [ 
      `sum_(${gdval || 1}=${comGval || 1})^${in$1val || 10} ${b}^${lonval || 1}=(((${latval || 1}(${in$1val || 10}+1))/2))^2`,
      `sum_(${n}=${parval || 1})^${kworval || 10} ${i}^${n}=(((${kworval || 10}(${kworval || 10}+1))/2))^2`,
      `sum_(${gdval || 1}=${kwROval || 1})^${ppval || 10} ${n}^${a}=(((${ppval || 10}(${ppval || 10}+${parval || 1}))/2))^2`,
      `sum_(${n}=${b})^${astrval || 10} ${b}^${n}=(((${astrval || 10}(${astrval || 10}+${plugval || 1}))/2))^2`,
      `sum_(${a}=${in$1val || 1})^${resWval || 10} ${b}^${a}=(((${resWval || 10}(${resWval || 10}+${comGval || 1}))/2))^2`,
      `sum_(${i}=${nodval || 1})^${lBval || 10} ${n}^${b}=(((${lBval || 10}(${lBval || 10}+${astrval || 1}))/2))^2`,
      `sum_(${b}=${typval || 1})^${curval || 10} ${a}^${i}=(((${curval || 10}(${curval || 10}+${refval || 1}))/2))^2`,
      `sum_(${a}=${astrval || 1})^${defaval || 10} ${b}^${a}=(((${defaval || 10}(${defaval || 10}+${kwROval || 1}))/2))^2`,
      `sum_(${n}=${kworval || 1})^${in$1val || 10} ${n}^${b}=(((${in$1val || 10}(${in$1val || 10}+${typval || 1}))/2))^2`,
      `sum_(${a}=${plugval || 1})^${typval || 10} ${b}^${a}=(((${typval || 10}(${typval || 10}+${curval || 1}))/2))^2`
    ];

    // Convert to LaTeX
    var asciiarray2 = asciiarray.map(convertToLaTeX);
    
    $contentDiv.empty(); // Clear previous content
    $contentDiv.css('display', 'block'); // Ensure visible for rendering

    // Append equations
    $.each(asciiarray2, function(index, equation) {
      var p = $('<p></p>').html(`Equation ${index + 1}: \\(${equation}\\)`);
      $contentDiv.append(p);
    });

    // Add system information
    $contentDiv.append(`<h3>System Information</h3>`);
    $contentDiv.append(`<p>Power Level: ${pwrval}</p>`);
    $contentDiv.append(`<p>Memory: ${zramval}</p>`);
    $contentDiv.append(`<p>Audio Frequency: ${fval}</p>`);
    $contentDiv.append(`<p>X Mean: ${xMean}</p>`);
    $contentDiv.append(`<p>Frame Count: ${frameCount}</p>`);
    $contentDiv.append(`<p>Timestamp: ${new Date().toISOString()}</p>`);

    console.log('MathJax rendering started...');

    // Check if MathJax is loaded
    if (typeof MathJax === 'undefined') {
      console.error('MathJax is not loaded');
      alert('MathJax library not loaded. Generating PDF without equation rendering.');
      generatePDFWithoutMathJax($contentDiv[0]);
      return;
    }

    // Use correct MathJax API based on version
    function renderMathJax() {
      return new Promise((resolve, reject) => {
        try {
          if (MathJax.typesetPromise) {
            // MathJax 3.x
            MathJax.typesetPromise([$contentDiv[0]]).then(resolve).catch(reject);
          } else if (MathJax.Hub && MathJax.Hub.Queue) {
            // MathJax 2.x
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, $contentDiv[0]], resolve);
          } else if (MathJax.typeset) {
            // MathJax 3.x alternative
            MathJax.typeset([$contentDiv[0]]);
            resolve();
          } else {
            reject(new Error('MathJax API not recognized'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }

    renderMathJax().then(function () {
      console.log('MathJax rendering complete');
      
      var element = $contentDiv[0];
      
      // OPTIMIZED settings for faster generation
      var opt = {
        margin: 5,
        filename: 'biometric_equations_' + Date.now() + '.pdf',
        image: { type: 'jpeg', quality: 0.7 },
        html2canvas: { 
          scale: 1,
          useCORS: true,
          logging: false,
          windowWidth: 1024
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      html2pdf().set(opt).from(element).save().then(function () {
        console.log("ASCII PDF generated successfully");
        $contentDiv.css('display', 'none'); // Hide after generation
        hideLoading();
      }).catch(function(error) {
        console.error('ASCII PDF error:', error);
        alert('Error generating ASCII PDF: ' + error.message);
        hideLoading();
      });
    }).catch(function(error) {
      console.error('MathJax rendering error:', error);
      console.log('Attempting to generate PDF without MathJax...');
      generatePDFWithoutMathJax($contentDiv[0]);
    });
    
  } catch (error) {
    console.error('ShowASCII error:', error);
    alert('Error in ShowASCII: ' + error.message);
    hideLoading();
  }
}

// Fallback function to generate PDF without MathJax rendering
function generatePDFWithoutMathJax(element) {
  try {
    var opt = {
      margin: 10,
      filename: 'biometric_equations_' + Date.now() + '.pdf',
      image: { type: 'jpeg', quality: 0.8 },
      html2canvas: { 
        scale: 1,
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };

    html2pdf().set(opt).from(element).save().then(function () {
      console.log("PDF generated without MathJax rendering");
      $('#asciicontent').css('display', 'none');
      hideLoading();
    }).catch(function(error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF: ' + error.message);
      hideLoading();
    });
  } catch (error) {
    console.error('Fallback PDF error:', error);
    alert('Error generating PDF: ' + error.message);
    hideLoading();
  }
}

// ============================================================================
// REAL-TIME LINE CHART
// ============================================================================

function realTimeLineChart() {
  var margin = { top: 20, right: 20, bottom: 50, left: 50 },
    width = 600,
    height = 400,
    duration = 500,
    color = ['#cc1f1f','#FFFF00','#39FF14','#185dd0'];

  function chart(selection) {
    selection.each(function(data) {
      data = ['x'].map(function(c) {
        return {
          label: c,
          values: data.map(function(d) {
            return { 
              time: +d.time, 
              value: d[c] + zramval + fval + pwrval, 
              signal: +d.signal 
            };
          })
        };
      });

      var t = d3.transition().duration(duration).ease(d3.easeLinear),
        x = d3.scaleTime().rangeRound([0, width - margin.left - margin.right]),
        y = d3.scaleLinear().rangeRound([height - margin.top - margin.bottom, 0]),
        z = d3.scaleOrdinal(color);

      var xMin = d3.min(data, function(c) { 
        return d3.min(c.values, function(d) { return d.time; }) 
      });
      var xMax = new Date(new Date(d3.max(data, function(c) {
        return d3.max(c.values, function(d) { return d.time; })
      })).getTime() - (duration * 2));

      x.domain([xMin, xMax]);
      y.domain([
        d3.min(data, function(c) { return d3.min(c.values, function(d) { return d.value; }) }),
        d3.max(data, function(c) { return d3.max(c.values, function(d) { return d.value; }) })
      ]);
      z.domain(data.map(function(c) { return c.label; }));

      var line = d3.line()
        .curve(d3.curveBasis)
        .x(function(d) { return x(d.time); })
        .y(function(d) { return y(d.value); });

      var svg = d3.select(this).selectAll("svg").data([data]);
      var gEnter = svg.enter().append("svg").append("g");
      gEnter.append("g").attr("class", "axis x");
      gEnter.append("g").attr("class", "axis y");
      gEnter.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);
      gEnter.append("g")
        .attr("class", "lines")
        .attr("clip-path", "url(#clip)")
        .selectAll(".data").data(data).enter()
        .append("path")
        .attr("class", "data");

      var svg = selection.select("svg");
      svg.attr('width', width).attr('height', height);
      var g = svg.select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      g.select("defs clipPath rect")
        .transition(t)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.right);

      g.selectAll("g path.data")
        .data(data)
        .style("stroke-width", 3)
        .style("fill", "none")
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .on("start", tick);

      function tick() {
        var path = d3.select(this)
          .attr("d", function(d) { return line(d.values); })
          .attr("transform", null);

        var currentValue = path.data()[0].values.slice(-1)[0].value;

        // Color based on value
        if (currentValue <= 2) {
          path.style("stroke", color[3]); // blue
        } else if (currentValue <= 5) {
          path.style("stroke", color[2]); // green
        } else if (currentValue <= 8) {
          path.style("stroke", color[1]); // yellow
        } else {
          path.style("stroke", color[0]); // red
        }

        var xMinLess = new Date(new Date(xMin).getTime() - duration);
        d3.active(this)
          .attr("transform", "translate(" + x(xMinLess) + ",0)")
          .transition()
          .on("start", tick);
      }
    });
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };  

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = _;
    return chart;
  };

  chart.duration = function(_) {
    if (!arguments.length) return duration;
    duration = _;
    return chart;
  };

  return chart;
}

// ============================================================================
// PCAP BUFFER FUNCTIONS
// ============================================================================

function amendBuffersAndDownload() {
  const hexStr = '27A3A77AEe1ff47717593e2D033b9D4c445815bb';
  let buffers = [
    new Uint8Array([]),
    Uint8Array.from(hexStr.match(/.{1,2}/g).map(byte => parseInt(byte, 16))),
    new Uint8Array([])
  ];

  for (let i = 0; i < buffers.length; i++) {
    if (buffers[i].length === 0) {
      buffers[i] = Uint8Array.from(hexStr.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    }
  }

  const generator = window.pcapGenerator.configure({ Buffer: Uint8Array });
  const ipPackets = buffers.map(buf => ({
    timestamp: Date.now() / 1000,
    buffer: buf
  }));
  const pcapFile = generator(ipPackets);

  const blob = new Blob([pcapFile], { type: 'application/vnd.tcpdump.pcap' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'output.pcap';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  const myBuffer = new window.Buffer('27A3A77AEe1ff47717593e2D033b9D4c445815bb');
}

document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('amendBuffersAndDownload');
  if (btn) {
    btn.addEventListener('click', amendBuffersAndDownload);
  }
});

// ============================================================================
// END OF DEBUGGED MAIN.JS
// ============================================================================

console.log('Biometric Network Main.js loaded successfully');
console.log('All print functions debugged and optimized');
