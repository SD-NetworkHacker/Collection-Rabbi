const STORAGE_KEY = "counting_platform_data"
const AUTH_KEY = "counting_platform_auth"
const ADMIN_NAME_KEY = "counting_platform_admin_name"
const ADMIN_NAMES_KEY = "counting_platform_admin_names"

// Check authentication
function checkAuth() {
  const auth = localStorage.getItem(AUTH_KEY)
  if (!auth) {
    window.location.href = "index.html"
    return null
  }

  const user = JSON.parse(auth)
  if (user.role !== "admin") {
    window.location.href = "index.html"
    return null
  }

  addAdminName(user.name)

  return user
}

// Initialize
const currentUser = checkAuth()
if (currentUser) {
  document.getElementById("userNameDisplay").textContent = currentUser.name
  document.getElementById("userName").value = currentUser.name
  document.getElementById("userName").placeholder = `${currentUser.name} (vous)`
}

// Data functions
function loadData() {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function addEntry(userName, countValue) {
  const data = loadData()
  const userNameTrimmed = userName.trim()

  const existingEntry = data.find((entry) => entry.userName.trim().toLowerCase() === userNameTrimmed.toLowerCase())

  if (existingEntry) {
    // Update existing entry
    existingEntry.value += Number.parseInt(countValue, 10)
    existingEntry.timestamp = new Date().toISOString()
  } else {
    // Create new entry
    const entry = {
      id: Date.now(),
      userName: userNameTrimmed,
      value: Number.parseInt(countValue, 10),
      timestamp: new Date().toISOString(),
    }
    data.push(entry)
  }

  saveData(data)
}

function deleteEntry(id) {
  const data = loadData()
  const filteredData = data.filter((entry) => entry.id !== Number.parseInt(id, 10))
  saveData(filteredData)
}

function updateEntry(id, newValue) {
  const data = loadData()
  const entry = data.find((entry) => entry.id === Number.parseInt(id, 10))
  if (entry) {
    entry.value = Number.parseInt(newValue, 10)
    entry.timestamp = new Date().toISOString()
    saveData(data)
  }
}

function calculateStats() {
  const data = loadData()
  const stats = {}

  data.forEach((entry) => {
    stats[entry.userName] = {
      total: entry.value,
      count: 1, // Always 1 since we accumulate in the entry itself
    }
  })

  return stats
}

function calculateTotalCount() {
  const data = loadData()
  return data.reduce((sum, entry) => sum + entry.value, 0)
}

function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Render functions
function renderStats() {
  const stats = calculateStats()
  const container = document.getElementById("statsContainer")
  const totalContainer = document.getElementById("totalCount")

  totalContainer.textContent = calculateTotalCount().toLocaleString("fr-FR")

  if (Object.keys(stats).length === 0) {
    container.innerHTML = '<div class="empty-state">Aucun contributeur pour le moment</div>'
    return
  }

  const sortedStats = Object.entries(stats).sort((a, b) => b[1].total - a[1].total)

  const adminNames = getAdminNames()
  const adminNamesLower = new Set(adminNames.map((name) => name.toLowerCase()))

  container.innerHTML = sortedStats
    .map(
      ([userName, data]) => `
        <div class="stat-card">
            <h3>
              ${userName}
              ${adminNamesLower.has(userName.toLowerCase()) ? '<span class="admin-badge">Admin</span>' : ""}
            </h3>
            <div class="stat-value">${data.total.toLocaleString("fr-FR")}</div>
            <div class="stat-count">${data.count} contribution${data.count > 1 ? "s" : ""}</div>
        </div>
    `,
    )
    .join("")
}

function renderHistory() {
  const data = loadData()
  const container = document.getElementById("historyContainer")

  if (data.length === 0) {
    container.innerHTML = '<div class="empty-state">Aucune entrée pour le moment</div>'
    return
  }

  const sortedData = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  const adminNames = getAdminNames()
  const adminNamesLower = new Set(adminNames.map((name) => name.toLowerCase()))

  container.innerHTML = sortedData
    .map(
      (entry) => `
        <div class="history-item">
            <div class="history-info">
                <div class="history-user">
                  ${entry.userName}
                  ${adminNamesLower.has(entry.userName.toLowerCase()) ? '<span class="admin-badge">Admin</span>' : ""}
                </div>
                <div class="history-date">${formatDate(entry.timestamp)}</div>
            </div>
            <div class="history-value">${entry.value.toLocaleString("fr-FR")}</div>
            <div class="history-actions">
                <button class="btn-edit" data-id="${entry.id}" data-name="${entry.userName}" data-value="${entry.value}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-delete" data-id="${entry.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `,
    )
    .join("")

  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id
      const name = e.currentTarget.dataset.name
      const value = e.currentTarget.dataset.value
      openEditModal(id, name, value)
    })
  })

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number.parseInt(e.currentTarget.dataset.id, 10)
      if (confirm("Voulez-vous vraiment supprimer cette entrée ?")) {
        deleteEntry(id)
        refreshDisplay()
      }
    })
  })
}

function refreshDisplay() {
  renderStats()
  renderHistory()
  renderAdminDashboard()
}

