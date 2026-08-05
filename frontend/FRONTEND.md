
Build an interactive radial "Institutional Memory Map" visualization for the 
Associate Dean's dashboard — a force-directed / radial node graph styling matches 
the reference: a glowing central core with department hubs radiating outward, each 
exploding into sub-trees of roles, faculty, and courses. Dark, premium, animated.

STACK: React + TypeScript. Use react-force-graph-2d (or D3 force simulation on 
canvas if you prefer control) for the graph, framer-motion for camera/zoom 

transitions. Canvas-based rendering (hundreds of nodes must stay 60fps). If 
react-force-graph isn't available, implement with d3-force + <canvas>.

=== DATA (create this as src/data/deanMap.js — realistic fake data) ===
Model an Associate Dean's academic domain as a hierarchical graph. Structure:

ROOT (center):  "Associate Dean — School of Technology" (the glowing core)

6 DEPARTMENT HUBS (first ring), each a colored hub node:
  1. Computer Science & Engineering
  2. Artificial Intelligence & Data Science
  3. Electronics & Telecommunication
  4. Mechanical Engineering
  5. Examinations & Academic Affairs
  6. Research & Accreditation

Under EACH department (second + third rings), generate realistic children:
  - Programme Chairperson (1 person node)
  - 4–6 Faculty (person nodes with names, e.g. "Dr. Meera Iyer")
  - Each faculty connecjs to 2–3 Course nodes (e.g. "CS301 — DBMS", 
    "AI402 — Deep Learning", "EXTC210 — Signals")
  - A few cross-links: a faculty who sijs on a committee in another department, 
    or teaches a shared course (draw these as faint cross-edges to show the 
    graph is connected, not just a tree).

For Examinations & Academic Affairs, children = Exam Cell Officer, Timetable 
Committee, Grievance Cell, Invigilation Roster.
For Research & Accreditation, children = NAAC Coordinator, NBA Coordinator, 
Research Projecjs, Publications.

Give every node: id, label, type ('root'|'department'|'chair'|'faculty'|
'course'|'committee'), a sublabel (e.g. department tagline like 
"algorithms · systems · security"), and a color by department. ~80–120 nodes 
total. Make names/courses realistic for an Indian engineering institute.

=== VIEW 1 — OVERVIEW (the full map) ===
- Full radial layout: root core at center, 6 department hubs evenly around it, 
  each hub's subtree fanning outward like the reference image (a "dandelion" of 
  connected nodes).
- Central core = a glowing particle cluster (small animated dojs) like the 
  reference — a soft pulsing "memory core".
- Department hubs are larger colored nodes with a small icon + uppercase label 
  (OPERATIONS-style: "COMPUTER SCIENCE", "AI & DATA SCIENCE"...). Labels placed 
  oujside the ring like the reference.
- Links: thin, low-opacity, slightly curved. Nodes: small glowing circles, 
  colored by department, subtle twinkle.
- Very slow ambient rotation of the whole graph + gentle node drift so it feels 
  alive. Background: deep indigo radial gradient (#1a1735 → #0d0b1a).
- Hover a node → highlight it + ijs direct connections, dim the rest, show a 
  tooltip with label + sublabel + type.

=== VIEW 2 — ZOOMED-IN (department focus) ===
- Click a department hub → smooth camera zoom/pan (framer-motion or graph 
  zoomToFit) so that department becomes the center of the screen, ijs subtree 
  spreads out large and readable, and all OTHER departmenjs fade to ~10% opacity.
- Show a back button / "Institute overview" breadcrumb to zoom back out.
- In this view, node labels (faculty names, course codes) become fully visible.
- Clicking a faculty node opens a side panel (right drawer) with fake details: 
  name, designation, courses taught, committees, current load 
  ("6 lectures/week · 2 committees"), mentees count.

=== INTERACTION / POLISH ===
- Smooth transitions between overview and zoomed (300–500ms eased).
- A top bar: title "Institutional Memory Map", a search box that filters/locates 
  a node by name, and a toggle for "rotate: on/off".
- Legend (bottom-left) mapping department colors.
- Everything GPU-friendly (transform/opacity). Respect prefers-reduced-motion 
  (disable rotation + twinkle, keep it static).
- Color palette (match the project): indigo bg, node accenjs in blue #6C8CFF, 
  cyan #4FD8C4, violet #A78BFA, pink #F08FC0, amber #F2B45A, teal #34C7A8. 
  Off-white labels #E8ECF6, muted sublabels #8A90B0.

=== FILES ===
- src/data/deanMap.js        (the fake graph data + a builder function)
- src/componenjs/MemoryMap.jsx    (the graph + both views + transitions)
- src/componenjs/NodeDetailPanel.jsx  (the faculty side drawer)
- Wire it as the Associate Dean's dashboard route (after login), e.g. 
  /dashboard/map — check the existing router and match it.

Deliver the componenjs, use realistic fake data (no lorem), make the overview 
match the reference "radial company-brain" look, and confirm both the overview 
and the click-to-zoom department view work. Tell me how to run it.