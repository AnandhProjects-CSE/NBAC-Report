import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// NBA PO Descriptions - Standard NBA labels
export const PO_DESCRIPTIONS: Record<string, string> = {
  PO1: "Engineering Knowledge",
  PO2: "Problem Analysis",
  PO3: "Design/Development of Solutions",
  PO4: "Investigation of Complex Problems",
  PO5: "Modern Tool Usage",
  PO6: "The Engineer and Society",
  PO7: "Environment and Sustainability",
  PO8: "Ethics",
  PO9: "Individual and Team Work",
  PO10: "Communication",
  PO11: "Project Management and Finance",
  PO12: "Life-long Learning",
}

// Attainment level colors
export const ATTAINMENT_COLORS = {
  0: { bg: "bg-red-500", text: "text-white", label: "0" },
  1: { bg: "bg-orange-500", text: "text-white", label: "1" },
  2: { bg: "bg-amber-500", text: "text-white", label: "2" },
  3: { bg: "bg-green-500", text: "text-white", label: "3" },
} as const

// Matrix correlation colors
export const MATRIX_COLORS = {
  0: "bg-white dark:bg-slate-800",
  1: "bg-blue-200 dark:bg-blue-900",
  2: "bg-blue-400 dark:bg-blue-700",
  3: "bg-blue-600 dark:bg-blue-500",
} as const

// Format date for display
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// Format datetime for display
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Get greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

// Format attainment level
export function formatAttainmentLevel(level: number | null): string {
  if (level === null || level === undefined) return "N/A"
  return level.toString()
}

// Get attainment level from success percentage
export function getDirectAttainmentLevel(successPercentage: number): number {
  if (successPercentage >= 70) return 3
  if (successPercentage >= 60) return 2
  if (successPercentage >= 50) return 1
  return 0
}

// Get attainment level from feedback rating
export function getIndirectAttainmentLevel(avgRating: number): number {
  if (avgRating >= 4.5) return 3
  if (avgRating >= 3.5) return 2
  if (avgRating >= 2.5) return 1
  return 0
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Role badge colors
export const ROLE_COLORS = {
  admin: { bg: "bg-purple-500", text: "text-white" },
  faculty: { bg: "bg-blue-500", text: "text-white" },
  student: { bg: "bg-emerald-500", text: "text-white" },
} as const

// Assessment types
export const ASSESSMENT_TYPES = [
  { id: "internal1", label: "Internal 1" },
  { id: "internal2", label: "Internal 2" },
  { id: "assignment", label: "Assignment" },
  { id: "external", label: "External" },
] as const

// Departments list
export const DEPARTMENTS = [
  "Computer Science",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
] as const

// Academic years (current year and past 4 years)
export function getAcademicYears(): string[] {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = 0; i < 5; i++) {
    const year = currentYear - i
    years.push(`${year}-${String(year + 1).slice(-2)}`)
  }
  return years
}

// Semesters
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const

// Sections
export const SECTIONS = ["A", "B", "C", "D"] as const

// Years
export const YEARS = [1, 2, 3, 4] as const
