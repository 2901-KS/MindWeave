// Load data from localStorage
const studyData = JSON.parse(localStorage.getItem("studyPlanData"))

if (!studyData) {
  alert("No study plan data found. Please fill out the form first.")
  window.location.href = "index.html"
}

// Generate study schedule
function generateSchedule(data) {
  const schedule = []
  const subjects = [...data.subjects]

  // Sort subjects by deadline and importance
  subjects.sort((a, b) => {
    const dateA = new Date(a.deadline)
    const dateB = new Date(b.deadline)

    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB
    }

    const importanceOrder = { high: 0, medium: 1, low: 2 }
    return importanceOrder[a.importance] - importanceOrder[b.importance]
  })

  // Track remaining hours for each subject
  const remainingHours = {}
  subjects.forEach((subject) => {
    remainingHours[subject.name] = subject.minHours
  })

  // Generate schedule day by day
  const startDate = new Date()
  const currentDate = new Date(startDate)
  let dayCount = 0
  const maxDays = 60 // Prevent infinite loop

  while (Object.values(remainingHours).some((hours) => hours > 0) && dayCount < maxDays) {
    const dayOfWeek = currentDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const availableHours = Math.min(isWeekend ? data.weekendHours : data.weekdayHours, data.maxHours)

    let hoursLeft = availableHours
    const daySchedule = []

    // Allocate hours to subjects
    for (const subject of subjects) {
      if (remainingHours[subject.name] > 0 && hoursLeft > 0) {
        const hoursToAllocate = Math.min(
          remainingHours[subject.name],
          hoursLeft,
          3, // Max 3 hours per subject per day for better distribution
        )

        daySchedule.push({
          subject: subject.name,
          hours: hoursToAllocate,
          importance: subject.importance,
          deadline: subject.deadline,
          timeSlot: data.timeSlot,
        })

        remainingHours[subject.name] -= hoursToAllocate
        hoursLeft -= hoursToAllocate
      }
    }

    if (daySchedule.length > 0) {
      schedule.push({
        date: new Date(currentDate),
        tasks: daySchedule,
      })
    }

    currentDate.setDate(currentDate.getDate() + 1)
    dayCount++
  }

  return schedule
}

const schedule = generateSchedule(studyData)

// Display summary cards
function displaySummary() {
  const totalDays = schedule.length
  const totalHours = schedule.reduce((sum, day) => {
    return sum + day.tasks.reduce((daySum, task) => daySum + task.hours, 0)
  }, 0)
  const totalSubjects = studyData.subjects.length

  const summaryHTML = `
        <div class="summary-card">
            <h3>Total Days</h3>
            <p>${totalDays}</p>
        </div>
        <div class="summary-card">
            <h3>Total Hours</h3>
            <p>${totalHours}</p>
        </div>
        <div class="summary-card">
            <h3>Subjects</h3>
            <p>${totalSubjects}</p>
        </div>
        <div class="summary-card">
            <h3>Time Slot</h3>
            <p style="font-size: 1.5rem; text-transform: capitalize;">${studyData.timeSlot}</p>
        </div>
    `

  document.getElementById("summaryCards").innerHTML = summaryHTML
}

// Display schedule table
function displaySchedule() {
  let tableHTML = `
        <table class="schedule-table">
            <thead>
                <tr>
                    <th>Study Plan</th>
                    <th>Study Type</th>
                    <th>Importance</th>
                    <th>Status</th>
                    <th>Schedule</th>
                </tr>
            </thead>
            <tbody>
    `

  schedule.forEach((day) => {
    day.tasks.forEach((task) => {
      const dateStr = day.date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })

      tableHTML += `
                <tr>
                    <td>
                        <div class="task-name">
                            <input type="checkbox" class="task-checkbox">
                            <span>${task.subject} - ${task.hours} hour${task.hours > 1 ? "s" : ""}</span>
                        </div>
                    </td>
                    <td>
                        <span class="badge" style="background: #1a2a2a; color: #6bcf7f; border: 1px solid #2a3a3a; text-transform: capitalize;">
                            ${task.timeSlot}
                        </span>
                    </td>
                    <td>
                        <span class="badge badge-${task.importance}">${task.importance}</span>
                    </td>
                    <td>
                        <span class="badge badge-status">Not Started</span>
                    </td>
                    <td class="date-cell">${dateStr}</td>
                </tr>
            `
    })
  })

  tableHTML += `
            </tbody>
        </table>
    `

  document.getElementById("scheduleContainer").innerHTML = tableHTML
}

// Tab functionality
function showTab(tabName) {
  const tabs = document.querySelectorAll(".tab")
  tabs.forEach((tab) => tab.classList.remove("active"))
  event.target.classList.add("active")

  // For now, all tabs show the same view
  // You can customize this to show different views
  displaySchedule()
}

// Initialize
displaySummary()
displaySchedule()
