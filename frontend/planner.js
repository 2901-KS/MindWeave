// planner.js - Display AI-generated study plan from backend

// Load data from localStorage
const studyData = JSON.parse(localStorage.getItem("studyPlanData"));

if (!studyData) {
  alert("No study plan data found. Please fill out the form first.");
  window.location.href = "esc.html";
}

// Check if we have AI-generated plan from backend
const hasAIPlan = studyData.plan && studyData.baseAllocation;

// Generate schedule (fallback if backend fails)
function generateSchedule(data) {
  const schedule = [];
  const subjects = [...data.subjects];

  // Sort subjects by deadline and importance
  subjects.sort((a, b) => {
    const dateA = new Date(a.deadline);
    const dateB = new Date(b.deadline);

    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }

    const importanceOrder = { high: 0, medium: 1, low: 2 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });

  // Track remaining hours for each subject
  const remainingHours = {};
  subjects.forEach((subject) => {
    remainingHours[subject.name] = subject.minHours || subject.min_hours_required;
  });

  // Generate schedule day by day
  const startDate = new Date();
  const currentDate = new Date(startDate);
  let dayCount = 0;
  const maxDays = 60;

  while (Object.values(remainingHours).some((hours) => hours > 0) && dayCount < maxDays) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const availableHours = Math.min(
      isWeekend ? data.weekendHours : data.weekdayHours,
      data.maxHours
    );

    let hoursLeft = availableHours;
    const daySchedule = [];

    for (const subject of subjects) {
      if (remainingHours[subject.name] > 0 && hoursLeft > 0) {
        const hoursToAllocate = Math.min(
          remainingHours[subject.name],
          hoursLeft,
          3
        );

        daySchedule.push({
          subject: subject.name,
          hours: hoursToAllocate,
          importance: subject.importance,
          deadline: subject.deadline,
          timeSlot: data.timeSlot,
        });

        remainingHours[subject.name] -= hoursToAllocate;
        hoursLeft -= hoursToAllocate;
      }
    }

    if (daySchedule.length > 0) {
      schedule.push({
        date: new Date(currentDate),
        tasks: daySchedule,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
    dayCount++;
  }

  return schedule;
}

// Convert backend allocation to frontend schedule format
function convertBackendToSchedule(baseAllocation) {
  const schedule = [];
  
  Object.keys(baseAllocation).sort().forEach(dateStr => {
    const dayPlan = baseAllocation[dateStr];
    const tasks = [];
    
    dayPlan.forEach(subjectBlock => {
      Object.keys(subjectBlock).forEach(subjectName => {
        const hours = subjectBlock[subjectName];
        const subjectInfo = studyData.subjects.find(s => s.name === subjectName);
        
        tasks.push({
          subject: subjectName,
          hours: hours,
          importance: subjectInfo?.importance || 'medium',
          deadline: subjectInfo?.deadline || '',
          timeSlot: studyData.timeSlot || 'morning'
        });
      });
    });
    
    if (tasks.length > 0) {
      schedule.push({
        date: new Date(dateStr),
        tasks: tasks
      });
    }
  });
  
  return schedule;
}

// Get schedule (use AI plan if available, otherwise generate)
const schedule = hasAIPlan 
  ? convertBackendToSchedule(studyData.baseAllocation)
  : generateSchedule(studyData);

// Display summary cards
function displaySummary() {
  const totalDays = schedule.length;
  const totalHours = schedule.reduce((sum, day) => {
    return sum + day.tasks.reduce((daySum, task) => daySum + task.hours, 0);
  }, 0);
  const totalSubjects = studyData.subjects.length;

  const summaryHTML = `
    <div class="summary-card">
      <h3>📅 Total Days</h3>
      <p>${totalDays}</p>
    </div>
    <div class="summary-card">
      <h3>⏱️ Total Hours</h3>
      <p>${totalHours.toFixed(1)}</p>
    </div>
    <div class="summary-card">
      <h3>📚 Subjects</h3>
      <p>${totalSubjects}</p>
    </div>
    <div class="summary-card">
      <h3>🕐 Time Slot</h3>
      <p style="font-size: 1.5rem; text-transform: capitalize;">${studyData.timeSlot || 'Flexible'}</p>
    </div>
    ${hasAIPlan ? `
    <div class="summary-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
      <h3>🤖 AI Optimized</h3>
      <p style="font-size: 1.2rem;">Yes</p>
    </div>
    ` : ''}
  `;

  document.getElementById("summaryCards").innerHTML = summaryHTML;
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
  `;

  schedule.forEach((day, dayIndex) => {
    day.tasks.forEach((task, taskIndex) => {
      const dateStr = day.date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const checkboxId = `task-${dayIndex}-${taskIndex}`;

      tableHTML += `
        <tr>
          <td>
            <div class="task-name">
              <input type="checkbox" class="task-checkbox" id="${checkboxId}" onchange="updateTaskStatus(this)">
              <label for="${checkboxId}">${task.subject} - ${task.hours} hour${task.hours > 1 ? "s" : ""}</label>
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
            <span class="badge badge-status" id="status-${checkboxId}">Not Started</span>
          </td>
          <td class="date-cell">${dateStr}</td>
        </tr>
      `;
    });
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  document.getElementById("scheduleContainer").innerHTML = tableHTML;
}

// Display AI plan text
function displayAIPlan() {
  if (!hasAIPlan) {
    displaySchedule();
    return;
  }

  const planHTML = `
    <div class="ai-plan-section">
      <div class="plan-header">
        <h2>🤖 AI-Generated Study Plan</h2>
        <button onclick="showTab('all')" class="btn-secondary">View Table Format</button>
      </div>
      <div class="plan-content">
        ${formatPlanText(studyData.plan)}
      </div>
    </div>
    <div class="plan-divider"></div>
    <div class="allocation-section">
      <h2>📊 Daily Hour Allocation</h2>
      <div class="allocation-grid">
        ${formatBaseAllocation(studyData.baseAllocation)}
      </div>
    </div>
  `;

  document.getElementById("scheduleContainer").innerHTML = planHTML;
}

// Format AI plan text
function formatPlanText(planText) {
  const lines = planText.split('\n');
  let formattedHtml = '';
  let inList = false;

  lines.forEach(line => {
    line = line.trim();
    if (!line) {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      return;
    }

    if (line.startsWith('###')) {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      formattedHtml += `<h4>${line.replace(/^###\s*/, '')}</h4>`;
    } else if (line.startsWith('##')) {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      formattedHtml += `<h3>${line.replace(/^##\s*/, '')}</h3>`;
    } else if (line.startsWith('#')) {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      formattedHtml += `<h2>${line.replace(/^#\s*/, '')}</h2>`;
    } else if (line.startsWith('**') && line.endsWith('**')) {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      formattedHtml += `<p><strong>${line.replace(/\*\*/g, '')}</strong></p>`;
    } else if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
      if (!inList) {
        formattedHtml += '<ul>';
        inList = true;
      }
      formattedHtml += `<li>${line.replace(/^[-*•]\s*/, '')}</li>`;
    } else {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      formattedHtml += `<p>${line}</p>`;
    }
  });

  if (inList) {
    formattedHtml += '</ul>';
  }

  return formattedHtml;
}

