(function(){
  'use strict';
  // Default proxy URL used so fetch works from browsers: http://localhost:3000/wadl
  const DEFAULT_WADL_PROXY = 'http://localhost:3000/wadl';
  if(!window.WADL_URL) window.WADL_URL = DEFAULT_WADL_PROXY;

  // Keep last-parsed XML document here so other pages / login flow can merge into it
  let lastXmlDoc = null;

  function showLoading(){
    const el = document.getElementById('printLoading');
    if(el) el.classList.add('active');
  }
  function hideLoading(){
    const el = document.getElementById('printLoading');
    if(el) el && el.classList.remove('active');
  }

  // pretty-printer for XML Documents
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

  // Build a small JSON summary of resources/methods from a WADL-like XML
  function buildSummaryFromXml(xml){
    const summary = { resources: [] };
    // try namespace-aware first, fallback to plain tag name
    let resources = Array.from(xml.getElementsByTagNameNS('*','resource'));
    if(resources.length === 0) resources = Array.from(xml.getElementsByTagName('resource'));
    resources.forEach(r=>{
      const path = r.getAttribute('path') || r.getAttribute('href') || '';
      const methods = [];
      let methodElems = Array.from(r.getElementsByTagNameNS('*','method'));
      if(methodElems.length === 0) methodElems = Array.from(r.getElementsByTagName('method'));
      methodElems.forEach(m=>{
        methods.push({ name: m.getAttribute('name')||'', id: m.getAttribute('id')||m.getAttribute('href')||'' });
      });
      summary.resources.push({ path, methods });
    });
    // fallback: look for application > resources > resource
    if(summary.resources.length === 0){
      const resParents = Array.from(xml.getElementsByTagName('resources'));
      resParents.forEach(p=>{
        Array.from(p.childNodes).forEach(node=>{
          if(node.nodeType===1 && node.nodeName.toLowerCase().endsWith('resource')){
            const path = node.getAttribute('path')||'';
            const methods = [];
            Array.from(node.childNodes).forEach(c=>{ if(c.nodeType===1 && c.nodeName.toLowerCase().endsWith('method')) methods.push({ name: c.getAttribute('name')||'' }); });
            summary.resources.push({ path, methods });
          }
        });
      });
    }
    return summary;
  }

  // Core fetch-and-format function
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
        return xml; // still return for callers
      }
      // store the parsed document for later merges
      lastXmlDoc = xml;
      window._wadlXmlDoc = xml;

      const formatted = formatXml(xml);
      if(out) out.textContent = formatted;
      const summary = buildSummaryFromXml(xml);
      // Dispatch event with both the parsed XML string and formatted text
      try{
        window.dispatchEvent(new CustomEvent('wadlDataReady', {detail:{success:true, xmlDocument: xml, formatted: formatted, summary: summary}}));
      }catch(e){
        // some environments cannot include complex objects in event detail; fallback to text
        window.dispatchEvent(new CustomEvent('wadlDataReady', {detail:{success:true, formatted: formatted, xmlText: text, summary: summary}}));
      }
      return xml;
    }catch(err){
      if(out) out.textContent = 'Fetch/Parse error: ' + err.message + '\nIf this is a CORS issue, run locally: curl https://sscweb.gsfc.nasa.gov/WS/sscr/2/application.wadl | xmllint --format -';
      window.dispatchEvent(new CustomEvent('wadlDataReady', {detail:{success:false,error:err.message}}));
      return null;
    }finally{
      hideLoading();
    }
  }

  // Merge recognized texts (from login.html OCR) into the last parsed WADL/XML.
  // texts: string or array of strings. options: { parentXPath: string (deprecated), parentTag: string }
  async function mergeTextsIntoWadl(texts, options = {}){
    if(!texts) return { success:false, error:'no texts provided' };
    if(typeof texts === 'string') texts = [texts];

    // ensure we have a parsed doc
    if(!lastXmlDoc){
      // try to fetch first (use the configured URL)
      await fetchAndFormatWadlProxy(window.WADL_URL || DEFAULT_WADL_PROXY);
      if(!lastXmlDoc) return { success:false, error: 'failed to fetch WADL before merge' };
    }

    const xml = lastXmlDoc;
    const doc = xml; // Document

    // choose parent to attach annotations: prefer <application> or root element
    let parent = doc.getElementsByTagName('application')[0] || doc.documentElement || doc.getElementsByTagName('*')[0];
    // if user requested parentTag, try to find it
    if(options.parentTag){
      const p = doc.getElementsByTagName(options.parentTag)[0];
      if(p) parent = p;
    }

    // create or reuse a container element for user annotations
    let container = null;
    // look for existing container
    const existing = parent.getElementsByTagName('UserAnnotations');
    if(existing && existing.length) container = existing[0];
    else container = doc.createElement('UserAnnotations');

    // add each text element
    texts.forEach(t => {
      const el = doc.createElement('UserText');
      // include timestamp and optional actor
      const now = new Date().toISOString();
      el.setAttribute('timestamp', now);
      if(options.actor) el.setAttribute('actor', options.actor);
      // if text is long, wrap in CDATA for safety when serializing back to string
      try{
        // DOM supports createCDATASection
        const c = doc.createCDATASection(typeof t === 'string' ? t : JSON.stringify(t));
        el.appendChild(c);
      }catch(e){
        el.textContent = typeof t === 'string' ? t : JSON.stringify(t);
      }
      container.appendChild(el);
    });

    // attach container if newly created
    if(!existing || existing.length === 0) parent.appendChild(container);

    // update lastXmlDoc (already mutated)
    lastXmlDoc = doc;
    window._wadlXmlDoc = doc;

    // reformat and rebuild summary
    const formatted = formatXml(doc);
    const summary = buildSummaryFromXml(doc);

    // update any visible output
    const out = document.getElementById('wadlOutput');
    if(out) out.textContent = formatted;

    // dispatch events indicating merge complete
    window.dispatchEvent(new CustomEvent('wadlDataReady', { detail: { success:true, formatted, summary, merged:true } }));
    window.dispatchEvent(new CustomEvent('wadlMerged', { detail: { success:true, mergedCount: texts.length, summary } }));

    return { success:true, mergedCount: texts.length, summary };
  }

  // Expose public API
  window.fetchAndFormatWadlProxy = fetchAndFormatWadlProxy;
  window.mergeTextsIntoWadl = mergeTextsIntoWadl;
  window._getLastWadlDoc = () => lastXmlDoc;

  // auto-load on DOMContentLoaded (keeps previous behavior)
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
    setTimeout(function(){ if(loadBtn) loadBtn.click(); }, 600);
  });

})();
