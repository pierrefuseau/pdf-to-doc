import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons';

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesAdded }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (files) {
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      if (pdfFiles.length > 0) {
        onFilesAdded(pdfFiles);
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [onFilesAdded]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={`p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${isDragActive ? 'border-sky-400 bg-sky-900/50' : 'border-slate-600 hover:border-sky-500 hover:bg-slate-800/50'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center justify-center text-center text-slate-400">
        <UploadIcon className={`w-12 h-12 mb-4 transition-colors duration-300 ${isDragActive ? 'text-sky-400' : 'text-slate-500'}`} />
        <p className="font-semibold text-slate-300">
          <span className="text-sky-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-sm mt-1">PDF files only</p>
      </div>
    </div>
  );
};

export default FileDropzone;
