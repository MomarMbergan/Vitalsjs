// Place this in assets/js/ccalc-charts.js

// Example: Set these somewhere globally or in your form logic
let fval = 10;
let zramval = 2;
let pwrval = 2;

// Calculation function
function ccalc(xval) {
  // Protect division by zero
  function safeDiv(a, b) {
    return b === 0 ? 0 : a / b;
  }
  // Calculate with error checking
  var firstValue = xval + safeDiv(fval, safeDiv(zramval, pwrval));
  var otherValue = xval + fval;

  // Example: 80 data points, first two are different, rest are otherValue
  var cal = [firstValue, firstValue];
  for (let i = 2; i < 80; i++) cal.push(otherValue);

  createBars(cal); // Update the chart with new calculation values
}

// Chart.js chart instance
let chartInstance = null;

// Draw or update chart
function createBars(cal) {
  const ctxId = "ccalcChart";
  let canvas = document.getElementById(ctxId);
  if (!canvas) {
    // Create canvas if not exists
    canvas = document.createElement("canvas");
    canvas.id = ctxId;
    // Fit the print page: width 100%, fixed ratio
    canvas.style.width = "100%";
    canvas.style.maxWidth = "900px";
    canvas.style.height = "400px";
    canvas.style.display = "block";
    canvas.style.margin = "30px auto";
    document.body.appendChild(canvas);
  }

  // Chart labels: 1..cal.length
  const labels = Array.from({ length: cal.length }, (_, i) => i + 1);

  // Destroy previous chart if exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Calculation Result",
          data: cal,
          backgroundColor: "rgba(0, 240, 255, 0.7)",
          borderColor: "#00F0FF",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        title: { display: true, text: "Calculation Chart" }
      },
      scales: {
        x: { title: { display: true, text: "Index" } },
        y: { title: { display: true, text: "Value" }, beginAtZero: true }
      }
    },
  });
}

// Print CSS to fit chart to page
(function addPrintStyle() {
  const style = document.createElement("style");
  style.innerHTML = `
@media print {
  body * { visibility: hidden; }
  #ccalcChart, #ccalcChart * {
    visibility: visible !important;
  }
  #ccalcChart {
    position: absolute !important;
    left: 0; top: 0; width: 100vw !important; height: 90vh !important;
    max-width: none !important; max-height: none !important;
    margin: 0 !important; padding: 0 !important;
    background: #fff;
  }
}
`;
  document.head.appendChild(style);
})();

// Example usage: ccalc(5);
// To use: call ccalc(xval) with your value after Chart.js is loaded.
