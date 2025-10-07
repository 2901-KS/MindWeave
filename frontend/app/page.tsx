"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

interface Subject {
  name: string
  importance: "high" | "medium" | "low"
  deadline: string
  minHours: number
}

export default function InputPage() {
  const router = useRouter()
  const [weekdayHours, setWeekdayHours] = useState("5")
  const [weekendHours, setWeekendHours] = useState("8")
  const [timeSlot, setTimeSlot] = useState("evening")
  const [maxDailyHours, setMaxDailyHours] = useState("7")
  const [subjects, setSubjects] = useState<Subject[]>([{ name: "", importance: "medium", deadline: "", minHours: 0 }])

  const addSubject = () => {
    setSubjects([...subjects, { name: "", importance: "medium", deadline: "", minHours: 0 }])
  }

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index))
  }

  const updateSubject = (index: number, field: keyof Subject, value: any) => {
    const updated = [...subjects]
    updated[index] = { ...updated[index], [field]: value }
    setSubjects(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    const validSubjects = subjects.filter((s) => s.name && s.deadline && s.minHours > 0)
    if (validSubjects.length === 0) {
      alert("Please add at least one valid subject with all fields filled")
      return
    }

    // Store data in localStorage
    const planData = {
      weekdayHours: Number.parseInt(weekdayHours),
      weekendHours: Number.parseInt(weekendHours),
      timeSlot,
      maxDailyHours: Number.parseInt(maxDailyHours),
      subjects: validSubjects,
    }

    localStorage.setItem("studyPlanData", JSON.stringify(planData))
    router.push("/planner")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-balance">Study Planner</h1>
          <p className="text-muted-foreground text-lg">Create your personalized study schedule</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Study Hours Configuration */}
          <Card className="p-6 border-border bg-card">
            <h2 className="text-xl font-semibold mb-6">Study Hours</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weekday">Weekday hours per day</Label>
                <Input
                  id="weekday"
                  type="number"
                  min="1"
                  max="24"
                  value={weekdayHours}
                  onChange={(e) => setWeekdayHours(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekend">Weekend hours per day</Label>
                <Input
                  id="weekend"
                  type="number"
                  min="1"
                  max="24"
                  value={weekendHours}
                  onChange={(e) => setWeekendHours(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Preferred time slot</Label>
                <Select value={timeSlot} onValueChange={setTimeSlot}>
                  <SelectTrigger id="timeSlot" className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDaily">Maximum daily hours</Label>
                <Input
                  id="maxDaily"
                  type="number"
                  min="1"
                  max="24"
                  value={maxDailyHours}
                  onChange={(e) => setMaxDailyHours(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>
            </div>
          </Card>

          {/* Subjects */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Subjects</h2>
              <Button type="button" onClick={addSubject} variant="outline" size="sm" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Subject
              </Button>
            </div>

            <div className="space-y-6">
              {subjects.map((subject, index) => (
                <div key={index} className="p-4 border border-border rounded-lg bg-secondary/50 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Subject {index + 1}</span>
                    {subjects.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeSubject(index)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subject name</Label>
                      <Input
                        value={subject.name}
                        onChange={(e) => updateSubject(index, "name", e.target.value)}
                        placeholder="e.g., Mathematics"
                        required
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Importance level</Label>
                      <Select
                        value={subject.importance}
                        onValueChange={(value) => updateSubject(index, "importance", value)}
                      >
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Deadline</Label>
                      <Input
                        type="date"
                        value={subject.deadline}
                        onChange={(e) => updateSubject(index, "deadline", e.target.value)}
                        required
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum study hours</Label>
                      <Input
                        type="number"
                        min="1"
                        value={subject.minHours || ""}
                        onChange={(e) => updateSubject(index, "minHours", Number.parseInt(e.target.value) || 0)}
                        placeholder="Total hours needed"
                        required
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="px-8">
              Generate Study Plan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
