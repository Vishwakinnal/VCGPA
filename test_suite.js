const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. Mock Browser Environment for Node.js Execution
// ============================================================================
const mockElement = {
  value: '',
  textContent: '',
  innerHTML: '',
  disabled: false,
  setAttribute: () => {},
  removeAttribute: () => {},
  addEventListener: () => {},
  onchange: null,
  oninput: null,
  onclick: null
};

global.window = {
  jspdf: {
    jsPDF: class {
      constructor() {
        this.pages = [{}];
      }
      setFillColor() {}
      rect() {}
      setTextColor() {}
      setFont() {}
      setFontSize() {}
      text() {}
      roundedRect() {}
      addPage() {
        this.pages.push({});
      }
      internal = {
        getNumberOfPages: () => this.pages.length
      };
      setPage(p) {}
      save() {}
    }
  }
};

global.document = {
  getElementById: (id) => {
    if (!global.document.elements[id]) {
      global.document.elements[id] = JSON.parse(JSON.stringify(mockElement));
    }
    return global.document.elements[id];
  },
  elements: {}
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

global.alert = () => {};

global.location = {
  reload: () => {}
};

// ============================================================================
// 2. Load and Eval app.js
// ============================================================================
const dataJsPath = path.join(__dirname, 'data.js');
const dataJsCode = fs.readFileSync(dataJsPath, 'utf8') + `
  global.BRANCHES = BRANCHES;
  global.firstYear = firstYear;
  global.firstYearFor = firstYearFor;
  global.DATA = DATA;
  global.s = s;
  global.rows = rows;
`;
eval(dataJsCode);

const appJsPath = path.join(__dirname, 'app.js');
const appJsCode = fs.readFileSync(appJsPath, 'utf8') + `
  global.state = state;
  global.grade = grade;
  global.courseGrade = courseGrade;
  global.sgpa = sgpa;
  global.cgpa = cgpa;
  global.predictTargetCGPA = predictTargetCGPA;
  global.total = total;
  global.max = max;
  global.allSems = allSems;
`;
eval(appJsCode);

// ============================================================================
// 3. Test Runner Definition
// ============================================================================
let passCount = 0;
let failCount = 0;
const assertions = [];

function assert(description, condition) {
  if (condition) {
    passCount++;
    assertions.push(`\x1b[32m✔ PASS:\x1b[0m ${description}`);
  } else {
    failCount++;
    assertions.push(`\x1b[31m✘ FAIL:\x1b[0m ${description}`);
  }
}

function resetTestState() {
  state.branch = 'CSE';
  state.group = 'physics';
  state.sem = 0;
  state.marks = {};
  state.custom = {};
  state.targetCGPA = '';
  state.semsRemaining = '';
  // Clear mock element values
  Object.keys(global.document.elements).forEach(k => {
    global.document.elements[k].value = '';
    global.document.elements[k].innerHTML = '';
    global.document.elements[k].textContent = '';
  });
}

function setTestMark(si, code, type, val) {
  state.marks[`${state.branch}|${state.group}|${si}|${code}|${type}`] = val;
}

// ============================================================================
// 4. Test Executions
// ============================================================================

console.log('Running VCGPA calculation and prediction unit tests...\n');

// Group A: Grade Boundaries
assert("Grade: 90% total yields Outstanding (O) grade", grade(90, 100).g === 'O');
assert("Grade: 90% total yields 10 grade points", grade(90, 100).p === 10);
assert("Grade: 89.9% total yields Excellent (A+) grade", grade(89.9, 100).g === 'A+');
assert("Grade: 80% total yields Excellent (A+) grade", grade(80, 100).g === 'A+');
assert("Grade: 80% total yields 9 grade points", grade(80, 100).p === 9);
assert("Grade: 70% total yields Very Good (A) grade", grade(70, 100).g === 'A');
assert("Grade: 60% total yields Good (B+) grade", grade(60, 100).g === 'B+');
assert("Grade: 55% total yields Above Average (B) grade", grade(55, 100).g === 'B');
assert("Grade: 50% total yields Average (C) grade", grade(50, 100).g === 'C');
assert("Grade: 40% total yields Pass (P) grade", grade(40, 100).g === 'P');
assert("Grade: 39.9% total yields Fail (F) grade", grade(39.9, 100).g === 'F');
assert("Grade: 0% total yields Fail (F) grade", grade(0, 100).g === 'F');

// Group B: Detention Rules
// Course with SEE: Max CIE = 50, Max SEE = 50
const subNonCie = { code: 'TEST_SUB_1', credits: 3, maxCIE: 50, maxSEE: 50, cieOnly: false };

resetTestState();
setTestMark(2, 'TEST_SUB_1', 'cie', 19.5); // < 40% of 50
setTestMark(2, 'TEST_SUB_1', 'see', 45);
assert("Detention: CIE < 40% (19.5/50) yields DX grade", courseGrade(2, subNonCie).g === 'DX');
assert("Detention: DX course sets include = false", courseGrade(2, subNonCie).include === false);

resetTestState();
setTestMark(2, 'TEST_SUB_1', 'cie', 20.0); // 40% of 50
setTestMark(2, 'TEST_SUB_1', 'see', 45);
assert("Detention: CIE = 40% (20/50) does not yield DX", courseGrade(2, subNonCie).g !== 'DX');
assert("Detention: Normal course sets include = true", courseGrade(2, subNonCie).include === true);

// CIE-only course
const subCieOnly = { code: 'TEST_SUB_2', credits: 3, maxCIE: 50, maxSEE: 0, cieOnly: true };
resetTestState();
setTestMark(2, 'TEST_SUB_2', 'cie', 19.5); // CIE < 40% but CIE-only
assert("Detention: CIE-only course with CIE < 40% does not yield DX", courseGrade(2, subCieOnly).g === 'F');
assert("Detention: CIE-only failed course sets include = true", courseGrade(2, subCieOnly).include === true);

// Group C: SGPA Calculations
resetTestState();
state.group = 'physics';
// Set up Semester 1 (Physics Cycle) marks (total 20 credits):
// 1. BMATS101 (4 cr) -> CIE: 45, SEE: 45 (Total 90 -> O: 10 GP) -> 40 points
setTestMark(0, 'BMATS101', 'cie', 45); setTestMark(0, 'BMATS101', 'see', 45);
// 2. BPHYS102 (4 cr) -> CIE: 40, SEE: 40 (Total 80 -> A+: 9 GP) -> 36 points
setTestMark(0, 'BPHYS102', 'cie', 40); setTestMark(0, 'BPHYS102', 'see', 40);
// 3. BPOPS103 (3 cr) -> CIE: 35, SEE: 35 (Total 70 -> A: 8 GP) -> 24 points
setTestMark(0, 'BPOPS103', 'cie', 35); setTestMark(0, 'BPOPS103', 'see', 35);
// 4. BESCK104x (3 cr) -> CIE: 30, SEE: 30 (Total 60 -> B+: 7 GP) -> 21 points
setTestMark(0, 'BESCK104x', 'cie', 30); setTestMark(0, 'BESCK104x', 'see', 30);
// 5. BETCK105x / BPLCK105x (3 cr) -> CIE: 28, SEE: 27 (Total 55 -> B: 6 GP) -> 18 points
setTestMark(0, 'BETCK105x / BPLCK105x', 'cie', 28); setTestMark(0, 'BETCK105x / BPLCK105x', 'see', 27);
// 6. BENGK106 / BPWSK106 (1 cr) -> CIE: 25, SEE: 25 (Total 50 -> C: 5 GP) -> 5 points
setTestMark(0, 'BENGK106 / BPWSK106', 'cie', 25); setTestMark(0, 'BENGK106 / BPWSK106', 'see', 25);
// 7. BICOK107 / BKSKK107 (1 cr) -> CIE: 20, SEE: 20 (Total 40 -> P: 4 GP) -> 4 points
setTestMark(0, 'BICOK107 / BKSKK107', 'cie', 20); setTestMark(0, 'BICOK107 / BKSKK107', 'see', 20);
// 8. BSFHK158 / BIDTK158 (1 cr) -> CIE: 20, SEE: 15 (Total 35 -> F: 0 GP) -> 0 points
setTestMark(0, 'BSFHK158 / BIDTK158', 'cie', 20); setTestMark(0, 'BSFHK158 / BIDTK158', 'see', 15);

// Expected SGPA = 148 / 20 = 7.40
const computedSGPA = sgpa(0);
console.log('COMPUTED SGPA:', computedSGPA);
if (computedSGPA) {
  allSems()[0].subs.forEach(sub => {
    console.log(`Sub: ${sub.code}, CIE: ${state.marks[key(0, sub.code, 'cie')]}, SEE: ${state.marks[key(0, sub.code, 'see')]}, Total: ${total(0, sub)}, Grade: ${courseGrade(0, sub).g}, GP: ${courseGrade(0, sub).p}`);
  });
}
assert("SGPA Calculation: 8 subjects, sum GP=148, cr=20 expects 7.40", computedSGPA && computedSGPA.sgpa === '7.40');

// Scenario 1: Target = 8.00 (Total required = 8 * 42 = 336. Future points needed = 336 - 148 = 188. Required SGPA = 188 / 22 = 8.55)
state.targetCGPA = '8.00';
state.semsRemaining = '1';
predictTargetCGPA();
let outputHTML = global.document.getElementById('predictionOutput').innerHTML;
console.log('PREDICTOR OUTPUT HTML (Target 8.00):', outputHTML);
assert("Predictor (Achievable): Required future SGPA is 8.55", outputHTML.includes('8.55'));
assert("Predictor (Achievable): Feasibility status shows 'Achievable' badge", outputHTML.includes('Achievable') && outputHTML.includes('first'));

// Scenario 2: Target = 9.50 (Total required = 9.5 * 42 = 399. Future needed = 399 - 148 = 251. Required SGPA = 251 / 22 = 11.41)
state.targetCGPA = '9.50';
predictTargetCGPA();
outputHTML = global.document.getElementById('predictionOutput').innerHTML;
assert("Predictor (Impossible): Required future SGPA is 11.41", outputHTML.includes('11.41'));
assert("Predictor (Impossible): Feasibility status shows 'Impossible' badge", outputHTML.includes('Impossible') && outputHTML.includes('fail'));

// Scenario 3: Target = 8.50 (Total required = 8.5 * 42 = 357. Future needed = 357 - 148 = 209. Required SGPA = 209 / 22 = 9.50)
state.targetCGPA = '8.50';
predictTargetCGPA();
outputHTML = global.document.getElementById('predictionOutput').innerHTML;
assert("Predictor (Challenging): Required future SGPA is 9.50", outputHTML.includes('9.50'));
assert("Predictor (Challenging): Feasibility status shows 'Highly Challenging' badge", outputHTML.includes('Highly Challenging') && outputHTML.includes('dist'));

// Scenario 4: Target = 5.00 (Total required = 5.0 * 42 = 210. Future needed = 210 - 148 = 62. Required SGPA = 62 / 22 = 2.82)
state.targetCGPA = '5.00';
predictTargetCGPA();
outputHTML = global.document.getElementById('predictionOutput').innerHTML;
assert("Predictor (On Track): Required future SGPA is 2.82", outputHTML.includes('2.82'));
assert("Predictor (On Track): Feasibility status shows 'On Track' badge", outputHTML.includes('On Track') && outputHTML.includes('first'));

// ============================================================================
// 5. Print Summary Results
// ============================================================================
console.log('\n========================================');
console.log('TEST SUITE EXECUTION SUMMARY');
console.log('========================================');
assertions.forEach(log => console.log(log));
console.log('----------------------------------------');
console.log(`TOTAL: ${passCount + failCount} | PASS: ${passCount} | FAIL: ${failCount}`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
