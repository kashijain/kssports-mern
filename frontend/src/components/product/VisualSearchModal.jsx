import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, UploadCloud, X, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { useProductStore } from '../../store/useStore';
import toast from 'react-hot-toast';

const loadingTexts = [
  'Uploading image...',
  'Initializing CLIP model...',
  'Analyzing visual patterns...',
  'Extracting feature embeddings...',
  'Comparing against product catalog...',
  'Sorting by similarity scores...',
  'Finalizing matches...'
];

const VisualSearchModal = ({ isOpen, onClose, file }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const fileInputRef = useRef(null);

  const { searchProductsByVisual, visualSearchLoading, error } = useProductStore();

  // Handle files passed as props from the Navbar camera click
  useEffect(() => {
    if (isOpen && file) {
      processFile(file);
    }
  }, [isOpen, file]);

  // Reset states on open/close
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen]);

  // Loading text cycling effect
  useEffect(() => {
    let interval;
    if (visualSearchLoading) {
      setLoadingTextIndex(0);
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [visualSearchLoading]);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  const processFile = async (file) => {
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format not supported. Please upload JPG, PNG, WEBP or AVIF.');
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      await searchProductsByVisual(file);
      toast.success('Visual search completed!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to complete visual search.');
      setSelectedFile(null);
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleSearchSubmit = async () => {
    if (!selectedFile) return;

    try {
      await searchProductsByVisual(selectedFile);
      toast.success('Visual search completed!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to complete visual search.');
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={visualSearchLoading ? null : onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#11151d] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.85)] md:p-8"
        >
          {/* Top light beam decoration */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
          <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-primary-600/10 blur-[60px]" />

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={visualSearchLoading}
            className="absolute right-5 top-5 rounded-full border border-white/5 bg-white/[0.04] p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <X size={18} />
          </button>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/5 text-primary-500">
              <Camera size={26} />
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              Visual Product Search
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Upload an image of a sports gear to find the exact match or visually similar alternatives.
            </p>
          </div>

          <div className="mt-8">
            {visualSearchLoading ? (
              /* Loading view */
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  {/* Rotating loader ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent"
                  />
                  <Sparkles size={24} className="animate-pulse text-primary-400" />
                </div>
                
                <h4 className="mt-6 text-base font-bold text-white transition-all duration-300">
                  {loadingTexts[loadingTextIndex]}
                </h4>
                <p className="mt-2 text-xs text-slate-500 max-w-[280px]">
                  Our CLIP vision engine is extracting visual features and scanning the sports catalog.
                </p>
              </div>
            ) : previewUrl ? (
              /* Image preview view */
              <div className="flex flex-col items-center">
                <div className="relative aspect-square w-full max-h-[260px] overflow-hidden rounded-3xl border border-white/10 bg-[#0a0d13]">
                  <img
                    src={previewUrl}
                    alt="Search preview"
                    className="h-full w-full object-contain"
                  />
                  <button
                    onClick={clearSelectedFile}
                    className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-slate-300 backdrop-blur-sm transition-all hover:bg-red-600 hover:text-white"
                  >
                    <RefreshCw size={12} /> Replace
                  </button>
                </div>

                <div className="mt-6 flex w-full gap-4">
                  <button
                    onClick={clearSelectedFile}
                    className="btn-secondary w-full justify-center border-white/5 bg-white/[0.04] text-slate-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSearchSubmit}
                    className="btn-primary w-full justify-center"
                  >
                    <Sparkles size={16} /> Search Similar
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Area */
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-primary-500 bg-primary-500/5'
                    : 'border-white/10 bg-white/[0.02] hover:border-primary-500/40 hover:bg-white/[0.04]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] text-slate-400 transition-colors group-hover:text-white">
                  <UploadCloud size={28} className="text-slate-400" />
                </div>

                <p className="text-base font-bold text-white">
                  Drag and drop your image here
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  or click to browse from device folder
                </p>
                <p className="mt-4 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Supports JPG, PNG, WEBP, AVIF (Max 5MB)
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VisualSearchModal;
