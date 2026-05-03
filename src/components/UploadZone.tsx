"use client";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { documentApi, DocumentMetadata } from "@/lib/api";
import { toast } from "sonner";

export default function UploadZone({ onUploaded }: { onUploaded: (m: DocumentMetadata) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const onDrop = async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    setUploading(true);
    try {
      setProgress("Parsing document...");
      await new Promise((r) => setTimeout(r, 200));
      setProgress("Generating embeddings... (may take 20s if model is cold)");
      const result = await documentApi.upload(file);
      setProgress("Indexed!");
      toast.success(`Indexed ${result.metadata.chunk_count} chunks from ${file.name}`);
      onUploaded(result.metadata);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Upload failed - HF model may be loading. Try again in 20s.");
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
        isDragActive ? "border-accent bg-accent/5" : "border-white/10 hover:border-accent/50"
      } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="text-accent font-medium">{progress}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="font-medium text-white mb-1">Drop your document here</p>
            <p className="text-sm text-muted-2">or click to browse · PDF / DOCX / TXT · max 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