// Format base allocation
function formatBaseAllocation(baseAllocation) {
  let html = '';

  Object.keys(baseAllocation).sort().forEach(date => {
    const dayPlan = baseAllocation[date];
    const dayDate = new Date(date);
    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });

    html += `
      <div class="allocation-day">
        <div class="day-header">
          <strong>${dayName}</strong>
          <span>${date}</span>
        </div>
        <div class="day-subjects">
    `;

    dayPlan.forEach(subjectBlock => {
      Object.keys(subjectBlock).forEach(subjectName => {
        const hours = subjectBlock[subjectName];
        html += `
          <div class="subject-block">
            <span class="subject-name">${subjectName}</span>
            <span class="subject-hours">${hours}h</span>
          </div>
        `;
      });
    });

    html += `
        </div>
      </div>
    `;
  });

  return html;
}

// Display progress view
function displayProgress() {
  let html = `
    <div class="progress-section">
      <h2>📈 Study Progress Tracker</h2>
      <p class="info-text">Track your completion progress for each subject:</p>
      <div class="progress-grid">
  `;

  studyData.subjects.forEach((subject) => {
    const totalHours = subject.minHours || subject.min_hours_required;
    const completedHours = 0; // This would be tracked in a real app
    const completionPercentage = 0;

    html += `
      <div class="progress-card">
        <div class="progress-header">
          <h3>${subject.name}</h3>
          <span class="importance-badge ${subject.importance}">${subject.importance}</span>
        </div>
        <div class="progress-info">
          <p><strong>Required Hours:</strong> ${totalHours}h</p>
          <p><strong>Deadline:</strong> ${new Date(subject.deadline).toLocaleDateString()}</p>
          <p><strong>Completed:</strong> ${completedHours}h / ${totalHours}h</p>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${completionPercentage}%"></div>
        </div>
        <p class="progress-text">${completionPercentage}% Complete</p>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  document.getElementById("scheduleContainer").innerHTML = html;
}

// Display by subject
function displayBySubject() {
  let html = `
    <div class="subject-view-section">
      <h2>📚 Study Plan by Subject</h2>
  `;

  studyData.subjects.forEach(subject => {
    const subjectSchedule = extractSubjectSchedule(subject.name);
    const totalHours = subjectSchedule.reduce((sum, entry) => sum + entry.hours, 0);

    html += `
      <div class="subject-detail-card">
        <div class="subject-detail-header">
          <h3>${subject.name}</h3>
          <span class="importance-badge ${subject.importance}">${subject.importance}</span>
        </div>
        <div class="subject-stats">
          <div class="stat">
            <span class="stat-label">Required Hours:</span>
            <span class="stat-value">${subject.minHours || subject.min_hours_required}h</span>
          </div>
          <div class="stat">
            <span class="stat-label">Allocated Hours:</span>
            <span class="stat-value">${totalHours.toFixed(1)}h</span>
          </div>
          <div class="stat">
            <span class="stat-label">Deadline:</span>
            <span class="stat-value">${new Date(subject.deadline).toLocaleDateString()}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Study Days:</span>
            <span class="stat-value">${subjectSchedule.length}</span>
          </div>
        </div>
        <div class="subject-schedule">
          <h4>Daily Schedule:</h4>
          ${formatSubjectSchedule(subjectSchedule)}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  document.getElementById("scheduleContainer").innerHTML = html;
}

function extractSubjectSchedule(subjectName) {
  const subjectSchedule = [];

  schedule.forEach(day => {
    day.tasks.forEach(task => {
      if (task.subject === subjectName) {
        subjectSchedule.push({
          date: day.date,
          hours: task.hours
        });
      }
    });
  });

  return subjectSchedule;
}

function formatSubjectSchedule(subjectSchedule) {
  if (subjectSchedule.length === 0) {
    return '<p>No schedule available for this subject</p>';
  }

  let html = '<div class="schedule-list">';
  subjectSchedule.forEach(entry => {
    const dayName = entry.date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    html += `
      <div class="schedule-item">
        <span class="schedule-date">${dayName}, ${dateStr}</span>
        <span class="schedule-hours">${entry.hours} hours</span>
      </div>
    `;
  });
  html += '</div>';

  return html;
}

// Tab functionality
function showTab(tabName) {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");

  switch(tabName) {
    case 'all':
      displaySchedule();
      break;
    case 'progress':
      displayProgress();
      break;
    case 'subject':
      displayBySubject();
      break;
    case 'ai-plan':
      displayAIPlan();
      break;
    default:
      displaySchedule();
  }
}

// Update task status
function updateTaskStatus(checkbox) {
  const statusId = 'status-' + checkbox.id;
  const statusElement = document.getElementById(statusId);
  
  if (checkbox.checked) {
    statusElement.textContent = 'Completed';
    statusElement.className = 'badge badge-completed';
    checkbox.parentElement.parentElement.style.opacity = '0.6';
  } else {
    statusElement.textContent = 'Not Started';
    statusElement.className = 'badge badge-status';
    checkbox.parentElement.parentElement.style.opacity = '1';
  }
}

// Initialize
displaySummary();

// Show AI plan by default if available, otherwise show table
if (hasAIPlan) {
  displayAIPlan();
  // Update tab if it exists
  const firstTab = document.querySelector('.tab');
  if (firstTab) {
    firstTab.textContent = 'AI Plan View';
  }
} else {
  displaySchedule();
}