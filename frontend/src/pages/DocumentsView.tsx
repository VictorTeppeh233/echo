import React, { useState, useRef } from 'react';
import {
  FileText, Upload, Trash2,
  AlertCircle, File, Layers
} from 'lucide-react';
import { DocumentItem, Persona } from '../types';
import { api } from '../services/api';

interface DocumentsViewProps {
  documents: DocumentItem[];
  activePersona: Persona | null;
  onRefresh: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  activePersona,
  onRefresh
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      await api.uploadDocument(file, activePersona?.id);
      onRefresh();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'File ingestion failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document and its embeddings?')) return;
    try {
      await api.deleteDocument(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete doc:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#000000] font-apple">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-2 border-b border-white/[0.06]">
          <div className="text-[12px] font-medium tracking-wider uppercase text-[#86868b]">
            Knowledge Ingestion
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f5f5f7] mt-0.5">
            Document Vault
          </h1>
          <p className="text-sm text-[#86868b] mt-1">
            Upload career roadmaps, notes, journals, or guides. Chunked and indexed locally into ChromaDB.
          </p>
        </div>

        {/* Upload Zone - Apple iCloud / Finder Style */}
        <div className="p-8 rounded-2xl bg-[#1c1c1e] border-2 border-dashed border-white/[0.1] hover:border-[#0a84ff]/50 transition-colors text-center relative overflow-hidden">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md,.json,.csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="max-w-md mx-auto space-y-3 pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-[#242426] border border-white/[0.08] flex items-center justify-center mx-auto shadow-inner">
              <Upload className="w-5 h-5 text-[#0a84ff]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#f5f5f7]">
                {isUploading ? 'Chunking and generating embeddings...' : 'Click or drop files to upload'}
              </h3>
              <p className="text-xs text-[#86868b]">
                Supports PDF, DOCX, TXT, and Markdown files.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 text-[11px] text-[#6e6e73] pt-1">
              <span>Recursive Semantic Chunking</span>
              <span>•</span>
              <span>Local Ollama Embeddings</span>
              <span>•</span>
              <span>Air-Gapped Storage</span>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="p-4 rounded-xl bg-[#241214] border border-[#ff453a]/30 text-[#ff453a] text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#ff453a] shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Ingested Documents List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#86868b]">
            <span className="font-medium uppercase tracking-wider text-[11px]">
              Ingested Documents ({documents.length})
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#1c1c1e] border border-white/[0.06] text-xs text-[#6e6e73]">
              No documents currently indexed in vector memory.
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.06] flex items-center justify-between hover:bg-[#222224] transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#242426] border border-white/[0.08] flex items-center justify-center">
                      <File className="w-4 h-4 text-[#0a84ff]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#f5f5f7]">{doc.filename}</h4>
                      <div className="flex items-center space-x-2 text-[11px] text-[#6e6e73] mt-0.5">
                        <span className="uppercase">{doc.file_type}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1 text-[#86868b]">
                          <Layers className="w-3 h-3" />
                          <span>{doc.chunk_count} chunks</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-2 rounded-lg text-[#6e6e73] hover:text-[#ff453a] hover:bg-white/[0.06] transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
