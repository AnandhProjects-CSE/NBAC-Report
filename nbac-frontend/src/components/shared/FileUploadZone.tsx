"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileUploadZoneProps {
  onFileAccepted: (file: File) => void
  accept?: Record<string, string[]>
  maxSize?: number
  label?: string
  hint?: string
  error?: string
  selectedFile?: File | null
  onClear?: () => void
  disabled?: boolean
}

export function FileUploadZone({
  onFileAccepted,
  accept = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "application/vnd.ms-excel": [".xls"],
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  label = "Upload Excel File",
  hint = "Supported formats: .xlsx, .xls (max 5MB)",
  error,
  selectedFile,
  onClear,
  disabled = false,
}: FileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0])
      }
    },
    [onFileAccepted]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    disabled,
    multiple: false,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  if (selectedFile) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          {onClear && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive && "border-amber-500 bg-amber-50 dark:bg-amber-900/20",
          isDragReject && "border-red-500 bg-red-50 dark:bg-red-900/20",
          error && "border-red-500 bg-red-50 dark:bg-red-900/20",
          !isDragActive && !isDragReject && !error && "border-slate-200 dark:border-slate-700 hover:border-amber-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Upload className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {label}
            </p>
            <p className="text-xs text-slate-500 mt-1">{hint}</p>
          </div>
          {isDragActive && !isDragReject && (
            <p className="text-sm text-amber-600">Drop the file here...</p>
          )}
          {isDragReject && (
            <p className="text-sm text-red-600">File type not accepted</p>
          )}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
