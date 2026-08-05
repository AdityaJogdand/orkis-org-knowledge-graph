// ──────────────────────────────────────────────────────────────────────────────
// Institutional Memory Graph — Associate Dean, School of Technology
// Realistic fake data for NMIMS STME (generalises to any Indian eng. institute)
// ──────────────────────────────────────────────────────────────────────────────

// ── Department colour palette ─────────────────────────────────────────────────
const PALETTE = {
  cse:  '#6C8CFF', // blue
  ai:   '#4FD8C4', // cyan
  extc: '#A78BFA', // violet
  mech: '#F2B45A', // amber
  exam: '#F08FC0', // pink
  res:  '#34C7A8', // teal
};

// ── Builder ───────────────────────────────────────────────────────────────────
export function buildDeanMap() {
  const nodes = [];
  const links = [];

  const n = (node) => { nodes.push(node); return node; };
  const l = (source, target, cross = false) =>
    links.push({ source, target, cross });

  const col = (dept) => PALETTE[dept];

  // ── ROOT ────────────────────────────────────────────────────────────────────
  n({
    id: 'root',
    label: 'Associate Dean — School of Technology',
    sublabel: 'NMIMS · School of Technology & Management Engineering',
    type: 'root',
    color: '#E8ECF6',
  });

  // ── DEPARTMENT DEFINITIONS ──────────────────────────────────────────────────
  const DEPTS = [
    { id: 'cse',  label: 'Computer Science & Engineering',    sublabel: 'algorithms · systems · security'    },
    { id: 'ai',   label: 'AI & Data Science',                 sublabel: 'intelligence · analytics · vision'  },
    { id: 'extc', label: 'Electronics & Telecommunication',   sublabel: 'signals · circuits · wireless'      },
    { id: 'mech', label: 'Mechanical Engineering',            sublabel: 'design · thermal · manufacturing'   },
    { id: 'exam', label: 'Examinations & Academic Affairs',   sublabel: 'assessments · timetables · results' },
    { id: 'res',  label: 'Research & Accreditation',          sublabel: 'NAAC · NBA · publications'          },
  ];

  for (const d of DEPTS) {
    n({ id: `dept-${d.id}`, label: d.label, sublabel: d.sublabel,
        type: 'department', department: d.id, color: PALETTE[d.id] });
    l('root', `dept-${d.id}`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // COMPUTER SCIENCE & ENGINEERING
  // ────────────────────────────────────────────────────────────────────────────
  n({ id: 'chair-cse', label: 'Dr. Rajesh Nair',
      sublabel: 'Programme Chairperson · CSE',
      type: 'chair', department: 'cse', color: col('cse') });
  l('dept-cse', 'chair-cse');

  const cseFaculty = [
    { id: 'fac-cse-1', label: 'Dr. Priya Sharma',     sublabel: 'Associate Prof. · Databases & Networks'  },
    { id: 'fac-cse-2', label: 'Dr. Anand Mehta',      sublabel: 'Professor · OS & Distributed Systems'   },
    { id: 'fac-cse-3', label: 'Dr. Kavitha Krishnan', sublabel: 'Associate Prof. · Algorithms & Compilers'},
    { id: 'fac-cse-4', label: 'Dr. Suresh Patel',     sublabel: 'Asst. Prof. · Security & Cloud'         },
    { id: 'fac-cse-5', label: 'Dr. Neha Joshi',       sublabel: 'Asst. Prof. · SE & Web Technologies'    },
  ];
  for (const f of cseFaculty) {
    n({ ...f, type: 'faculty', department: 'cse', color: col('cse') });
    l('dept-cse', f.id);
  }

  const cseCourses = [
    { id: 'crs-cs101', label: 'CS101 — Programming Fundamentals in C',    fac: 'fac-cse-3' },
    { id: 'crs-cs201', label: 'CS201 — Data Structures & Algorithms',     fac: 'fac-cse-2' },
    { id: 'crs-cs301', label: 'CS301 — Database Management Systems',      fac: 'fac-cse-1' },
    { id: 'crs-cs302', label: 'CS302 — Design & Analysis of Algorithms',  fac: 'fac-cse-3' },
    { id: 'crs-cs401', label: 'CS401 — Operating Systems',                fac: 'fac-cse-2' },
    { id: 'crs-cs402', label: 'CS402 — Compiler Design',                  fac: 'fac-cse-3' },
    { id: 'crs-cs403', label: 'CS403 — Information & Cybersecurity',      fac: 'fac-cse-4' },
    { id: 'crs-cs501', label: 'CS501 — Computer Networks',                fac: 'fac-cse-1' },
    { id: 'crs-cs502', label: 'CS502 — Software Engineering',             fac: 'fac-cse-5' },
    { id: 'crs-cs503', label: 'CS503 — Cloud Computing & DevOps',         fac: 'fac-cse-4' },
    { id: 'crs-cs504', label: 'CS504 — Web Technologies & Frameworks',    fac: 'fac-cse-5' },
    { id: 'crs-cs601', label: 'CS601 — Cryptography & Network Security',  fac: 'fac-cse-1' },
    { id: 'crs-cs602', label: 'CS602 — Distributed Systems',              fac: 'fac-cse-2' },
  ];
  for (const c of cseCourses) {
    n({ id: c.id, label: c.label, type: 'course', department: 'cse', color: col('cse') });
    l(c.fac, c.id);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // AI & DATA SCIENCE
  // ────────────────────────────────────────────────────────────────────────────
  n({ id: 'chair-ai', label: 'Dr. Meera Iyer',
      sublabel: 'Programme Chairperson · AI & DS',
      type: 'chair', department: 'ai', color: col('ai') });
  l('dept-ai', 'chair-ai');

  const aiFaculty = [
    { id: 'fac-ai-1', label: 'Dr. Rohit Kulkarni',  sublabel: 'Professor · ML & Deep Learning'        },
    { id: 'fac-ai-2', label: 'Dr. Shalini Verma',   sublabel: 'Associate Prof. · Data Mining & Stats' },
    { id: 'fac-ai-3', label: 'Dr. Vijay Rajan',     sublabel: 'Associate Prof. · Vision & RL'         },
    { id: 'fac-ai-4', label: 'Dr. Pooja Desai',     sublabel: 'Asst. Prof. · Python & BI'             },
    { id: 'fac-ai-5', label: 'Dr. Arjun Nambiar',   sublabel: 'Asst. Prof. · Neural Nets & GenAI'     },
  ];
  for (const f of aiFaculty) {
    n({ ...f, type: 'faculty', department: 'ai', color: col('ai') });
    l('dept-ai', f.id);
  }

  const aiCourses = [
    { id: 'crs-ai301', label: 'AI301 — Machine Learning',                fac: 'fac-ai-1' },
    { id: 'crs-ai302', label: 'AI302 — Statistical Methods for AI',      fac: 'fac-ai-2' },
    { id: 'crs-ai303', label: 'AI303 — Neural Networks & Architectures', fac: 'fac-ai-5' },
    { id: 'crs-ai401', label: 'AI401 — Deep Learning',                   fac: 'fac-ai-1' },
    { id: 'crs-ai402', label: 'AI402 — Computer Vision',                 fac: 'fac-ai-3' },
    { id: 'crs-ai403', label: 'AI403 — Natural Language Processing',     fac: 'fac-ai-1' },
    { id: 'crs-ai404', label: 'AI404 — Generative AI & LLMs',            fac: 'fac-ai-5' },
    { id: 'crs-ai501', label: 'AI501 — Reinforcement Learning',          fac: 'fac-ai-3' },
    { id: 'crs-ds201', label: 'DS201 — Python for Data Science',         fac: 'fac-ai-4' },
    { id: 'crs-ds301', label: 'DS301 — Data Mining & Warehousing',       fac: 'fac-ai-2' },
    { id: 'crs-ds302', label: 'DS302 — Business Intelligence & Viz',     fac: 'fac-ai-4' },
    { id: 'crs-ds401', label: 'DS401 — Big Data Analytics',              fac: 'fac-ai-2' },
  ];
  for (const c of aiCourses) {
    n({ id: c.id, label: c.label, type: 'course', department: 'ai', color: col('ai') });
    l(c.fac, c.id);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ELECTRONICS & TELECOMMUNICATION
  // ────────────────────────────────────────────────────────────────────────────
  n({ id: 'chair-extc', label: 'Dr. Sunita Bhattacharya',
      sublabel: 'Programme Chairperson · EXTC',
      type: 'chair', department: 'extc', color: col('extc') });
  l('dept-extc', 'chair-extc');

  const extcFaculty = [
    { id: 'fac-extc-1', label: 'Dr. Ramesh Pillai',  sublabel: 'Professor · Analog & Signals'          },
    { id: 'fac-extc-2', label: 'Dr. Lakshmi Menon',  sublabel: 'Associate Prof. · Digital & VLSI'      },
    { id: 'fac-extc-3', label: 'Dr. Deepak Jha',     sublabel: 'Associate Prof. · Communications & RF' },
    { id: 'fac-extc-4', label: 'Dr. Anjali Sharma',  sublabel: 'Asst. Prof. · Embedded Systems'        },
    { id: 'fac-extc-5', label: 'Dr. Kiran Rao',      sublabel: 'Asst. Prof. · Wireless & IoT'          },
  ];
  for (const f of extcFaculty) {
    n({ ...f, type: 'faculty', department: 'extc', color: col('extc') });
    l('dept-extc', f.id);
  }

  const extcCourses = [
    { id: 'crs-extc101', label: 'EXTC101 — Basic Electronics',                  fac: 'fac-extc-1' },
    { id: 'crs-extc201', label: 'EXTC201 — Analog Circuits & Systems',          fac: 'fac-extc-1' },
    { id: 'crs-extc202', label: 'EXTC202 — Digital Electronics & Logic',        fac: 'fac-extc-2' },
    { id: 'crs-extc203', label: 'EXTC203 — Microprocessors & Microcontrollers', fac: 'fac-extc-4' },
    { id: 'crs-extc301', label: 'EXTC301 — Signals & Systems',                  fac: 'fac-extc-1' },
    { id: 'crs-extc302', label: 'EXTC302 — VLSI Design',                        fac: 'fac-extc-2' },
    { id: 'crs-extc303', label: 'EXTC303 — Communication Systems',              fac: 'fac-extc-3' },
    { id: 'crs-extc304', label: 'EXTC304 — Embedded Systems Design',            fac: 'fac-extc-4' },
    { id: 'crs-extc401', label: 'EXTC401 — Antenna & Wave Propagation',         fac: 'fac-extc-3' },
    { id: 'crs-extc402', label: 'EXTC402 — Wireless & Mobile Networks',         fac: 'fac-extc-5' },
    { id: 'crs-extc501', label: 'EXTC501 — Internet of Things',                 fac: 'fac-extc-5' },
    { id: 'crs-extc502', label: 'EXTC502 — RF Circuit Design',                  fac: 'fac-extc-3' },
  ];
  for (const c of extcCourses) {
    n({ id: c.id, label: c.label, type: 'course', department: 'extc', color: col('extc') });
    l(c.fac, c.id);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // MECHANICAL ENGINEERING
  // ────────────────────────────────────────────────────────────────────────────
  n({ id: 'chair-mech', label: 'Dr. Ganesh Patil',
      sublabel: 'Programme Chairperson · Mechanical',
      type: 'chair', department: 'mech', color: col('mech') });
  l('dept-mech', 'chair-mech');

  const mechFaculty = [
    { id: 'fac-mech-1', label: 'Dr. Amit Tiwari',         sublabel: 'Professor · Mechanics & Thermodynamics'  },
    { id: 'fac-mech-2', label: 'Dr. Rekha Nair',          sublabel: 'Associate Prof. · Fluids & Heat Transfer' },
    { id: 'fac-mech-3', label: 'Dr. Santosh Kumar',       sublabel: 'Associate Prof. · Manufacturing & CNC'   },
    { id: 'fac-mech-4', label: 'Dr. Asha Krishnamurthy',  sublabel: 'Asst. Prof. · Design & FEA'              },
    { id: 'fac-mech-5', label: 'Dr. Pramod Yadav',        sublabel: 'Asst. Prof. · Robotics & Industrial Eng.' },
  ];
  for (const f of mechFaculty) {
    n({ ...f, type: 'faculty', department: 'mech', color: col('mech') });
    l('dept-mech', f.id);
  }

  const mechCourses = [
    { id: 'crs-me101', label: 'ME101 — Engineering Mechanics',      fac: 'fac-mech-1' },
    { id: 'crs-me102', label: 'ME102 — Engineering Drawing & CAD',  fac: 'fac-mech-2' },
    { id: 'crs-me201', label: 'ME201 — Thermodynamics',             fac: 'fac-mech-1' },
    { id: 'crs-me202', label: 'ME202 — Fluid Mechanics',            fac: 'fac-mech-2' },
    { id: 'crs-me301', label: 'ME301 — Manufacturing Processes',    fac: 'fac-mech-3' },
    { id: 'crs-me302', label: 'ME302 — Heat & Mass Transfer',       fac: 'fac-mech-2' },
    { id: 'crs-me303', label: 'ME303 — Machine Design',             fac: 'fac-mech-4' },
    { id: 'crs-me401', label: 'ME401 — CNC Machining & Automation', fac: 'fac-mech-3' },
    { id: 'crs-me402', label: 'ME402 — Robotics & Automation',      fac: 'fac-mech-5' },
    { id: 'crs-me403', label: 'ME403 — Finite Element Analysis',    fac: 'fac-mech-4' },
    { id: 'crs-me501', label: 'ME501 — Industrial Engineering',     fac: 'fac-mech-5' },
  ];
  for (const c of mechCourses) {
    n({ id: c.id, label: c.label, type: 'course', department: 'mech', color: col('mech') });
    l(c.fac, c.id);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // EXAMINATIONS & ACADEMIC AFFAIRS
  // ────────────────────────────────────────────────────────────────────────────
  n({ id: 'chair-exam', label: 'Dr. Vandana Deshmukh',
      sublabel: 'Controller of Examinations',
      type: 'chair', department: 'exam', color: col('exam') });
  l('dept-exam', 'chair-exam');

  const examFaculty = [
    { id: 'fac-exam-1', label: 'Prof. Nilesh Joshi',   sublabel: 'Exam Cell Officer · UG/PG'    },
    { id: 'fac-exam-2', label: 'Prof. Swati Kulkarni', sublabel: 'Timetable In-charge'          },
    { id: 'fac-exam-3', label: 'Prof. Rajan Bhat',     sublabel: 'Grievance Coordinator'        },
    { id: 'fac-exam-4', label: 'Prof. Anil Pawar',     sublabel: 'Academic Affairs Coordinator' },
  ];
  for (const f of examFaculty) {
    n({ ...f, type: 'faculty', department: 'exam', color: col('exam') });
    l('dept-exam', f.id);
  }

  const examCommittees = [
    { id: 'com-exam-cell',    label: 'Exam Cell Office',    sublabel: 'UG & PG examination logistics',        fac: 'fac-exam-1' },
    { id: 'com-timetable',    label: 'Timetable Committee', sublabel: 'Semester scheduling & clash resolution', fac: 'fac-exam-2' },
    { id: 'com-grievance',    label: 'Grievance Cell',      sublabel: 'Student complaints & redressal',        fac: 'fac-exam-3' },
    { id: 'com-invigilation', label: 'Invigilation Roster', sublabel: 'Duty allocation & supervision',         fac: 'fac-exam-4' },
  ];
  for (const c of examCommittees) {
    n({ id: c.id, label: c.label, sublabel: c.sublabel,
        type: 'committee', department: 'exam', color: col('exam') });
    l(c.fac, c.id);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RESEARCH & ACCREDITATION
  // ────────────────────────────────────────────────────────────────────────────
  n({ id: 'chair-res', label: 'Dr. Sudhir Wagle',
      sublabel: 'Research Dean & Accreditation Head',
      type: 'chair', department: 'res', color: col('res') });
  l('dept-res', 'chair-res');

  const resFaculty = [
    { id: 'fac-res-1', label: 'Dr. Meghna Pillai',  sublabel: 'NAAC Coordinator · Quality Assurance' },
    { id: 'fac-res-2', label: 'Dr. Jayesh Patel',   sublabel: 'NBA Coordinator · Programme Outcomes' },
    { id: 'fac-res-3', label: 'Dr. Uma Krishnan',   sublabel: 'Research Coordinator · Grants & IP'   },
  ];
  for (const f of resFaculty) {
    n({ ...f, type: 'faculty', department: 'res', color: col('res') });
    l('dept-res', f.id);
  }

  const resCommittees = [
    { id: 'com-naac',          label: 'NAAC Coordination',      sublabel: 'Self-study reports & peer teams',    fac: 'fac-res-1' },
    { id: 'com-nba',           label: 'NBA Coordination',       sublabel: 'Programme accreditation & POs',      fac: 'fac-res-2' },
    { id: 'com-research-proj', label: 'Research Projects',      sublabel: 'DST · SERB · industry grants',       fac: 'fac-res-3' },
    { id: 'com-publications',  label: 'Publications & Patents', sublabel: 'Journals · conferences · IP filing', fac: 'fac-res-3' },
  ];
  for (const c of resCommittees) {
    n({ id: c.id, label: c.label, sublabel: c.sublabel,
        type: 'committee', department: 'res', color: col('res') });
    l(c.fac, c.id);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CROSS-LINKS (cross: true — faint edges, multi-department roles)
  // ────────────────────────────────────────────────────────────────────────────
  l('fac-cse-1',  'com-naac',          true); // Dr. Priya Sharma on NAAC
  l('fac-cse-3',  'com-timetable',     true); // Dr. Kavitha Krishnan on Timetable Committee
  l('fac-ai-1',   'com-research-proj', true); // Dr. Rohit Kulkarni on Research Projects
  l('fac-ai-3',   'com-research-proj', true); // Dr. Vijay Rajan on Research Projects
  l('fac-extc-3', 'com-invigilation',  true); // Dr. Deepak Jha on Invigilation Roster
  l('fac-extc-5', 'com-nba',           true); // Dr. Kiran Rao on NBA
  l('fac-mech-1', 'com-naac',          true); // Dr. Amit Tiwari on NAAC (institute level)
  l('fac-mech-3', 'com-exam-cell',     true); // Dr. Santosh Kumar on Exam Cell

  // ── Console verification (check browser devtools on first load) ───────────
  const byType = nodes.reduce((acc, nd) => {
    acc[nd.type] = (acc[nd.type] ?? 0) + 1;
    return acc;
  }, {});
  const crossCount = links.filter(lk => lk.cross).length;
  console.group('[deanMap] Institutional Memory Graph');
  console.log(`Total nodes : ${nodes.length}`);
  console.log(`Total links : ${links.length}  (${crossCount} cross-dept)`);
  console.table(byType);
  console.groupEnd();

  return { nodes, links };
}

// ── Singleton (built once on module load) ─────────────────────────────────────
export const DEAN_MAP = buildDeanMap();

// ── Lookup helpers ────────────────────────────────────────────────────────────
export function nodeById(data, id) {
  return data.nodes.find(n => n.id === id);
}

export function neighborIds(data, id) {
  const ids = new Set();
  for (const lk of data.links) {
    if (lk.source === id) ids.add(lk.target);
    if (lk.target === id) ids.add(lk.source);
  }
  return ids;
}

export function deptNodes(data, deptId) {
  return data.nodes.filter(n => n.department === deptId);
}
