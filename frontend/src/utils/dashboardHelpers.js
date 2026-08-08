export function nameFromEmail(email = "") {
  return email
    .split("@")[0]
    .split(".")
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function greet() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function authHeader() {
  const t = localStorage.getItem("orkis_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Dean check takes priority — a person can be both professor AND dean
export function isDean(role = "") {
  return role.toLowerCase().includes("dean");
}
export function isFaculty(role = "") {
  return !isDean(role) && (role.toLowerCase().includes("professor") || role.toLowerCase().includes("faculty"));
}
export function isChairperson(role = "") {
  return role.toLowerCase().includes("program chairperson") || role.toLowerCase().includes("programme chairperson");
}

export function endpointForRole(role) {
  if (!role) return null;
  if (isDean(role)) return "/dashboard/dean";
  if (isChairperson(role)) return "/dashboard/chair";
  if (isFaculty(role)) return "/dashboard/faculty";
  return null;
}

export function subtitleForRole(role, chairedProgramme) {
  if (isDean(role)) return "Here's your institute today.";
  if (isChairperson(role)) return chairedProgramme ? `Programme Chairperson — ${chairedProgramme}` : "Programme Chairperson";
  if (isFaculty(role)) return "Here's your teaching load today.";
  return "Welcome to Orkis.";
}