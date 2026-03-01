"use client"

import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"
import Link from "next/link"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center px-4">
        <div className="mb-6">
          <span className="text-8xl font-bold text-slate-900 dark:text-slate-100">
            404
          </span>
        </div>
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <FileQuestion className="h-10 w-10 text-slate-400" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Page Not Found
        </h1>
        <p className="text-slate-500 mb-6 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
