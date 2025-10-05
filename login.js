const AUTH_KEY = "counting_platform_auth"
const ADMIN_PASSWORD = "admin123"

// Handle contributor login button
document.getElementById("contributorLoginBtn").addEventListener("click", () => {
  document.getElementById("contributorNameModal").classList.add("active")
  document.getElementById("contributorName").focus()
})

// Handle contributor name form
document.getElementById("contributorNameForm").addEventListener("submit", (e) => {
  e.preventDefault()
  const name = document.getElementById("contributorName").value.trim()

  if (name.length >= 2) {
    const auth = {
      role: "contributor",
      name: name,
      timestamp: Date.now(),
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
    window.location.href = "contributor.html"
  } else {
    alert("Veuillez entrer un nom valide (au moins 2 caractères)")
  }
})

// Handle cancel contributor login
document.getElementById("cancelContributorBtn").addEventListener("click", () => {
  document.getElementById("contributorNameModal").classList.remove("active")
  document.getElementById("contributorName").value = ""
})

// Handle admin login button
document.getElementById("adminLoginBtn").addEventListener("click", () => {
  document.getElementById("adminPasswordModal").classList.add("active")
  document.getElementById("adminName").focus()
})

// Handle admin password form
document.getElementById("adminPasswordForm").addEventListener("submit", (e) => {
  e.preventDefault()
  const name = document.getElementById("adminName").value.trim()
  const password = document.getElementById("adminPassword").value

  if (name.length < 2) {
    alert("Veuillez entrer un nom valide (au moins 2 caractères)")
    return
  }

  if (password === ADMIN_PASSWORD) {
    const auth = { role: "admin", name: name, timestamp: Date.now() }
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
    window.location.href = "admin.html"
  } else {
    alert("Mot de passe incorrect")
    document.getElementById("adminPassword").value = ""
    document.getElementById("adminPassword").focus()
  }
})

// Handle cancel admin login
document.getElementById("cancelAdminBtn").addEventListener("click", () => {
  document.getElementById("adminPasswordModal").classList.remove("active")
  document.getElementById("adminName").value = ""
  document.getElementById("adminPassword").value = ""
})
