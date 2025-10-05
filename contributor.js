const STORAGE_KEY = "counting_platform_data"
const AUTH_KEY = "counting_platform_auth"

// Check authentication
function checkAuth() {
  const auth = localStorage.getItem(AUTH_KEY)
  if (!auth) {
    window.location.href = "index.html"
    return null
  }

  const user = JSON.parse(auth)
  if (user.role !== "contributor") {
    window.location.href = "index.html"
    return null
  }

  return user
}

// Initialize
const currentUser = checkAuth()
if (currentUser) {
  document.getElementById("userNameDisplay").textContent = currentUser.name
  document.getElementById("userName").value = currentUser.name
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
    existingEntry.value += Number.parseInt(countValue, 10)
    existingEntry.timestamp = new Date().toISOString()
  } else {
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

function updateUserTotal(userName, newTotal) {
  const data = loadData()
  const userNameTrimmed = userName.trim()
  const entry = data.find((entry) => entry.userName.trim().toLowerCase() === userNameTrimmed.toLowerCase())

  if (entry) {
    entry.value = Number.parseInt(newTotal, 10)
    entry.timestamp = new Date().toISOString()
    saveData(data)
    return true
  }
  return false
}

function getUserTotal(userName) {
  const data = loadData()
  const userNameTrimmed = userName.trim()
  const entry = data.find((entry) => entry.userName.trim().toLowerCase() === userNameTrimmed.toLowerCase())
  return entry ? entry.value : 0
}

function calculateStats() {
  const data = loadData()
  const stats = {}

  data.forEach((entry) => {
    stats[entry.userName] = {
      total: entry.total || 0,
      count: entry.count || 0,
    }
  })

  return stats
}

function calculateTotalCount() {
  const data = loadData()
  return data.reduce((sum, entry) => sum + entry.value, 0)
}

let showAllContributors = localStorage.getItem("show_all_contributors") === "true"

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

// Render functions
function renderStats() {
  const stats = calculateStats()
  const container = document.getElementById("statsContainer")
  const totalContainer = document.getElementById("totalCount")

  totalContainer.textContent = calculateTotalCount().toLocaleString("fr-FR")

  const myTotal = getUserTotal(currentUser.name)
  const myTotalCard = document.getElementById("myTotalCard")
  const myTotalValue = document.getElementById("myTotalValue")

  if (myTotal > 0) {
    myTotalCard.style.display = "block"
    myTotalValue.textContent = myTotal.toLocaleString("fr-FR")
  } else {
    myTotalCard.style.display = "none"
  }

  const data = loadData()
  const myEntry = data.find((entry) => entry.userName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())

  const adminNames = new Set()
  const allAdmins = JSON.parse(localStorage.getItem("counting_platform_admin_names") || "[]")
  allAdmins.forEach((name) => adminNames.add(name.toLowerCase()))

  if (showAllContributors) {
    const sortedData = [...data].sort((a, b) => b.value - a.value)

    if (sortedData.length === 0) {
      container.innerHTML = '<div class="empty-state">Aucune contribution pour le moment. Soyez le premier !</div>'
      return
    }

    container.innerHTML = sortedData
      .map(
        (entry) => `
      <div class="stat-card">
          <h3>
            ${entry.userName}
            ${adminNames.has(entry.userName.toLowerCase()) ? '<span class="admin-badge">Admin</span>' : ""}
          </h3>
          <div class="stat-value">${entry.value.toLocaleString("fr-FR")}</div>
          <div class="stat-count">${entry.userName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ? "Votre contribution" : "invocations"}</div>
      </div>
    `,
      )
      .join("")
  } else {
    const userValue = myEntry ? myEntry.value : 0
    container.innerHTML = `
      <div class="stat-card">
          <h3>
            ${currentUser.name}
            ${adminNames.has(currentUser.name.toLowerCase()) ? '<span class="admin-badge">Admin</span>' : ""}
          </h3>
          <div class="stat-value">${userValue.toLocaleString("fr-FR")}</div>
          <div class="stat-count">Votre contribution</div>
      </div>
    `
  }
}

function refreshDisplay() {
  renderStats()
}

// Event listeners
document.getElementById("countForm").addEventListener("submit", (e) => {
  e.preventDefault()

  const userName = currentUser.name
  const countValue = document.getElementById("countValue").value

  addEntry(userName, countValue)
  refreshDisplay()

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

document.querySelectorAll(".btn-quick").forEach((button) => {
  button.addEventListener("click", () => {
    const userName = currentUser.name
    const value = button.dataset.value
    addEntry(userName, value)
    refreshDisplay()
  })
})

const modal = document.getElementById("editModal")
const editBtn = document.getElementById("editMyTotalBtn")
const closeModal = document.getElementById("closeModal")
const cancelEdit = document.getElementById("cancelEdit")
const editForm = document.getElementById("editForm")

editBtn.addEventListener("click", () => {
  const currentTotal = getUserTotal(currentUser.name)
  document.getElementById("newTotal").value = currentTotal
  modal.classList.add("active")
})

closeModal.addEventListener("click", () => {
  modal.classList.remove("active")
})

cancelEdit.addEventListener("click", () => {
  modal.classList.remove("active")
})

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active")
  }
})

editForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const newTotal = document.getElementById("newTotal").value

  if (updateUserTotal(currentUser.name, newTotal)) {
    refreshDisplay()
    modal.classList.remove("active")

    // Show success feedback
    const submitBtn = e.target.querySelector(".btn-submit")
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = "✓ Modifié !"
    submitBtn.style.background = "var(--color-success)"

    setTimeout(() => {
      submitBtn.innerHTML = originalText
      submitBtn.style.background = ""
    }, 1500)
  }
})

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
    localStorage.removeItem(AUTH_KEY)
    window.location.href = "index.html"
  }
})

const toggleLeaderboardBtn = document.getElementById("toggleLeaderboardBtn")
const toggleLeaderboardText = document.getElementById("toggleLeaderboardText")

function updateToggleButton() {
  if (showAllContributors) {
    toggleLeaderboardText.textContent = "Masquer les autres contributeurs"
  } else {
    toggleLeaderboardText.textContent = "Voir tous les contributeurs"
  }
}

toggleLeaderboardBtn.addEventListener("click", () => {
  showAllContributors = !showAllContributors
  localStorage.setItem("show_all_contributors", showAllContributors.toString())
  updateToggleButton()
  refreshDisplay()
})

// Initialize toggle button text
updateToggleButton()

cleanupDuplicates()

// Initial render
refreshDisplay()
