import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Share2,
  Eye,
  Table2,
} from 'lucide-react';
import type { ExcelPreviewSheet } from '../utils/excelExport';
import { useToast } from './NotificationContext';

export interface DownloadedReportFile {
  kind: 'pdf' | 'excel';
  fileName: string;
  blob: Blob;
  blobUrl: string;
  sizeBytes: number;
  sheets?: ExcelPreviewSheet[];
}

export function formatReportFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function canShareReportFile(file: DownloadedReportFile): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') return false;
  try {
    const mime =
      file.kind === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const testFile = new File([file.blob], file.fileName, { type: mime });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

export async function shareOrOpenReportFile(file: DownloadedReportFile): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  const mime =
    file.kind === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const shareFile = new File([file.blob], file.fileName, { type: mime });
  await navigator.share({
    files: [shareFile],
    title: file.fileName,
  });
  return true;
}

function columnIndexToLetter(idx: number): string {
  let num = idx + 1;
  let col = '';
  while (num > 0) {
    const rem = (num - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
}

interface DownloadedReportViewerModalProps {
  file: DownloadedReportFile | null;
  onClose: () => void;
  onOpenA4Preview?: () => void;
}

export const DownloadedReportViewerModal: React.FC<DownloadedReportViewerModalProps> = ({
  file,
  onClose,
  onOpenA4Preview,
}) => {
  const toast = useToast();
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);

  useEffect(() => {
    setActiveSheetIdx(0);
  }, [file?.fileName, file?.blobUrl]);

  const supportsFileShare = useMemo(() => (file ? canShareReportFile(file) : false), [file]);

  if (!file) return null;

  const isExcel = file.kind === 'excel';
  const sheets = file.sheets || [];
  const activeSheet = sheets[activeSheetIdx] || sheets[0];

  const maxCols = activeSheet
    ? activeSheet.rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0)
    : 0;

  const handleOpenExternalApp = async () => {
    try {
      await shareOrOpenReportFile(file);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.warning('Perangkat tidak mendukung pembukaan langsung ke aplikasi eksternal.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[92vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div className="bg-[#800000] px-3.5 py-3 sm:px-4 flex flex-wrap items-center justify-between gap-2 border-b border-red-950/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              {isExcel ? (
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
              ) : (
                <FileText className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-black text-white truncate">
                {file.fileName}
              </h2>
              <p className="text-[11px] text-red-100/90">
                {isExcel ? 'Spreadsheet Excel (.xlsx)' : 'Dokumen PDF (.pdf)'} •{' '}
                {formatReportFileSize(file.sizeBytes)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {!isExcel && (
              <a
                href={file.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
                title="Buka berkas PDF di tab browser baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab</span>
              </a>
            )}

            {supportsFileShare && (
              <button
                type="button"
                onClick={handleOpenExternalApp}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                title="Buka atau bagikan ke aplikasi PDF / Excel / WhatsApp di perangkat"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Buka di App</span>
              </button>
            )}

            <a
              href={file.blobUrl}
              download={file.fileName}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
              title="Unduh ulang berkas ke perangkat"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Ulang</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        {isExcel ? (
          <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-900">
            {/* Sheet Tabs */}
            {sheets.length > 0 && (
              <div className="bg-slate-100 border-b border-slate-200 px-3 pt-2 flex items-center gap-1.5 overflow-x-auto shrink-0">
                <Table2 className="w-4 h-4 text-emerald-700 shrink-0 mr-1 mb-1.5" />
                {sheets.map((sheet, idx) => {
                  const isActive = idx === activeSheetIdx;
                  return (
                    <button
                      key={sheet.name}
                      type="button"
                      onClick={() => setActiveSheetIdx(idx)}
                      className={`px-3 py-1.5 rounded-t-lg text-xs font-bold whitespace-nowrap transition border border-b-0 cursor-pointer ${
                        isActive
                          ? 'bg-white text-emerald-800 border-slate-300 shadow-2xs font-black'
                          : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
                      }`}
                    >
                      {sheet.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Spreadsheet Grid */}
            <div className="flex-1 overflow-auto bg-slate-50">
              {!activeSheet || activeSheet.rows.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 p-8">
                  Sheet ini tidak memiliki data.
                </div>
              ) : (
                <table className="min-w-full border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-200 text-slate-700">
                    <tr>
                      <th className="w-10 min-w-10 px-2 py-1.5 border border-slate-300 bg-slate-200 text-center font-mono text-[10px] text-slate-500 sticky left-0 z-20">
                        #
                      </th>
                      {Array.from({ length: maxCols }).map((_, cIdx) => (
                        <th
                          key={cIdx}
                          className="px-3 py-1.5 border border-slate-300 text-center font-mono text-[10px] font-bold text-slate-600 min-w-[110px]"
                        >
                          {columnIndexToLetter(cIdx)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSheet.rows.map((row, rIdx) => {
                      const isTitleOrHeaderRow =
                        rIdx === 0 ||
                        (row.length > 1 &&
                          typeof row[0] === 'string' &&
                          row[0] === row[0].toUpperCase() &&
                          /[A-Z]/.test(row[0]));

                      return (
                        <tr
                          key={rIdx}
                          className={
                            isTitleOrHeaderRow
                              ? 'bg-emerald-50/80 font-bold text-slate-900'
                              : rIdx % 2 === 0
                              ? 'bg-white'
                              : 'bg-slate-50/70'
                          }
                        >
                          <td className="px-2 py-1.5 border border-slate-200 bg-slate-100 text-center font-mono text-[10px] text-slate-500 sticky left-0">
                            {rIdx + 1}
                          </td>
                          {Array.from({ length: maxCols }).map((_, cIdx) => {
                            const val = row[cIdx];
                            const isNum = typeof val === 'number';
                            return (
                              <td
                                key={cIdx}
                                className={`px-3 py-1.5 border border-slate-200 whitespace-nowrap ${
                                  isNum ? 'text-right font-mono tabular-nums text-slate-900' : 'text-left text-slate-800'
                                }`}
                              >
                                {isNum ? val.toLocaleString('id-ID') : String(val ?? '')}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
            <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 shrink-0">
              <span>
                Menampilkan berkas PDF yang baru diunduh. Jika layar PDF kosong di browser HP, gunakan tombol{' '}
                <strong className="text-amber-300">Buka di Tab</strong>
                {supportsFileShare ? ' atau Buka di App' : ''}.
              </span>
              {onOpenA4Preview && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenA4Preview();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau Cetak A4</span>
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 relative bg-slate-800">
              <object
                data={file.blobUrl}
                type="application/pdf"
                className="w-full h-full block"
                aria-label={file.fileName}
              >
                <iframe
                  src={file.blobUrl}
                  title={file.fileName}
                  className="w-full h-full border-0 bg-white"
                />
              </object>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-400 shrink-0">
          <span className="truncate">
            File juga tersimpan di folder Download perangkat Anda ({file.fileName}).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
