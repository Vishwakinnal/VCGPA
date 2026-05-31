# Implementation Plan - VCGPA Enhancements

This document outlines the design and execution steps for integrating the Electronics and Computer Science (ECS) branch, implementing a Target CGPA Prediction Engine, and enhancing PDF reports with automated QA testing.

---

## User Review Required

> [!IMPORTANT]
> **ECS Branch Curriculum**: Since VTU offers different custom curricula for specialized branches depending on whether the college is autonomous or affiliated, the ECS branch curriculum will default to a standard blend of ECE and CSE courses. Users can customize the subject names and codes inline.

---

## Proposed Changes

### Component 1: Branch Expansion (Phase 1)

Add full curriculum mapping for the **Electronics & Computer Science (ECS)** branch, integrating it into the branch selection flow.

#### [MODIFY] [app.js](file:///c:/Users/Vishwanath/Desktop/vcgpa%20-%20Copy/app.js)
* **Branch Definition**: Add `ECS: 'Electronics & Computer Science'` to the `BRANCHES` map.
* **Curriculum Definition**: Add `DATA.ECS` structure containing subjects for Sem 3 to 8. The curriculum structure will be a composite of key courses from CSE (like Data Structures, Operating Systems, and DBMS) and ECE (like Digital System Design, Microcontrollers, and Signals).
  * *Sem 3*: Engineering Mathematics, Digital System Design, Data Structures & Applications, ESC/ETC/PLC, Social Connect.
  * *Sem 4*: Microcontrollers, Database Management Systems, Analysis & Design of Algorithms, Biology for Engineers, Universal Human Values.
  * *Sem 5*: Software Engineering, Computer Networks, Mini Project, Research Methodology.
  * *Sem 6*: Embedded Systems, VLSI Design, Machine Learning, Open Elective, Project Phase-I.
  * *Sem 7*: Artificial Intelligence, Wireless Communication, Major Project Phase-II.
  * *Sem 8*: Professional Electives, Internship, Major Project Dissertation.

---

### Component 2: CGPA Prediction Engine (Phase 2)

Create an interactive mathematical solver helping students calculate the academic performance required in future semesters to meet a target CGPA.

#### [MODIFY] [index.html](file:///c:/Users/Vishwanath/Desktop/vcgpa%20-%20Copy/index.html)
* Add a **Target settings card** in the sidebar:
  * Input for Target CGPA (`id="targetCGPA"`, step `0.01`, min `4.0`, max `10.0`).
  * Input for Semesters Remaining (`id="semsRemaining"`, type number, min `1`, max `8`).
  * Output container (`id="predictionOutput"`) to display target feasibility and required SGPA.

#### [MODIFY] [app.js](file:///c:/Users/Vishwanath/Desktop/vcgpa%20-%20Copy/app.js)
* **Prediction Logic**: Implement `predictTargetCGPA()` called on target input changes.
  * Let $C_{\text{earned}}$ be the total credit hours of completed courses (courses with entered grades).
  * Let $GP_{\text{earned}}$ be the sum of $(\text{Grade Point} \times \text{Credits})$ for all passed courses.
  * Let $C_{\text{rem}}$ be the total credits of all remaining semesters (computed dynamically from the curriculum database for the remaining semesters specified by the user).
  * Let $T$ be the target CGPA.
  * Total Grade Points required: $GP_{\text{req}} = T \times (C_{\text{earned}} + C_{\text{rem}})$.
  * Grade Points to earn in future: $GP_{\text{future}} = GP_{\text{req}} - GP_{\text{earned}}$.
  * Required average SGPA: $\text{SGPA}_{\text{req}} = GP_{\text{future}} / C_{\text{rem}}$.
* **UI Feedback**:
  * If $\text{SGPA}_{\text{req}} > 10.0$: Mark as **Impossible** (Red badge).
  * If $9.0 < \text{SGPA}_{\text{req}} \le 10.0$: Mark as **Highly Challenging** (Gold badge).
  * If $4.0 \le \text{SGPA}_{\text{req}} \le 9.0$: Mark as **Achievable** (Green badge).
  * If $\text{SGPA}_{\text{req}} < 4.0$: Mark as **On Track** (Green badge - student needs less than passing average).

---

### Component 3: Enhanced PDF Reporting & QA (Phase 3)

Expand PDF export capability and perform automated regression checks.

#### [MODIFY] [app.js](file:///c:/Users/Vishwanath/Desktop/vcgpa%20-%20Copy/app.js)
* **PDF Report Updates**: Modify `pdf()` function to draw a "Target Projections" card at the bottom of Page 1 if a target CGPA is set.
* Render:
  * Current CGPA vs. Target CGPA comparison.
  * Semesters remaining.
  * Target status classification (e.g., Achievable).
  * Required future average SGPA.

#### [NEW] [test_suite.js](file:///c:/Users/Vishwanath/Desktop/vcgpa/test_suite.js)
* Create a dedicated unit testing script executing separate assertions to automatically validate calculations checking grade boundaries, detention rules, predictor engine algebra, and unfilled marks warnings.

---

### Component 4: Unfilled Course Marks Warning (Phase 4)

Add real-time visual styling and sidebar warnings when credit-bearing courses are left completely blank (unfilled) in started semesters.

#### [MODIFY] [app.js](file:///c:/Users/Vishwanath/Desktop/vcgpa/app.js)
* **Row Highlighting**: In `table()`, if a semester has at least one mark entered, highlight any credit-bearing course row in yellow if it lacks CIE or SEE marks (or lacks CIE for CIE-only courses).
* **Sidebar Warnings**: In `renderSide()`, append `"Course Marks (highlighted rows)"` to unfilled fields warnings when there are incomplete or unfilled marks in started semesters.
* **PDF Guard**: In `pdf()`, prompt confirmation if the report contains incomplete or unfilled course marks.

---

## Verification Plan

### Automated Calculations Tests
* Run `node test_suite.js` to verify:
  * Grade letter mappings and points.
  * Course detention rules (`CIE < 40%` yields DX and excludes credits).
  * Prediction math solver outputs.
  * Real-time warning logic for unfilled details and course marks.

### Manual Verification
1. Select the new **ECS** branch from the dropdown; verify that the subject listing updates to the new curriculum structure and semesters 3 to 8 load successfully.
2. Enter values in student profile and input marks for Sem 1 and Sem 2. Enter a Target CGPA of `8.50` with `6` semesters remaining. Confirm that the required SGPA is calculated correctly.
3. Start entering marks for a semester (e.g. Sem 3). Enter only one mark field and observe that other subjects are highlighted in yellow as unfilled. The warning container should show "Course Marks (highlighted rows)".
4. Export the PDF report and inspect the target projection block at the bottom of Page 1.
