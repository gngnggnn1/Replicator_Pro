import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Copy, Download, X, FileImage, Settings2, ShieldCheck, Zap, Sun, Moon } from 'lucide-react';
import JSZip from 'jszip';

interface ReplicationFile {
  original: File;
  previewUrl: string;
}

export default function App() {
  const [file, setFile] = useState<ReplicationFile | null>(null);
  const [copyCount, setCopyCount] = useState<number | ''>(5);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme management
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Memory cleanup
  useEffect(() => {
    return () => {
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    };
  }, [file]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const selectedFile = files[0];
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
    
    setFile({
      original: selectedFile,
      previewUrl: URL.createObjectURL(selectedFile),
    });
  }, [file]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const executeReplication = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const dotIndex = file.original.name.lastIndexOf('.');
      const baseName = file.original.name.substring(0, dotIndex);
      const extension = file.original.name.substring(dotIndex);
      
      const fileData = await file.original.arrayBuffer();

      // Industrial batching logic
      const count = typeof copyCount === 'number' ? copyCount : 1;
      for (let i = 1; i <= count; i++) {
        const newFileName = `${baseName}_${i}${extension}`;
        zip.file(newFileName, fileData);
        
        // Update progress every 10% or so to keep UI responsive
        if (i % Math.max(1, Math.floor(count / 10)) === 0 || i === count) {
          setProgress(Math.round((i / count) * 100));
          // Yield to let UI update
          await new Promise(r => setTimeout(r, 0));
        }
      }

      const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        // Optional: track zip compression progress
      });

      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}_replicated_x${count}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Replication failed:', error);
      alert('Failed to replicate images. Check console for details.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8">
      {/* Header Section */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">REPLICATOR PRO</h1>
          </div>
          <p className="status-label">v1.2.0 // INDUSTRIAL BATCH ENGINE</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-[#151619] border border-gray-300 dark:border-[#2A2B2F] transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
          <div className="flex items-center gap-4 bg-gray-200 dark:bg-[#151619] border border-gray-300 dark:border-[#2A2B2F] px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest">System Ready</span>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Drop & Preview */}
        <div className="lg:col-span-12">
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative h-80 hardware-card flex flex-col items-center justify-center p-8 cursor-pointer transition-all border-dashed
                  ${isDragging ? 'border-amber-500 bg-amber-500/5' : 'border-gray-300 dark:border-[#3A3B3F] hover:border-gray-400 dark:hover:border-[#4A4B4F]'}
                `}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                
                <div className="absolute top-4 left-4">
                  <Upload className="w-4 h-4 text-gray-400 dark:text-[#4A4B4F]" />
                </div>

                <motion.div
                  animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="p-6 rounded-full bg-gray-200 dark:bg-[#1A1B1E] border border-gray-300 dark:border-[#2A2B2F]">
                    <FileImage className="w-12 h-12 text-gray-400 dark:text-[#E4E3E0] opacity-30" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">Ingest Original Matrix</p>
                    <p className="text-sm text-gray-500 dark:text-[#8E9299]">Drag & Drop or Click to Load Primary Image</p>
                  </div>
                </motion.div>
                
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
                  <span className="text-[10px] text-gray-500 dark:text-[#4A4B4F] font-mono uppercase tracking-widest">Secure Local Buffer</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* File Preview Card */}
                <div className="hardware-card overflow-hidden group relative">
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                     <span className="bg-white/80 dark:bg-[#151619]/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-gray-700 dark:text-white/50 border border-gray-300 dark:border-white/10 uppercase">
                       {file.original.name}
                     </span>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    disabled={isProcessing}
                    className="absolute top-4 right-4 z-10 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <img 
                    src={file.previewUrl} 
                    alt="Original" 
                    className="w-full h-80 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  
                  <div className="p-4 bg-gray-200 dark:bg-[#1A1B1E] border-t border-gray-300 dark:border-[#2A2B2F] flex justify-between items-center">
                    <div>
                      <p className="text-xs font-mono text-gray-500 dark:text-white/40 uppercase tracking-tighter">Dimensions</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">Detected Payload</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-gray-500 dark:text-white/40 uppercase tracking-tighter">Size</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">{(file.original.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </div>

                {/* Configuration Card */}
                <div className="hardware-card p-8 flex flex-col justify-between">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-emerald-500" />
                        <h2 className="text-sm font-mono tracking-widest text-gray-500 dark:text-[#8E9299] uppercase">Replication Parameters</h2>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs text-[#4A4B4F] uppercase font-bold">Copy Count</label>
                            <input 
                              type="number"
                              min="1"
                              value={copyCount}
                              disabled={isProcessing}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCopyCount(val === '' ? '' : Math.max(1, parseInt(val)));
                              }}
                              className="w-24 bg-transparent text-right text-2xl font-mono text-emerald-500 underline decoration-emerald-500/30 underline-offset-4 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="1000" 
                            value={copyCount === '' ? 1 : Math.min(1000, copyCount)}
                            disabled={isProcessing}
                            onChange={(e) => setCopyCount(parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-300 dark:bg-[#2A2B2F] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                          <div className="flex justify-between text-[10px] text-gray-500 dark:text-[#4A4B4F] font-mono">
                            <span>001</span>
                            <span>PRECISION SCALE</span>
                            <span>1000+</span>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-200 dark:bg-[#1A1B1E] rounded-lg border border-gray-300 dark:border-[#2A2B2F] space-y-2">
                           <p className="status-label">Output Preview</p>
                           <div className="flex flex-wrap gap-2">
                              <span className="text-[10px] font-mono text-gray-500 dark:text-white/30 bg-gray-300 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-400 dark:border-white/10">...{file.original.name.split('.').pop()}</span>
                              <span className="text-[10px] font-mono text-gray-500 dark:text-white/60">→</span>
                              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-500/80">file_1.ext, file_2.ext ... file_{copyCount || 1}.ext</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono text-gray-500 dark:text-[#8E9299]">
                          <span>CALCULATING DELTA</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-300 dark:bg-[#1A1B1E] rounded-full overflow-hidden border border-gray-300 dark:border-[#2A2B2F]">
                          <motion.div 
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={executeReplication}
                      disabled={isProcessing}
                      className={`
                        w-full group relative overflow-hidden flex items-center justify-center gap-3 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all
                        ${isProcessing 
                          ? 'bg-gray-200 dark:bg-[#1A1B1E] text-gray-500 dark:text-[#4A4B4F] cursor-wait' 
                          : 'bg-emerald-500 text-white hover:bg-emerald-400 active:scale-[0.98] shadow-lg shadow-emerald-500/20'}
                      `}
                    >
                      {isProcessing ? (
                        <>Processing Infrastructure...</>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Initialize Cascade Replication
                          <Download className="w-4 h-4 ml-2 opacity-30" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="pt-12 border-t border-gray-300 dark:border-[#2A2B2F] grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <p className="status-label">System Integrity</p>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-[#4A4B4F]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Memory Optimized Engine</span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="status-label">Buffer Capacity</p>
          <p className="text-[10px] text-gray-500 dark:text-[#4A4B4F]">Secure, non-persistent browser-based processing</p>
        </div>
        <div className="space-y-2 md:text-right">
          <p className="status-label">Developer Console</p>
          <p className="text-[10px] text-gray-500 dark:text-[#4A4B4F]">Replication Factor: λ {copyCount || 1}</p>
        </div>
      </footer>
    </div>
  );
}