function getAdminNames() {
  const names = localStorage.getItem(ADMIN_NAMES_KEY)
  return names ? JSON.parse(names) : []
}

function addAdminName(name) {
  const adminNames = getAdminNames()
  const normalizedName = name.trim().toLowerCase()

  // Check if admin name already exists (case-insensitive)
  const exists = adminNames.some((n) => n.toLowerCase() === normalizedName)

  if (!exists) {
    adminNames.push(name.trim())
    localStorage.setItem(ADMIN_NAMES_KEY, JSON.stringify(adminNames))
  }
}

function renderAdminDashboard() {
  const stats = calculateStats()
  const container = document.getElementById("adminStatsContainer")
  const adminNames = getAdminNames()

  const adminNamesLower = new Set(adminNames.map((name) => name.toLowerCase()))

  const adminStats = Object.entries(stats).filter(([userName]) => {
    return adminNamesLower.has(userName.trim().toLowerCase())
  })

  if (adminStats.length === 0) {
    container.innerHTML = '<div class="empty-state">Aucune contribution d\'administrateur pour le moment</div>'
    return
  }

  // Sort by total (highest first)
  const sortedAdminStats = adminStats.sort((a, b) => b[1].total - a[1].total)

  // Calculate total admin contributions
  const totalAdminContributions = sortedAdminStats.reduce((sum, [, data]) => sum + data.total, 0)

  container.innerHTML = `
    <div class="admin-summary-card">
      <div class="admin-summary-label">Total des contributions admins</div>
      <div class="admin-summary-value">${totalAdminContributions.toLocaleString("fr-FR")}</div>
      <div class="admin-summary-count">${sortedAdminStats.length} administrateur${sortedAdminStats.length > 1 ? "s" : ""}</div>
    </div>
    ${sortedAdminStats
      .map(
        ([userName, data]) => `
        <div class="admin-stat-card">
          <div class="admin-stat-header">
            <h3>${userName}</h3>
            <span class="admin-badge">Admin</span>
          </div>
          <div class="admin-stat-value">${data.total.toLocaleString("fr-FR")}</div>
          <div class="admin-stat-label">invocations</div>
        </div>
      `,
      )
      .join("")}
  `
}

let currentEditId = null

function openEditModal(id, name, value) {
  currentEditId = id
  document.getElementById("editUserName").value = name
  document.getElementById("editValue").value = value
  document.getElementById("editModal").classList.add("active")
}

function closeEditModal() {
  currentEditId = null
  document.getElementById("editModal").classList.remove("active")
  document.getElementById("editForm").reset()
}

// Event listeners
document.getElementById("countForm").addEventListener("submit", (e) => {
  e.preventDefault()

  const userName = document.getElementById("userName").value
  const countValue = document.getElementById("countValue").value

  const finalUserName = userName.trim() || currentUser.name || "Anonyme"

  addEntry(finalUserName, countValue)
  refreshDisplay()

  document.getElementById("userName").value = currentUser.name
  document.getElementById("countValue").value = "1"
  document.getElementById("countValue").focus()

  const submitBtn = e.target.querySelector(".btn-submit")
  const originalText = submitBtn.innerHTML
  submitBtn.innerHTML = "<span>✓ Ajouté !</span>"
  submitBtn.style.background = "var(--color-success)"

  setTimeout(() => {
    submitBtn.innerHTML = originalText
    submitBtn.style.background = ""
  }, 1500)
})

document.getElementById("editForm").addEventListener("submit", (e) => {
  e.preventDefault()
  const newValue = document.getElementById("editValue").value
  if (currentEditId && newValue) {
    updateEntry(currentEditId, newValue)
    refreshDisplay()
    closeEditModal()
  }
})

document.getElementById("closeEditModal").addEventListener("click", closeEditModal)
document.getElementById("cancelEdit").addEventListener("click", closeEditModal)

// Close modal when clicking outside
document.getElementById("editModal").addEventListener("click", (e) => {
  if (e.target.id === "editModal") {
    closeEditModal()
  }
})

document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Êtes-vous sûr de vouloir effacer toutes les données ?")) {
    localStorage.removeItem(STORAGE_KEY)
    refreshDisplay()
  }
})

// Cleanup function to merge duplicate entries
function cleanupDuplicates() {
  const data = loadData()
  const merged = {}

  // Merge entries with same username (case-insensitive)
  data.forEach((entry) => {
    const normalizedName = entry.userName.trim().toLowerCase()

    if (merged[normalizedName]) {
      // Add to existing entry
      merged[normalizedName].value += entry.value
      // Keep the latest timestamp
      if (new Date(entry.timestamp) > new Date(merged[normalizedName].timestamp)) {
        merged[normalizedName].timestamp = entry.timestamp
      }
    } else {
      // Create new merged entry, preserving original case
      merged[normalizedName] = {
        id: entry.id,
        userName: entry.userName.trim(),
        value: entry.value,
        timestamp: entry.timestamp,
      }
    }
  })

  // Convert back to array
  const cleanedData = Object.values(merged)
  saveData(cleanedData)
  return cleanedData
}

cleanupDuplicates()

// Initial render
refreshDisplay()

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
    localStorage.removeItem(AUTH_KEY)
    window.location.href = "index.html"
  }
})
