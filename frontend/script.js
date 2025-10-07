let subjectCount = 1

document.getElementById("addSubject").addEventListener("click", () => {
  subjectCount++
  const subjectsContainer = document.getElementById("subjectsContainer")

  const subjectCard = document.createElement("div")
  subjectCard.className = "subject-card"
  subjectCard.innerHTML = `
        <div class="subject-header">
            <h3>Subject ${subjectCount}</h3>
            <button type="button" class="btn-remove" onclick="removeSubject(this)">Remove</button>
        </div>

        <div class="form-group">
            <label>Subject name</label>
            <input type="text" class="subject-name" required>
        </div>

        <div class="form-group">
            <label>Importance level</label>
            <select class="subject-importance" required>
                <option value="">Select importance</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
            </select>
        </div>

        <div class="form-group">
            <label>Deadline (YYYY-MM-DD)</label>
            <input type="date" class="subject-deadline" required>
        </div>

        <div class="form-group">
            <label>Minimum study time (hours)</label>
            <input type="number" class="subject-hours" min="1" required>
        </div>
    `

  subjectsContainer.appendChild(subjectCard)
})

function removeSubject(button) {
  const subjectCards = document.querySelectorAll(".subject-card")
  if (subjectCards.length > 1) {
    button.closest(".subject-card").remove()
    updateSubjectNumbers()
  } else {
    alert("You must have at least one subject!")
  }
}

function updateSubjectNumbers() {
  const subjectCards = document.querySelectorAll(".subject-card")
  subjectCards.forEach((card, index) => {
    card.querySelector("h3").textContent = `Subject ${index + 1}`
  })
  subjectCount = subjectCards.length
}

document.getElementById("studyForm").addEventListener("submit", (e) => {
  e.preventDefault()

  // Collect form data
  const formData = {
    weekdayHours: Number.parseInt(document.getElementById("weekdayHours").value),
    weekendHours: Number.parseInt(document.getElementById("weekendHours").value),
    timeSlot: document.getElementById("timeSlot").value,
    maxHours: Number.parseInt(document.getElementById("maxHours").value),
    subjects: [],
  }

  // Collect all subjects
  const subjectCards = document.querySelectorAll(".subject-card")
  subjectCards.forEach((card) => {
    const subject = {
      name: card.querySelector(".subject-name").value,
      importance: card.querySelector(".subject-importance").value,
      deadline: card.querySelector(".subject-deadline").value,
      minHours: Number.parseInt(card.querySelector(".subject-hours").value),
    }
    formData.subjects.push(subject)
  })

  // Validate max hours
  const maxDailyHours = Math.max(formData.weekdayHours, formData.weekendHours)
  if (formData.maxHours < maxDailyHours) {
    alert("Maximum study hours per day cannot be less than your weekday or weekend hours!")
    return
  }

  // Save to localStorage
  localStorage.setItem("studyPlanData", JSON.stringify(formData))

  // Redirect to planner page
  window.location.href = "planner.html"
})
