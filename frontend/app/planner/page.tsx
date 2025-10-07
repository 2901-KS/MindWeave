"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock } from "lucide-react"

interface Subject {
  name: string
  importance: "high" | "medium" | "low"
  deadline: string
  minHours: number
}

interface PlanData {
  weekdayHours: number
  weekendHours: number
  timeSlot: string
  maxDailyHours: number
  subjects: Subject[]
}

interface DaySchedule {
  date: string
  dayOfWeek: string
  timeSlot: string
  subjects: { name: string; hours: number; importance: string }[]
  totalHours: number
}

export default function PlannerPage() {
  const router = useRouter()
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [planData, setPlanData] = useState<PlanData | null>(null)

  useEffect(() => {
    const data = localStorage.getItem("studyPlanData")
    if (!data) {
      router.push("/")
      return
    }

    const parsed: PlanData = JSON.parse(data)
    setPlanData(parsed)
    generateSchedule(parsed)
  }, [router])

  const generateSchedule = (data: PlanData) => {
    const today = new Date()
    const scheduleMap = new Map<string, DaySchedule>()

    // Sort subjects by priority (deadline first, then importance)
    const sortedSubjects = [...data.subjects].sort((a, b) => {
      const dateA = new Date(a.deadline).getTime()
      const dateB = new Date(b.deadline).getTime()
      if (dateA !== dateB) return dateA - dateB

      const importanceOrder = { high: 0, medium: 1, low: 2 }
      return importanceOrder[a.importance] - importanceOrder[b.importance]
    })

    // Track remaining hours for each subject
    const remainingHours = new Map(sortedSubjects.map((s) => [s.name, s.minHours]))

    // Generate schedule
    const currentDate = new Date(today)
    const maxDays = 60 // Limit to 60 days

    for (let day = 0; day < maxDays; day++) {
      const dateStr = currentDate.toISOString().split("T")[0]
      const dayOfWeek = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
      })
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6

      const availableHours = Math.min(isWeekend ? data.weekendHours : data.weekdayHours, data.maxDailyHours)

      const daySchedule: DaySchedule = {
        date: dateStr,
        dayOfWeek,
        timeSlot: data.timeSlot,
        subjects: [],
        totalHours: 0,
      }

      let hoursLeft = availableHours

      // Allocate hours to subjects
      for (const subject of sortedSubjects) {
        const remaining = remainingHours.get(subject.name) || 0
        if (remaining <= 0 || hoursLeft <= 0) continue

        // Check if deadline has passed
        const deadline = new Date(subject.deadline)
        if (currentDate > deadline) continue

        // Calculate hours to allocate
        const daysUntilDeadline = Math.max(
          1,
          Math.ceil((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
        )

        // Prioritize subjects closer to deadline
        let hoursToAllocate = Math.min(remaining, hoursLeft, Math.ceil(remaining / daysUntilDeadline) + 1)

        // High importance gets more hours
        if (subject.importance === "high") {
          hoursToAllocate = Math.min(remaining, hoursLeft, hoursToAllocate + 1)
        }

        if (hoursToAllocate > 0) {
          daySchedule.subjects.push({
            name: subject.name,
            hours: hoursToAllocate,
            importance: subject.importance,
          })
          daySchedule.totalHours += hoursToAllocate
          remainingHours.set(subject.name, remaining - hoursToAllocate)
          hoursLeft -= hoursToAllocate
        }
      }

      // Only add days with scheduled subjects
      if (daySchedule.subjects.length > 0) {
        scheduleMap.set(dateStr, daySchedule)
      }

      // Check if all subjects are complete
      const allComplete = Array.from(remainingHours.values()).every((h) => h <= 0)
      if (allComplete) break

      currentDate.setDate(currentDate.getDate() + 1)
    }

    setSchedule(Array.from(scheduleMap.values()))
  }

  const getImportanceBadge = (importance: string) => {
    const variants: Record<string, string> = {
      high: "bg-red-500/10 text-red-500 border-red-500/20",
      medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    }
    return variants[importance] || variants.medium
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Input
          </Button>
          <h1 className="text-4xl font-bold mb-2">Study Plan</h1>
          <p className="text-muted-foreground">Your personalized study schedule based on priorities and deadlines</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Days</p>
                <p className="text-2xl font-bold">{schedule.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{schedule.reduce((sum, day) => sum + day.totalHours, 0)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subjects</p>
                <p className="text-2xl font-bold">{planData.subjects.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Schedule Table */}
        <Card className="border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Day</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Time Slot</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Subjects</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((day, index) => (
                  <tr key={index} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="p-4 font-mono text-sm">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4">{day.dayOfWeek}</td>
                    <td className="p-4 capitalize">
                      <Badge variant="outline" className="font-normal">
                        {day.timeSlot}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        {day.subjects.map((subject, idx) => (
                          <div key={idx} className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{subject.name}</span>
                            <Badge variant="outline" className={getImportanceBadge(subject.importance)}>
                              {subject.importance}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{subject.hours}h</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{day.totalHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {schedule.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No schedule generated. Please check your input data.
          </div>
        )}
      </div>
    </div>
  )
}
