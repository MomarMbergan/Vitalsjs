/* src/wadl.js
   Adds a small UI button to fetch and pretty-print the SSCWeb WADL
   URL: https://sscweb.gsfc.nasa.gov/WS/sscr/2/application.wadl
   If fetch fails (CORS), the UI shows the curl command users can run locally:
   $ curl https://sscweb.gsfc.nasa.gov/WS/sscr/2/application.wadl | xmllint --format -
*/
(function () {
  const WADL_URL = 'https://sscweb.gsfc.nasa.gov/WS/sscr/2/application.wadl';

  function formatXml(xml) {
    // Simple XML formatter (works well for typical WADL responses)
    var reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    var pad = 0;
    var formatted = '';
    xml.split('\r\n').forEach(function (node) {
      var indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/?\w[^>]*[^\/]>/)) {
        if (node.match(/^<\//)) {
          if (pad !== 0) pad -= 1;
        } else if (node.match(/^<\w[^>]*[^\/]>/)) {
          indent = 1;
        }
      }
      var padding = new Array(pad + 1).join('  ');
      formatted += padding + node + '\n';
      pad += indent;
    });
    return formatted;
  }

  function createModal() {
    const overlay = document.createElement('div');
    overlay.id = 'wadl-overlay';
    overlay.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;';

    const box = document.createElement('div');
    box.style.cssText = 'width:90%;max-width:1000px;height:80%;background:#111;color:#eee;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,0.6);';

    const header = document.createElement('div');
    header.style.cssText = 'padding:10px 14px;background:#0f1720;display:flex;align-items:center;justify-content:space-between;gap:10px;';
    const title = document.createElement('div');
    title.textContent = 'SSCWeb WADL — application.wadl';
    title.style.cssText = 'font-weight:700;color:#8be9fd;';

    const controls = document.createElement('div');

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy curl';
    copyBtn.title = 'Copy curl command to clipboard';
    copyBtn.style.cssText = 'margin-right:8px;padding:6px 10px;border-radius:6px;border:none;background:#2b2f36;color:#fff;cursor:pointer;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'padding:6px 10px;border-radius:6px;border:none;background:#ff5c5c;color:#111;cursor:pointer;';

    controls.appendChild(copyBtn);
    controls.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(controls);

    const pre = document.createElement('pre');
    pre.style.cssText = 'flex:1;overflow:auto;padding:14px 16px;background:#0b0f13;color:#dfefff;white-space:pre-wrap;word-break:break-word;font-family:monospace;font-size:13px;line-height:1.4;';
    pre.id = 'wadl-pre';
    pre.textContent = 'Loading WADL from ' + WADL_URL + ' ...\n\nIf loading fails due to CORS restrictions, run:\n\n$ curl ' + WADL_URL + ' | xmllint --format -\n';

    box.appendChild(header);
    box.appendChild(pre);
    overlay.appendChild(box);

    closeBtn.addEventListener('click', function () { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) document.body.removeChild(overlay); });

    copyBtn.addEventListener('click', function () {
      const curlCmd = "$ curl " + WADL_URL + " | xmllint --format -";
      navigator.clipboard && navigator.clipboard.writeText(curlCmd).then(function () {
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = 'Copy curl'; }, 1500);
      }, function () {
        alert('Copy failed — select and copy manually:\n' + curlCmd);
      });
    });

    return { overlay, pre };
  }

  function showWadl() {
    const modal = createModal();
    document.body.appendChild(modal.overlay);

    fetch(WADL_URL, { method: 'GET' })
      .then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.text();
      })
      .then(function (xmlText) {
        try {
          var formatted = formatXml(xmlText);
          modal.pre.textContent = formatted;
        } catch (err) {
          modal.pre.textContent = xmlText;
        }
      }).catch(function (err) {
        console.warn('WADL fetch failed:', err);
        modal.pre.textContent = 'Could not fetch WADL from ' + WADL_URL + '\n\nThis is likely a CORS restriction in the browser.\nRun this command locally to get the formatted WADL:\n\n$ curl ' + WADL_URL + ' | xmllint --format -\n\nError: ' + err;
      });
  }

  function addButton() {
    // Avoid duplicate
    if (document.getElementById('wadl-button')) return;

    const btn = document.createElement('button');
    btn.id = 'wadl-button';
    btn.title = 'Show SSCWeb WADL (application.wadl)';
    btn.textContent = 'WADL';
    btn.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:99998;padding:10px 12px;border-radius:8px;border:none;background:#0ea5a4;color:#011627;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(14,165,164,0.18);';

    btn.addEventListener('click', showWadl);
    document.body.appendChild(btn);
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButton);
  } else addButton();
})();
