export function getTheme() {
  return localStorage.getItem('nyin-theme') ?? 'dark'
}

export function setTheme(theme) {
  localStorage.setItem('nyin-theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
}

export function initTheme() {
  const theme = getTheme()
  document.documentElement.setAttribute('data-theme', theme)
  return theme
}