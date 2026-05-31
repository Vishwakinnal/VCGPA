# VCGPA – Smart VTU 2022 Scheme GPA & CGPA Calculator

VCGPA is a responsive, client-side web application designed to help engineering students under the Visvesvaraya Technological University (VTU) 2022 Scheme calculate, track, and forecast their academic performance.

---

## 🌟 Key Features

* **VTU 2022 Scheme Mappings**: Preloaded branch curricula for semesters 3 to 8, including:
  * Computer Science & Engineering (CSE)
  * Information Science & Engineering (ISE)
  * Electronics & Communication Engineering (ECE)
  * Electrical & Electronics Engineering (EEE)
  * Civil Engineering (CV)
  * Mechanical Engineering (ME)
  * **Electronics & Computer Science (ECS)** *(Newly Added)*
* **First-Year Group Selection**: Supports both the Physics and Chemistry cycle structures for semesters 1 and 2.
* **Inline Customization**: Subject names and course codes can be edited directly in the marks grid for autonomous colleges or specialized electives.
* **Target CGPA Predictor Card**: An interactive mathematical engine that computes the average SGPA required in remaining semesters to achieve a target CGPA.
* **VTU-Style provisional PDF Report**: Direct client-side provisional grade card generation incorporating student profile metadata, course grade breakdown tables, overall classification, and target projections.
* **Smart Academic Rules**:
  * Excludes non-credit courses (0 credits) and mandatory courses from SGPA/CGPA denominators.
  * Handles VTU **detention rules**: if CIE is less than 40% (for courses with SEE), the course is marked as detained (`DX`) and its credits are excluded from the semester denominator.
  * Checks SEE passing thresholds (minimum 35% of max SEE marks).

---

## 📂 File Architecture

* **[index.html](file:///c:/Users/Vishwanath/Desktop/vcgpa/index.html)**: The structured UI, responsive layout, sidebars, and DOM elements.
* **[styles.css](file:///c:/Users/Vishwanath/Desktop/vcgpa/styles.css)**: Theme colors (HSL-tailored blue/green/red/gold variables), hover micro-animations, and classification badges.
* **[data.js](file:///c:/Users/Vishwanath/Desktop/vcgpa/data.js)**: Static VTU curriculum configurations and preloaded course lists.
* **[app.js](file:///c:/Users/Vishwanath/Desktop/vcgpa/app.js)**: Global state controller, browser event listeners, math solvers, and PDF export logic.
* **[test_suite.js](file:///c:/Users/Vishwanath/Desktop/vcgpa/test_suite.js)**: Node.js testing script emulating browser runtime.
* **[server.js](file:///c:/Users/Vishwanath/Desktop/vcgpa/server.js)**: Lightweight dev web server hosting the application locally.
* **[docs/architecture.md](file:///c:/Users/Vishwanath/Desktop/vcgpa/docs/architecture.md)**: Technical spec of variables, state keys, and calculation pipelines.

---

## 🛠️ Getting Started

### 1. Run the Application Locally
To host and preview the web app on your local machine, run the built-in development server using Node.js:
```bash
node server.js
```
Open your browser and navigate to: **[http://localhost:8080](http://localhost:8080)**

### 2. Run the Unit Test Suite
To execute the automated QA checks covering grading, detentions, and target forecasting algebra:
```bash
node test_suite.js
```
All 27 assertions are executed directly in Node.js by mocking DOM and LocalStorage.

---

## 📐 Mathematical Models

For full details on data keys, see [architecture.md](file:///c:/Users/Vishwanath/Desktop/vcgpa/docs/architecture.md).

* **SGPA Formula**:
  $$\text{SGPA} = \frac{\sum (\text{Grade Point} \times \text{Credits})}{\sum \text{Credits}}$$
  *Note: Excludes courses with 0 credits and courses marked detained (`DX`).*

* **Predictor Solver**:
  To achieve a target CGPA ($T$) with $R$ semesters remaining, the required future average SGPA is solved as:
  $$\text{SGPA}_{\text{req}} = \frac{T \times (C_{\text{earned}} + C_{\text{rem}}) - GP_{\text{earned}}}{C_{\text{rem}}}$$
  Where:
  * $C_{\text{earned}}$ is the total credits completed so far.
  * $GP_{\text{earned}}$ is the total grade points earned so far.
  * $C_{\text{rem}}$ is the sum of syllabus credits in the remaining $R$ semesters.
