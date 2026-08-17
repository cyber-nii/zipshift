"use client";

import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { 
  FolderArchive, 
  UploadCloud, 
  Store, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  FileText,
  Play,
  X,
  ShieldCheck
} from "lucide-react";
import { groupFiles, groupFilesByDateRange, FileGroup } from "../utils/zipper";

export default function Portal() {
  const [mode, setMode] = useState<"merchant" | "bank">("merchant");
  const [files, setFiles] = useState<File[]>([]);
  const [groups, setGroups] = useState<FileGroup[]>([]);
  const [invalidFiles, setInvalidFiles] = useState<{ file: File; error: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zipStatuses, setZipStatuses] = useState<Record<string, "pending" | "zipping" | "success" | "error">>({});
  const [progress, setProgress] = useState(0);
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync groups when mode, uploaded files, or date range settings change
  useEffect(() => {
    if (rangeMode) {
      if (!rangeStart || !rangeEnd) {
        setGroups([]);
        setInvalidFiles([]);
        setZipStatuses({});
        setProgress(0);
        return;
      }
      // Parse as local dates (not UTC) so the range matches the calendar day picked
      const [sy, sm, sd] = rangeStart.split("-").map(Number);
      const [ey, em, ed] = rangeEnd.split("-").map(Number);
      const startDate = new Date(sy, sm - 1, sd);
      const endDate = new Date(ey, em - 1, ed);

      const { groups: newGroups, invalidFiles: newInvalids } = groupFilesByDateRange(files, mode, startDate, endDate);
      setGroups(newGroups);
      setInvalidFiles(newInvalids);

      const initialStatuses: Record<string, "pending"> = {};
      newGroups.forEach(g => {
        initialStatuses[g.targetZipName] = "pending";
      });
      setZipStatuses(initialStatuses);
      setProgress(0);
    } else {
      const { groups: newGroups, invalidFiles: newInvalids } = groupFiles(files, mode);
      setGroups(newGroups);
      setInvalidFiles(newInvalids);

      const initialStatuses: Record<string, "pending"> = {};
      newGroups.forEach(g => {
        initialStatuses[g.targetZipName] = "pending";
      });
      setZipStatuses(initialStatuses);
      setProgress(0);
    }
  }, [files, mode, rangeMode, rangeStart, rangeEnd]);

  // Apply theme data attribute to body
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
      // Reset input value to allow selecting same file again
      e.target.value = "";
    }
  };

  const addFiles = (newFiles: File[]) => {
    setFiles(prev => {
      // Filter out duplicate files by name and size to prevent double-adding
      const uniqueNewFiles = newFiles.filter(
        nf => !prev.some(pf => pf.name === nf.name && pf.size === nf.size)
      );
      return [...prev, ...uniqueNewFiles];
    });
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f !== fileToRemove));
  };

  const handleClearAll = () => {
    setFiles([]);
    setGroups([]);
    setInvalidFiles([]);
    setZipStatuses({});
    setProgress(0);
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Helper to format file size in human-readable string
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Sequential ZIP compression and download
  const handleGenerateZips = async () => {
    if (groups.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    setProgress(0);

    let completedCount = 0;
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const zipName = group.targetZipName;
      
      setZipStatuses(prev => ({ ...prev, [zipName]: "zipping" }));
      
      try {
        const zip = new JSZip();
        
        // Add each file to the zip
        for (const file of group.files) {
          zip.file(file.name, file);
        }
        
        // Generate Zip Blob
        const blob = await zip.generateAsync({ 
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 5 }
        });
        
        // Download Zip
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = zipName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setZipStatuses(prev => ({ ...prev, [zipName]: "success" }));
      } catch (err) {
        console.error(`Failed to generate ZIP for ${zipName}:`, err);
        setZipStatuses(prev => ({ ...prev, [zipName]: "error" }));
      }
      
      completedCount++;
      setProgress(Math.round((completedCount / groups.length) * 100));
    }
    
    setIsProcessing(false);
  };

  return (
    <main className="app-container">
      {/* Top Navbar */}
      <header className="app-header">
        <div className="brand">
          <FolderArchive className="brand-icon" />
          <h1 className="brand-title">
            Zip<span className="brand-highlight">Shift</span>
          </h1>
        </div>
        <div className="header-right">
          <div className="secure-badge" title="All file processing is done locally in your browser. No files are ever sent to a server.">
            <ShieldCheck className="secure-badge-icon" />
            100% Secure Client-Side
          </div>
          <nav className="nav-switcher">
            <button 
              className={`nav-tab ${mode === "merchant" ? "active" : ""}`}
              onClick={() => { if (!isProcessing) setMode("merchant"); }}
              disabled={isProcessing}
            >
              <Store size={16} />
              Merchants Portal
            </button>
            <button 
              className={`nav-tab ${mode === "bank" ? "active" : ""}`}
              onClick={() => { if (!isProcessing) setMode("bank"); }}
              disabled={isProcessing}
            >
              <Building2 size={16} />
              Banks Portal
            </button>
          </nav>
        </div>
      </header>

      {/* Main Work Area */}
      <div className="app-grid">
        {/* Left Side: Drag & Drop Zone and Controls */}
        <section className="panel">
          <h2 className="panel-title">
            <UploadCloud size={20} className="text-secondary" />
            Upload Files
          </h2>
          
          <div 
            className={`dropzone ${isDragging ? "drag-active" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerUploadClick}
          >
            <UploadCloud className="dropzone-icon" />
            <p className="dropzone-title">Drag & drop files here, or click to browse</p>
            <p className="dropzone-desc">
              {mode === "merchant" 
                ? "Upload 6-digit merchant files (e.g., 700029_..._27052026.csv)"
                : "Upload 3-digit bank files (e.g., 905_..._27052026.csv)"}
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              className="file-input"
              multiple
              onChange={handleFileSelect}
              accept=".csv,.pdf"
              disabled={isProcessing}
            />
          </div>

          {/* Date Range Compile Mode */}
          <div className="range-mode-box">
            <label className="range-toggle">
              <input
                type="checkbox"
                checked={rangeMode}
                onChange={(e) => setRangeMode(e.target.checked)}
                disabled={isProcessing}
              />
              <span>Compile a date range into one file (e.g. Friday–Sunday)</span>
            </label>

            {rangeMode && (
              <div className="range-inputs">
                <div className="range-input-field">
                  <label htmlFor="range-start">From</label>
                  <input
                    id="range-start"
                    type="date"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="range-input-field">
                  <label htmlFor="range-end">To</label>
                  <input
                    id="range-end"
                    type="date"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Validation Warnings */}
          {invalidFiles.length > 0 && (
            <div className="alert alert-warning">
              <AlertTriangle className="alert-icon" />
              <div>
                <p className="alert-title">
                  Ignored {invalidFiles.length} file{invalidFiles.length > 1 ? "s" : ""} (Incorrect format for {mode === "merchant" ? "Merchant" : "Bank"} mode):
                </p>
                <ul className="alert-list">
                  {invalidFiles.slice(0, 5).map((inv, idx) => (
                    <li key={idx} className="alert-list-item">
                      <strong>{inv.file.name}</strong>: {inv.error}
                    </li>
                  ))}
                  {invalidFiles.length > 5 && (
                    <li>...and {invalidFiles.length - 5} more files</li>
                  )}
                </ul>
                <p className="alert-suggestion">
                  Switch to the other portal tab if you are processing the other type of files.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {files.length > 0 && (
            <div className="dashboard-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleGenerateZips}
                disabled={isProcessing || groups.length === 0}
              >
                <Play size={16} />
                {isProcessing ? "Processing..." : `Zip and Download (${groups.length} Package${groups.length > 1 ? "s" : ""})`}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleClearAll}
                disabled={isProcessing}
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
          )}
        </section>

        {/* Right Side: ZIP Packages Preview */}
        <section className="panel package-panel">
          <div className="panel-header-wrapper">
            <h2 className="panel-title">
              <FolderArchive size={20} className="text-secondary" />
              ZIP Packages ({groups.length})
            </h2>
            {isProcessing && (
              <span className="panel-header-percentage">
                {progress}%
              </span>
            )}
          </div>

          {isProcessing && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          {groups.length === 0 ? (
            <div className="empty-state">
              <FolderArchive className="empty-state-icon" />
              <p className="empty-state-title">No packages to display</p>
              <p className="empty-state-desc">
                {rangeMode && (!rangeStart || !rangeEnd)
                  ? "Pick a From and To date on the left to compile files in that range into one zip per prefix."
                  : "Upload files on the left. They will be parsed, dated back 1 day, and grouped by prefix."}
              </p>
            </div>
          ) : (
            <div className="packages-list">
              {groups.map((group) => {
                const status = zipStatuses[group.targetZipName] || "pending";
                
                return (
                  <div key={group.targetZipName} className="package-card">
                    {/* Package Card Header */}
                    <div className="package-header">
                      <div className="package-info">
                        <span className="package-title">
                          <FolderArchive size={16} className="text-secondary" />
                          {group.targetZipName}
                        </span>
                        <span className="package-meta">
                          Contains {group.files.length} file{group.files.length > 1 ? "s" : ""} | Original date suffix: {group.originalDateStr}
                        </span>
                      </div>
                      
                      {status === "pending" && (
                        <span className="package-status status-pending">Pending</span>
                      )}
                      {status === "zipping" && (
                        <span className="package-status status-zipping">Zipping...</span>
                      )}
                      {status === "success" && (
                        <span className="package-status status-success">
                          <CheckCircle2 size={12} />
                          Zipped
                        </span>
                      )}
                    </div>
                    
                    {/* Package Card Files Table */}
                    <table className="package-files-table">
                      <thead>
                        <tr>
                          <th>File Name (Keeps Date)</th>
                          <th className="file-size-cell">Size</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.files.map((file, idx) => (
                          <tr key={idx}>
                            <td className="file-name-cell">
                              <span className="file-name-wrapper">
                                <FileText size={12} className="file-icon" />
                                {file.name}
                              </span>
                            </td>
                            <td className="file-size-cell">{formatBytes(file.size)}</td>
                            <td className="file-action-cell">
                              <button 
                                onClick={() => handleRemoveFile(file)}
                                className="btn-remove-file"
                                disabled={isProcessing}
                                title="Remove file"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <footer className="app-footer">
        <p>ZipShift — High Performance File Zipping Utility. 100% Secure & Client-Side. Zips are generated on-the-fly in your browser.</p>
      </footer>
    </main>
  );
}
