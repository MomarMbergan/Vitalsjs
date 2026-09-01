(function(){
  'use strict';
  // Default proxy URL used so fetch works from browsers: http://localhost:3000/wadl
  const DEFAULT_WADL_PROXY = 'http://localhost:3000/wadl';
  if(!window.WADL_URL) window.WADL_URL = DEFAULT_WADL_PROXY;

  function showLoading(){
    const el = document.getElementById('printLoading');
    if(el) el.classList.add('active');
  }
  function hideLoading(){
    const el = document.getElementById('printLoading');
    if(el) el && el.classList.remove('active');
  }

  function buildSummaryFromXml(xml){
    const summary = { resources: [] };
    // find all resource elements regardless of namespace
    let resources = Array.from(xml.getElementsByTagNameNS('*', 'resource'));
    // fallback: elements named 'resource' without namespace
    if(resources.length === 0) {
      resources = Array.from(xml.getElementsByTagName('resource'));
    }
    resources.forEach(r => {
      const path = r.getAttribute('path') || r.getAttribute('href') || '';
      const methods = [];
      // method elements can be direct children
      let methodElems = Array.from(r.getElementsByTagNameNS('*','method'));
      if(methodElems.length === 0) methodElems = Array.from(r.getElementsByTagName('method'));
      methodElems.forEach(m => {
        const name = m.getAttribute('name') || '';
        const id = m.getAttribute('id') || m.getAttribute('href') || '';
        methods.push({ name, id });
      });
      summary.resources.push({ path, methods });
    });
    // If none found, try parsing WADL style: application > resources > resource
    if(summary.resources.length === 0){
      try{
        const resParents = Array.from(xml.getElementsByTagName('resources'));
        for(let p of resParents){
          for(let i=0;i<p.childNodes.length;i++){
            const node = p.childNodes[i];
            if(node.nodeType === 1 && node.nodeName.toLowerCase().endsWith('resource')){
              const path = node.getAttribute('path') || '';
              const methods = [];
              Array.from(node.childNodes).forEach(c => {
                if(c.nodeType === 1 && c.nodeName.toLowerCase().endsWith('method')){
                  methods.push({ name: c.getAttribute('name')||''});
                }
              });
              summary.resources.push({ path, methods });
            }
          }
        }
      }catch(e){/* ignore */}
    }
    return summary;
  }

  async function fetchAndFormatWadlProxy(url){
    const out = document.getElementById('wadlOutput');
    if(out) out.textContent = 'Loading...';
    showLoading();
    try{
      const res = await fetch(url, {cache: 'no-store'});
      if(!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'application/xml');
      const pe = xml.querySelector('parsererror');
      if(pe){
        if(out) out.textContent = 'XML parse error:\n' + pe.textContent;
        window.dispatchEvent(new CustomEvent('wadlDataReady', {detail:{success:false,error:pe.textContent}}));
        return;
      }
      function formatXml(node, level=0){
        let indent = '  '.repeat(level), txt='';
        if(node.nodeType === 9){
          for(let i=0;i<node.childNodes.length;i++) txt += formatXml(node.childNodes[i], level);
          return txt;
        }
        if(node.nodeType === 1){
          txt += indent + '<' + node.nodeName;
          for(let i=0;i<node.attributes.length;i++){
            let a = node.attributes[i];
            txt += ' ' + a.name + '="' + a.value.replace(/"/g, '&quot;') + '"';
          }
          txt += '>';
          if(node.childNodes.length === 0){
            txt += '</' + node.nodeName + '>\n';
          } else {
            let hasElement = false;
            for(let i=0;i<node.childNodes.length;i++) if(node.childNodes[i].nodeType === 1) hasElement = true;
            if(hasElement){
              txt += '\n';
              for(let i=0;i<node.childNodes.length;i++) txt += formatXml(node.childNodes[i], level+1);
              txt += indent + '</' + node.nodeName + '>\n';
            } else {
              let textContent = node.textContent.trim();
              txt += (textContent? textContent : '') + '</' + node.nodeName + '>\n';
            }
          }
          return txt;
        }
        if(node.nodeType === 3){
          let s = node.nodeValue.trim();
          if(!s) return '';
          return indent + s + '\n';
        }
        return '';
      }
      const formatted = formatXml(xml);
      if(out) out.textContent = formatted;
      const summary = buildSummaryFromXml(xml);
      // Dispatch custom event with parsed/formatted summary
      window.dispatchEvent(new CustomEvent('wadlDataReady', {detail:{success:true, formatted:formatted, summary:summary}}));
    }catch(err){
      if(out) out.textContent = 'Fetch/Parse error: ' + err.message + '\nIf this is a CORS issue, run locally: curl https://sscweb.gsfc.nasa.gov/WS/sscr/2/application.wadl | xmllint --format -';
      window.dispatchEvent(new CustomEvent('wadlDataReady', {detail:{success:false,error:err.message}}));
    }finally{
      hideLoading();
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    const loadBtn = document.getElementById('loadWadl');
    const clearBtn = document.getElementById('clearWadl');
    const defaultUrl = window.WADL_URL || DEFAULT_WADL_PROXY;
    if(loadBtn){
      loadBtn.addEventListener('click', function(){ fetchAndFormatWadlProxy(defaultUrl); });
    }
    if(clearBtn){
      clearBtn.addEventListener('click', function(){ const out=document.getElementById('wadlOutput'); if(out) out.textContent='WADL output will appear here.'; });
    }
    // auto-load once after a short delay so pages show WADL automatically
    setTimeout(function(){ if(loadBtn) loadBtn.click(); else fetchAndFormatWadlProxy(defaultUrl); }, 600);
  });

  window.fetchAndFormatWadlProxy = fetchAndFormatWadlProxy;
})();
