import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileText, 
  RefreshCw,
  Info,
  Check
} from 'lucide-react';
import { parseExcelFile, downloadSampleTemplate } from '../services/excelService';
import { bulkUploadMembers } from '../services/memberService';
import { useToast } from './Toast';

export default function ExcelUploadModal({ isOpen, onClose, onSuccess }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (file) => {
    if (!file) return;

    // Check extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      addToast('Please select a valid Excel file (.xlsx or .xls)', 'error');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setUploadResult(null);

    const result = await parseExcelFile(file);
    setIsParsing(false);

    if (!result.success) {
      addToast(result.error || 'Failed to parse Excel file.', 'error');
      setSelectedFile(null);
      setParsedData(null);
    } else {
      setParsedData(result);
      addToast(`Parsed ${result.totalRows} rows successfully!`, 'success');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedData(null);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadToFirestore = async () => {
    if (!parsedData || !parsedData.data || parsedData.data.length === 0) {
      addToast('No data to upload.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const result = await bulkUploadMembers(parsedData.data, (progress) => {
      setUploadProgress(Math.max(10, progress));
    });

    setIsUploading(false);

    if (result.success) {
      setUploadResult(result);
      addToast(`Bulk upload complete! ${result.uploaded} members added.`, 'success');
      if (onSuccess) {
        onSuccess();
      }
    } else {
      addToast(result.error || 'Bulk upload failed.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rotary-navy to-rotary-royal px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rotary-gold/20 text-rotary-goldLight">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">
                Bulk Upload Members from Excel
              </h3>
              <p className="text-xs text-slate-300">
                Import member records into Firestore database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Instructions & Template download banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-rotary-gold flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Excel Format Requirements:</span>
                <p className="text-amber-800/90 mt-0.5">
                  Excel sheet must have 3 columns: <span className="font-semibold">Member Name</span>, <span className="font-semibold">Phone Number</span> (10 digits), and <span className="font-semibold">Member Address</span>.
                </p>
              </div>
            </div>
            <button
              onClick={downloadSampleTemplate}
              type="button"
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Upload Drop Zone (Visible when no file parsed yet or reset) */}
          {!parsedData && !uploadResult && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-rotary-gold bg-amber-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-rotary-gold/70 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rotary-navy/5 text-rotary-darkBlue flex items-center justify-center mb-3">
                <Upload className="w-7 h-7 text-rotary-royal" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                Click to browse or drag & drop Excel file
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Supports Microsoft Excel files (.xlsx, .xls)
              </p>
              {isParsing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-rotary-navy">
                  <RefreshCw className="w-4 h-4 animate-spin text-rotary-gold" />
                  <span>Reading and validating Excel rows...</span>
                </div>
              )}
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData && !uploadResult && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rotary-navy" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-xs sm:max-w-md">
                      {selectedFile?.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Total Rows: <span className="font-semibold text-slate-700">{parsedData.totalRows}</span> | Valid: <span className="font-semibold text-emerald-600">{parsedData.validRows}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isUploading}
                  className="text-xs text-slate-500 hover:text-rose-600 font-semibold transition"
                >
                  Change File
                </button>
              </div>

              {/* Data preview table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Member Name</th>
                      <th className="py-2.5 px-3">Phone (10-Digit)</th>
                      <th className="py-2.5 px-3">Member Address</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.data.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/60'}>
                        <td className="py-2 px-3 text-slate-400">{row.rowIndex}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{row.name || <span className="text-slate-400 italic">Unnamed</span>}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">
                          {row.phone ? row.phone : <span className="text-slate-400 text-[11px] italic">No mobile</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[200px]">{row.memberAddress || '—'}</td>
                        <td className="py-2 px-3 text-center">
                          {row.isValid ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Ready to upload"></span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded" title={row.validationErrors.join(', ')}>
                              Invalid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>

              {parsedData.data.length > 50 && (
                <p className="text-[11px] text-slate-400 text-center italic">
                  Showing first 50 rows of {parsedData.data.length} total records...
                </p>
              )}

              {/* Progress bar if uploading */}
              {isUploading && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Uploading to Firestore...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rotary-royal to-rotary-gold h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Complete Result Screen */}
          {uploadResult && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-in zoom-in">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xl text-slate-800">
                  Bulk Upload Completed!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Here is the summary of the import operation:
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Total Rows</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{uploadResult.total}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase">Uploaded</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">{uploadResult.uploaded}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <p className="text-[11px] font-bold text-amber-600 uppercase">Skipped</p>
                  <p className="text-xl font-black text-amber-700 mt-0.5">{uploadResult.skipped}</p>
                </div>
              </div>

              {uploadResult.skipped > 0 && uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="text-left bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs max-h-36 overflow-y-auto mt-2">
                  <p className="font-bold text-amber-900 mb-1">Skipped Records Details:</p>
                  <ul className="space-y-1 text-amber-800/90 text-[11px] list-disc list-inside">
                    {uploadResult.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>
                        Row {err.row} ({err.name || 'Unknown'} - {err.phone || 'No phone'}): {err.reason}
                      </li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <li className="italic">...and {uploadResult.errors.length - 10} more duplicate/invalid records</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          {uploadResult ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rotary-navy text-white hover:bg-rotary-darkBlue transition shadow-sm"
            >
              Close & View Directory
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200/70 transition disabled:opacity-50"
              >
                Cancel
              </button>

              {parsedData && (
                <button
                  type="button"
                  onClick={handleUploadToFirestore}
                  disabled={isUploading || parsedData.validRows === 0}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-rotary-gold via-amber-400 to-rotary-goldDark text-rotary-navy hover:brightness-105 active:scale-95 transition-all shadow-gold disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Uploading to Database...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload {parsedData.validRows} Records to Firestore</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
