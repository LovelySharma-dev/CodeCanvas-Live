import React, { useState, useEffect } from 'react';
import { RotateCw, Terminal, Monitor, AlertCircle, XCircle, Info } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function LivePreview() {
  const { files, activeFile } = useWorkspace();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'console'
  const [srcDoc, setSrcDoc] = useState('');

  // Function to resolve HTML with linked JS and CSS files dynamically
  const buildBundledDoc = (fileList) => {
    if (!fileList || fileList.length === 0) {
      return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#64748b;padding:16px;">No files in workspace</body></html>`;
    }

    // Find active HTML file or index.html
    let htmlFile = null;
    if (activeFile && activeFile.name.endsWith('.html')) {
      htmlFile = activeFile;
    } else {
      htmlFile = fileList.find(f => f.name === 'index.html' || f.language === 'html') || fileList[0];
    }

    let htmlContent = htmlFile ? htmlFile.content : '<h1 style="font-family:sans-serif;">CodeCanvas Live Studio</h1>';
    const cssContent = fileList.find(f => f.name === 'style.css' || f.language === 'css')?.content || '';

    // Replace linked stylesheet <link rel="stylesheet" href="style.css"> or inject CSS
    if (/<link[^>]*href=["']\/?(?:\.\/)?style\.css["'][^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(
        /<link[^>]*href=["']\/?(?:\.\/)?style\.css["'][^>]*>/i,
        `<style>\n${cssContent}\n</style>`
      );
    } else if (cssContent && !htmlContent.includes('<style>')) {
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `<style>\n${cssContent}\n</style></head>`);
      } else {
        htmlContent = `<style>\n${cssContent}\n</style>` + htmlContent;
      }
    }

    // Strip out unmatched external stylesheet link tags
    htmlContent = htmlContent.replace(/<link\s+rel=["']stylesheet["']\s+href=["'][^"']+["']\s*\/?>/gi, '');

    // Replace linked JS scripts <script src="script.js"></script>
    htmlContent = htmlContent.replace(
      /<script[^>]*src=["']\/?(.*?)["'][^>]*><\/script>/gi,
      (match, scriptPath) => {
        const fileName = scriptPath.replace(/^\.?\//, '');
        const matchedFile = fileList.find(f => f.name === fileName);
        if (matchedFile) {
          return `<script>\ntry {\n${matchedFile.content}\n} catch(err) { console.error(err); }\n</script>`;
        }
        return '';
      }
    );

    // Forward console logs to editor console panel
    const consoleBridge = `
      <script>
        (function() {
          const _log = console.log;
          const _error = console.error;
          const _warn = console.warn;
          console.log = function(...args) {
            try { window.parent.postMessage({ type: 'CONSOLE_LOG', log: args.join(' ') }, '*'); } catch(e){}
            _log.apply(console, args);
          };
          console.error = function(...args) {
            try { window.parent.postMessage({ type: 'CONSOLE_ERROR', log: args.join(' ') }, '*'); } catch(e){}
            _error.apply(console, args);
          };
          console.warn = function(...args) {
            try { window.parent.postMessage({ type: 'CONSOLE_WARN', log: args.join(' ') }, '*'); } catch(e){}
            _warn.apply(console, args);
          };
          window.onerror = function(msg, url, line) {
            try { window.parent.postMessage({ type: 'CONSOLE_ERROR', log: 'Error: ' + msg + ' (line ' + line + ')' }, '*'); } catch(e){}
          };
        })();
      </script>
    `;

    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${consoleBridge}</body>`);
    } else {
      return htmlContent + consoleBridge;
    }
  };

  // Update srcDoc state reactively when files change
  useEffect(() => {
    if (autoRefresh) {
      setSrcDoc(buildBundledDoc(files));
    }
  }, [files, activeFile, autoRefresh]);

  // Initial mount effect
  useEffect(() => {
    setSrcDoc(buildBundledDoc(files));
  }, []);

  // Handle postMessages for console output
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data) {
        if (e.data.type === 'CONSOLE_LOG') {
          setLogs(prev => [...prev.slice(-99), { id: Math.random().toString(), type: 'log', message: e.data.log, timestamp: new Date().toLocaleTimeString() }]);
        } else if (e.data.type === 'CONSOLE_ERROR') {
          setLogs(prev => [...prev.slice(-99), { id: Math.random().toString(), type: 'error', message: e.data.log, timestamp: new Date().toLocaleTimeString() }]);
        } else if (e.data.type === 'CONSOLE_WARN') {
          setLogs(prev => [...prev.slice(-99), { id: Math.random().toString(), type: 'warn', message: e.data.log, timestamp: new Date().toLocaleTimeString() }]);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleManualRefresh = () => {
    setSrcDoc(buildBundledDoc(files));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas-bg border-l border-canvas-border overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-canvas-panel border-b border-canvas-border text-xs text-slate-400 select-none">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors ${
              activeTab === 'preview' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-colors relative ${
              activeTab === 'console' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' : 'hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console</span>
            {logs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-brand-primary text-canvas-bg text-[10px] font-bold">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-brand-primary focus:ring-brand-primary w-3.5 h-3.5"
            />
            <span>Auto Hot-Reload</span>
          </label>

          <button
            onClick={handleManualRefresh}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Preview"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 relative bg-white">
        {activeTab === 'preview' ? (
          <iframe
            title="Live Preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-same-origin allow-modals"
            className="w-full h-full border-none bg-white"
          />
        ) : (
          <div className="w-full h-full bg-canvas-bg p-4 font-mono text-xs overflow-y-auto space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-canvas-border text-slate-400">
              <span>Console Output</span>
              <button
                onClick={() => setLogs([])}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Clear Console
              </button>
            </div>

            {logs.length === 0 ? (
              <p className="text-slate-600 italic py-4">No console output yet...</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-2 font-mono">
                  <span className="text-slate-600 text-[10px] select-none">{log.timestamp}</span>
                  {log.type === 'error' && <XCircle className="w-3.5 h-3.5 text-brand-coral mt-0.5 shrink-0" />}
                  {log.type === 'warn' && <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />}
                  {log.type === 'log' && <Info className="w-3.5 h-3.5 text-brand-sky mt-0.5 shrink-0" />}
                  <span className={`break-all ${
                    log.type === 'error' ? 'text-rose-300' : log.type === 'warn' ? 'text-amber-300' : 'text-slate-200'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
