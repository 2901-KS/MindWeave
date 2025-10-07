// script.js - Handles form submission and API communication
// IMPORTANT: Change this to your actual backend URL
const API_BASE_URL = 'http://localhost:8000';

let subjectCount = 1;

document.getElementById("addSubject").addEventListener("click", () => {
  subjectCount++;
  const subjectsContainer = document.getElementById("subjectsContainer");

  const subjectCard = document.createElement("div");
  subjectCard.className = "subject-card";
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
    `;

  subjectsContainer.appendChild(subjectCard);
});

function removeSubject(button) {
  const subjectCards = document.querySelectorAll(".subject-card");
  if (subjectCards.length > 1) {
    button.closest(".subject-card").remove();
    updateSubjectNumbers();
  } else {
    alert("You must have at least one subject!");
  }
}

function updateSubjectNumbers() {
  const subjectCards = document.querySelectorAll(".subject-card");
  subjectCards.forEach((card, index) => {
    card.querySelector("h3").textContent = `Subject ${index + 1}`;
  });
  subjectCount = subjectCards.length;
}

document.getElementById("studyForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Collect form data
  const weekdayHours = Number.parseInt(document.getElementById("weekdayHours").value);
  const weekendHours = Number.parseInt(document.getElementById("weekendHours").value);
  const timeSlot = document.getElementById("timeSlot").value;
  const maxHours = Number.parseInt(document.getElementById("maxHours").value);

  // Validate max hours
  const maxDailyHours = Math.max(weekdayHours, weekendHours);
  if (maxHours < maxDailyHours) {
    alert("Maximum study hours per day cannot be less than your weekday or weekend hours!");
    return;
  }

  // Collect all subjects
  const subjectCards = document.querySelectorAll(".subject-card");
  const subjects = [];
  
  subjectCards.forEach((card) => {
    const subject = {
      name: card.querySelector(".subject-name").value,
      importance: card.querySelector(".subject-importance").value,
      deadline: card.querySelector(".subject-deadline").value,
      min_hours_required: Number.parseFloat(card.querySelector(".subject-hours").value)
    };
    subjects.push(subject);
  });

  // Prepare API request payload
  const apiPayload = {
    subjects: subjects.map(s => ({
      name: s.name,
      min_hours_required: s.min_hours_required,
      deadline: s.deadline
    })),
    weekday_hours: weekdayHours,
    weekend_hours: weekendHours,
    start_date: new Date().toISOString().split('T')[0]
  };

  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = '⏳ Generating Plan...';
  submitBtn.disabled = true;

  try {
    // Call backend API
    const response = await fetch(`${API_BASE_URL}/api/planner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to generate plan');
    }

    if (!data.success) {
      // Show error from backend
      let errorMessage = `❌ ${data.error}`;
      if (data.details) {
        errorMessage += `\n\n📊 Details:\nSubject: ${data.details.subject}\nRequired: ${data.details.required_hours} hours\nAvailable: ${data.details.available_hours} hours\nShortage: ${data.details.shortage} hours`;
      }
      alert(errorMessage);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      return;
    }

    // Store both form data and API response for the output page
    const studyPlanData = {
      // Form data
      weekdayHours: weekdayHours,
      weekendHours: weekendHours,
      timeSlot: timeSlot,
      maxHours: maxHours,
      subjects: subjects,
      
      // API response
      plan: data.plan,
      baseAllocation: data.base_allocation,
      generatedAt: new Date().toISOString()
    };

    localStorage.setItem("studyPlanData", JSON.stringify(studyPlanData));

    // Redirect to planner output page
    window.location.href = "planner.html";

  } catch (error) {
    console.error('Error:', error);
    alert(`❌ Failed to generate study plan!\n\n${error.message}\n\nPlease make sure:\n1. Backend server is running at ${API_BASE_URL}\n2. CORS is properly configured\n3. All deadlines are valid dates`);
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Set minimum date for deadlines to today
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('.subject-deadline').forEach(input => {
    input.min = today;
  });
});