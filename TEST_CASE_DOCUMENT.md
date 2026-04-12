# TEST CASE DOCUMENT

---

| **Document Title**     | Test Case Document — NBAC (NBA Accreditation) Report System |
|------------------------|--------------------------------------------------------------|
| **Project Name**       | NBAC Report — Outcome-Based Education Automation Platform    |
| **Version**            | 1.0                                                          |
| **Prepared By**        | Development Team                                             |
| **Date**               | April 06, 2026                                               |
| **Department**         | Computer Science & Engineering                               |
| **Document Type**      | Software Testing — Test Case Specification                   |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Scope of Testing](#2-scope-of-testing)
3. [Test Environment](#3-test-environment)
4. [Testing Methodology](#4-testing-methodology)
5. [Module 1 — Authentication & User Management](#5-module-1--authentication--user-management)
6. [Module 2 — Course Management](#6-module-2--course-management)
7. [Module 3 — Course Outcomes (CO) Management](#7-module-3--course-outcomes-co-management)
8. [Module 4 — CO-PO Matrix Management](#8-module-4--co-po-matrix-management)
9. [Module 5 — Marks Upload & Management](#9-module-5--marks-upload--management)
10. [Module 6 — Student Feedback](#10-module-6--student-feedback)
11. [Module 7 — Attainment Calculation](#11-module-7--attainment-calculation)
12. [Module 8 — Reports Generation](#12-module-8--reports-generation)
13. [Module 9 — Role-Based Access Control](#13-module-9--role-based-access-control)
14. [Summary & Test Results](#14-summary--test-results)

---

## 1. Introduction

### 1.1 Purpose

This document defines the test cases for the **NBAC (NBA Accreditation) Report System**, a full-stack web application built to automate the Outcome-Based Education (OBE) workflow for engineering colleges seeking NBA accreditation. The purpose of this document is to provide a structured and traceable record of all test cases, expected outcomes, and pass/fail criteria for the key functional modules of the system.

### 1.2 Project Background

Engineering colleges in India must submit detailed OBE reports to the **National Board of Accreditation (NBA)**. This platform automates:
- Definition of **Course Outcomes (COs)** and mapping to **Program Outcomes (POs)**
- Recording of student assessment marks across multiple assessment types
- Collection and processing of student feedback
- Automated calculation of **CO Attainment** (direct + indirect) and **PO Attainment**
- Generation of final **NBA-compliant reports** with attainment levels and NAAC grades

### 1.3 Objectives of Testing

- Verify that all functional modules behave as per the specified requirements.
- Ensure role-based access control is enforced correctly.
- Validate the accuracy of attainment calculation logic.
- Confirm that data integrity is maintained across all CRUD operations.
- Verify that the system handles edge cases and invalid inputs gracefully.

---

## 2. Scope of Testing

### 2.1 In-Scope

| # | Module / Feature |
|---|-----------------|
| 1 | User Registration, Login, and Logout |
| 2 | JWT Authentication and Token Refresh |
| 3 | Course Creation, Modification, and Deletion |
| 4 | Student Enrollment in Courses |
| 5 | Course Outcome (CO) CRUD Operations |
| 6 | CO-PO Correlation Matrix Setup |
| 7 | Marks Upload via Excel and Manual Entry |
| 8 | Student CO Feedback Submission |
| 9 | Infrastructure Feedback Submission |
| 10 | Attainment Calculation (Direct, Indirect, CO, PO) |
| 11 | NAAC Grade Computation |
| 12 | NBA Report Generation |
| 13 | Role-Based Access Control (Admin, Faculty, Student) |

### 2.2 Out-of-Scope

- Performance / Load Testing
- Security Penetration Testing
- Mobile Responsiveness Testing (device-specific)
- Third-party MongoDB Atlas infrastructure testing

---

## 3. Test Environment

| Parameter | Details |
|-----------|---------|
| **Backend Server** | Node.js ≥ 18, Express.js 4.x |
| **Frontend** | Next.js 16 (App Router), TypeScript |
| **Database** | MongoDB (via Mongoose 8.x) |
| **Backend URL** | `http://localhost:5000` |
| **Frontend URL** | `http://localhost:3000` |
| **Authentication** | JWT (Access Token: 15 min, Refresh Token: 7 days) |
| **API Format** | REST API — JSON over HTTP |
| **Browser** | Google Chrome (latest) |
| **Test Data** | Seeded via `node seed.js` |

### 3.1 Test Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@nbac.edu` | `admin123` |
| Faculty | *(seeded faculty email)* | `faculty123` |
| Student | *(seeded student email)* | `student123` |

---

## 4. Testing Methodology

### 4.1 Test Case Format

Each test case is documented with the following fields:

| Field | Description |
|-------|-------------|
| **TC ID** | Unique Test Case Identifier (e.g., TC-AUTH-01) |
| **Test Case Title** | Short descriptive title |
| **Pre-conditions** | Setup required before the test |
| **Test Steps** | Step-by-step instructions |
| **Test Data** | Input values used |
| **Expected Result** | The correct system behavior |
| **Actual Result** | Observed outcome (to be filled during testing) |
| **Status** | Pass / Fail / Pending |

### 4.2 Test Case ID Naming Convention

| Prefix | Module |
|--------|--------|
| `TC-AUTH` | Authentication |
| `TC-USR` | User Management |
| `TC-CRS` | Course Management |
| `TC-CO` | Course Outcomes |
| `TC-PO` | CO-PO Matrix |
| `TC-MRK` | Marks Management |
| `TC-FBK` | Feedback |
| `TC-ATT` | Attainment Calculation |
| `TC-RPT` | Reports |
| `TC-RBAC` | Role-Based Access Control |

---

## 5. Module 1 — Authentication & User Management

---

### TC-AUTH-01: Successful Admin Login

| Field | Details |
|-------|---------|
| **TC ID** | TC-AUTH-01 |
| **Title** | Successful login with valid Admin credentials |
| **Pre-conditions** | Backend and database are running; seed data is loaded |
| **Test Steps** | 1. Navigate to `http://localhost:3000/login` <br> 2. Enter email: `admin@nbac.edu` <br> 3. Enter password: `admin123` <br> 4. Click **Login** |
| **Test Data** | Email: `admin@nbac.edu`, Password: `admin123` |
| **Expected Result** | User is redirected to `/admin/dashboard`; JWT access token is stored; role-specific menu is shown |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-AUTH-02: Login with Invalid Credentials

| Field | Details |
|-------|---------|
| **TC ID** | TC-AUTH-02 |
| **Title** | Login attempt with incorrect password |
| **Pre-conditions** | Backend is running |
| **Test Steps** | 1. Navigate to `/login` <br> 2. Enter email: `admin@nbac.edu` <br> 3. Enter password: `wrongpassword` <br> 4. Click **Login** |
| **Test Data** | Email: `admin@nbac.edu`, Password: `wrongpassword` |
| **Expected Result** | Error message displayed: *"Invalid credentials"*; user remains on login page; no token issued |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-AUTH-03: Login with Empty Fields

| Field | Details |
|-------|---------|
| **TC ID** | TC-AUTH-03 |
| **Title** | Login attempt with empty email and password fields |
| **Pre-conditions** | None |
| **Test Steps** | 1. Navigate to `/login` <br> 2. Leave email and password fields blank <br> 3. Click **Login** |
| **Test Data** | Email: *(empty)*, Password: *(empty)* |
| **Expected Result** | Validation error messages displayed for both required fields; API call is not made |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-AUTH-04: Access Token Refresh

| Field | Details |
|-------|---------|
| **TC ID** | TC-AUTH-04 |
| **Title** | Verify that access token is refreshed using refresh token |
| **Pre-conditions** | User is logged in; access token has expired (wait 15 min or simulate expiry) |
| **Test Steps** | 1. Let the access token expire <br> 2. Perform any authenticated API request <br> 3. Observe if the system automatically requests a new access token via `/api/auth/refresh` |
| **Test Data** | Valid refresh token from previous login |
| **Expected Result** | System silently refreshes the access token and the original request succeeds; user is not logged out |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-AUTH-05: Logout

| Field | Details |
|-------|---------|
| **TC ID** | TC-AUTH-05 |
| **Title** | Successful logout clears session |
| **Pre-conditions** | User is logged in as Admin |
| **Test Steps** | 1. Click the **Logout** button <br> 2. Attempt to navigate to `/admin/dashboard` |
| **Test Data** | N/A |
| **Expected Result** | Refresh token is invalidated; user is redirected to `/login`; protected pages are inaccessible |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-USR-01: Admin Creates a New Faculty User

| Field | Details |
|-------|---------|
| **TC ID** | TC-USR-01 |
| **Title** | Admin successfully creates a new Faculty user |
| **Pre-conditions** | Logged in as Admin |
| **Test Steps** | 1. Navigate to `/admin/users` <br> 2. Click **Add User** <br> 3. Fill in: Name, Email, Password, Role = Faculty, Department <br> 4. Submit the form |
| **Test Data** | Name: `Dr. John Smith`, Email: `john@nbac.edu`, Password: `faculty123`, Role: `faculty`, Department: `CSE` |
| **Expected Result** | New faculty user is created and appears in the user list; password is stored as bcrypt hash in DB |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-USR-02: Admin Deactivates a User (Soft Delete)

| Field | Details |
|-------|---------|
| **TC ID** | TC-USR-02 |
| **Title** | Admin deactivates a user account |
| **Pre-conditions** | Logged in as Admin; target user exists |
| **Test Steps** | 1. Navigate to `/admin/users` <br> 2. Find the target user <br> 3. Click **Deactivate** |
| **Test Data** | Any existing active user |
| **Expected Result** | User's `isActive` flag is set to `false`; user can no longer login; record is preserved in the database (soft delete) |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-USR-03: New User Registration

| Field | Details |
|-------|---------|
| **TC ID** | TC-USR-03 |
| **Title** | New student self-registration via API |
| **Pre-conditions** | Backend is running |
| **Test Steps** | 1. Send `POST /api/auth/register` with valid student data |
| **Test Data** | `{ "name": "Alice", "email": "alice@college.edu", "password": "pass1234", "role": "student", "department": "CSE", "year": 3, "section": "A", "rollNumber": "20CS301" }` |
| **Expected Result** | HTTP 201 response; user is created with `isApproved: false`; account requires admin approval before login |
| **Actual Result** | |
| **Status** | Pending |

---

## 6. Module 2 — Course Management

---

### TC-CRS-01: Admin Creates a New Course

| Field | Details |
|-------|---------|
| **TC ID** | TC-CRS-01 |
| **Title** | Admin creates a course and assigns a faculty member |
| **Pre-conditions** | Logged in as Admin; at least one faculty user exists |
| **Test Steps** | 1. Navigate to `/admin/courses` <br> 2. Click **Add Course** <br> 3. Enter course details and select faculty <br> 4. Submit |
| **Test Data** | Course Code: `CS301`, Name: `Data Structures`, Department: `CSE`, Semester: `3`, Academic Year: `2025-26`, Credits: `4` |
| **Expected Result** | Course is created and visible in the course list; the assigned faculty's dashboard reflects the new course |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-CRS-02: Enroll Students in a Course

| Field | Details |
|-------|---------|
| **TC ID** | TC-CRS-02 |
| **Title** | Admin enrolls students into a course |
| **Pre-conditions** | Logged in as Admin; course and student accounts exist |
| **Test Steps** | 1. Open target course <br> 2. Use the **Enroll Students** option <br> 3. Select and add students |
| **Test Data** | Existing course ID; valid student user IDs |
| **Expected Result** | Selected students are added to `enrolledStudents` array of the course; students can see the course in their dashboard |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-CRS-03: Edit Course Details

| Field | Details |
|-------|---------|
| **TC ID** | TC-CRS-03 |
| **Title** | Faculty edits course description |
| **Pre-conditions** | Logged in as Faculty; course exists and belongs to this faculty |
| **Test Steps** | 1. Navigate to the course detail page <br> 2. Click **Edit** <br> 3. Change the description <br> 4. Save |
| **Test Data** | Updated description text |
| **Expected Result** | Course record is updated in the database; changes are reflected on the page |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-CRS-04: Deactivate a Course

| Field | Details |
|-------|---------|
| **TC ID** | TC-CRS-04 |
| **Title** | Admin deactivates a course |
| **Pre-conditions** | Logged in as Admin; course is active |
| **Test Steps** | 1. Navigate to `/admin/courses` <br> 2. Click **Deactivate** for the target course |
| **Test Data** | Existing active course |
| **Expected Result** | Course `isActive` is set to `false`; course is hidden from active listings but not deleted |
| **Actual Result** | |
| **Status** | Pending |

---

## 7. Module 3 — Course Outcomes (CO) Management

---

### TC-CO-01: Faculty Defines a Course Outcome

| Field | Details |
|-------|---------|
| **TC ID** | TC-CO-01 |
| **Title** | Faculty creates a new Course Outcome (CO) for a course |
| **Pre-conditions** | Logged in as Faculty; course exists |
| **Test Steps** | 1. Open course detail page <br> 2. Navigate to **CO Management** tab <br> 3. Click **Add CO** <br> 4. Fill in CO details and save |
| **Test Data** | CO Number: `CO1`, Description: `Students will be able to analyze algorithmic complexity`, Bloom's Level: `Analyze` |
| **Expected Result** | New CO is saved under the course; visible in the CO list with correct Bloom's taxonomy level |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-CO-02: Edit an Existing CO

| Field | Details |
|-------|---------|
| **TC ID** | TC-CO-02 |
| **Title** | Faculty edits an existing Course Outcome |
| **Pre-conditions** | Logged in as Faculty; at least one CO exists for the course |
| **Test Steps** | 1. Open CO Management tab <br> 2. Click **Edit** on an existing CO <br> 3. Modify the description <br> 4. Save changes |
| **Test Data** | Updated CO description |
| **Expected Result** | CO record is updated in the database; changes are reflected immediately in the UI |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-CO-03: Delete a Course Outcome

| Field | Details |
|-------|---------|
| **TC ID** | TC-CO-03 |
| **Title** | Faculty deletes a Course Outcome |
| **Pre-conditions** | Logged in as Faculty; CO exists for the course |
| **Test Steps** | 1. Open CO Management tab <br> 2. Click **Delete** on a CO <br> 3. Confirm deletion |
| **Test Data** | Existing CO ID |
| **Expected Result** | CO is removed from the database and no longer appears in the list |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-CO-04: Add CO with Invalid Bloom's Level

| Field | Details |
|-------|---------|
| **TC ID** | TC-CO-04 |
| **Title** | Attempt to create a CO with an invalid Bloom's taxonomy level |
| **Pre-conditions** | Logged in as Faculty |
| **Test Steps** | 1. Send `POST /api/co` with `bloomsLevel: "Unknown"` |
| **Test Data** | `{ "bloomsLevel": "Unknown" }` |
| **Expected Result** | HTTP 400 response; validation error message returned; CO is not created |
| **Actual Result** | |
| **Status** | Pending |

---

## 8. Module 4 — CO-PO Matrix Management

---

### TC-PO-01: Faculty Sets CO-PO Correlation Values

| Field | Details |
|-------|---------|
| **TC ID** | TC-PO-01 |
| **Title** | Faculty sets CO-PO correlation matrix for a course |
| **Pre-conditions** | Logged in as Faculty; COs exist for the course |
| **Test Steps** | 1. Navigate to **CO-PO Matrix** tab <br> 2. Enter correlation values (0–3) for each CO-PO pair <br> 3. Save the matrix |
| **Test Data** | CO1 → PO1: `3`, CO1 → PO2: `2`, CO1 → PO3: `0` |
| **Expected Result** | Matrix is saved; `POMatrix` document is created/updated in the database with correct values |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-PO-02: Update Existing CO-PO Matrix

| Field | Details |
|-------|---------|
| **TC ID** | TC-PO-02 |
| **Title** | Faculty updates correlation values in an existing matrix |
| **Pre-conditions** | CO-PO matrix already exists |
| **Test Steps** | 1. Open CO-PO Matrix tab <br> 2. Change a correlation value <br> 3. Save |
| **Test Data** | Change CO1 → PO1 from `3` to `1` |
| **Expected Result** | Matrix record is updated; new values reflected in the attainment calculation |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-PO-03: Invalid Correlation Value Entry

| Field | Details |
|-------|---------|
| **TC ID** | TC-PO-03 |
| **Title** | Attempt to enter a correlation value outside the 0–3 range |
| **Pre-conditions** | Logged in as Faculty |
| **Test Steps** | 1. In the CO-PO Matrix form, enter `5` for a CO-PO pair <br> 2. Attempt to save |
| **Test Data** | Correlation value: `5` |
| **Expected Result** | Validation error; value is rejected; matrix is not saved with invalid data |
| **Actual Result** | |
| **Status** | Pending |

---

## 9. Module 5 — Marks Upload & Management

---

### TC-MRK-01: Upload Marks via Excel File

| Field | Details |
|-------|---------|
| **TC ID** | TC-MRK-01 |
| **Title** | Faculty uploads student marks via an Excel file |
| **Pre-conditions** | Logged in as Faculty; course and COs exist; students are enrolled |
| **Test Steps** | 1. Navigate to **Marks Upload** tab <br> 2. Select assessment type: `Internal1` <br> 3. Upload a valid `.xlsx` file <br> 4. Submit |
| **Test Data** | Properly formatted Excel file with columns: Student Roll Number, Question Number, CO Mapped, Marks Obtained, Max Marks |
| **Expected Result** | Marks are parsed and stored in the `Marks` collection; success message displayed |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-MRK-02: Upload Oversized File

| Field | Details |
|-------|---------|
| **TC ID** | TC-MRK-02 |
| **Title** | Attempt to upload a file exceeding the 5 MB size limit |
| **Pre-conditions** | Logged in as Faculty |
| **Test Steps** | 1. Navigate to Marks Upload tab <br> 2. Select a file larger than 5 MB <br> 3. Submit |
| **Test Data** | Excel file > 5 MB |
| **Expected Result** | HTTP 413 error or client-side rejection; error message displayed; file is not uploaded |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-MRK-03: Upload Marks with Invalid File Type

| Field | Details |
|-------|---------|
| **TC ID** | TC-MRK-03 |
| **Title** | Attempt to upload a non-Excel file (e.g., PDF) |
| **Pre-conditions** | Logged in as Faculty |
| **Test Steps** | 1. Navigate to Marks Upload tab <br> 2. Select a `.pdf` file <br> 3. Submit |
| **Test Data** | A `.pdf` file |
| **Expected Result** | Error message: file type not supported; upload is rejected |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-MRK-04: Manual Marks Entry

| Field | Details |
|-------|---------|
| **TC ID** | TC-MRK-04 |
| **Title** | Faculty manually enters marks for a student |
| **Pre-conditions** | Logged in as Faculty; course, COs, and enrolled students exist |
| **Test Steps** | 1. Navigate to Marks Management <br> 2. Select manual entry mode <br> 3. Enter marks per CO per question for a student <br> 4. Save |
| **Test Data** | Student: seeded student, Assessment: `Assignment`, Q1 → CO1, Marks Obtained: `18`, Max Marks: `20` |
| **Expected Result** | Mark record is created in the database linked to the student, CO, and assessment type |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-MRK-05: Max Marks = 0 (Division by Zero Edge Case)

| Field | Details |
|-------|---------|
| **TC ID** | TC-MRK-05 |
| **Title** | System gracefully handles marks entry where Max Marks is 0 |
| **Pre-conditions** | Logged in as Faculty |
| **Test Steps** | 1. Submit marks entry with `maxMarks: 0` via API: `POST /api/marks` |
| **Test Data** | `{ "questions": [{ "maxMarks": 0, "marksObtained": 0, "coId": "..." }] }` |
| **Expected Result** | Record is skipped or a warning is returned; no division-by-zero error; system remains stable |
| **Actual Result** | |
| **Status** | Pending |

---

## 10. Module 6 — Student Feedback

---

### TC-FBK-01: Student Submits CO Feedback

| Field | Details |
|-------|---------|
| **TC ID** | TC-FBK-01 |
| **Title** | Student submits CO-level feedback ratings for a course |
| **Pre-conditions** | Logged in as Student; enrolled in the course; COs exist |
| **Test Steps** | 1. Navigate to student course detail page <br> 2. Open **Feedback** section <br> 3. Rate each CO on a scale of 1–5 <br> 4. Submit |
| **Test Data** | CO1: `4`, CO2: `3`, CO3: `5` |
| **Expected Result** | Feedback is stored in the `Feedback` collection linked to the student, course, and COs |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-FBK-02: Student Submits Infrastructure Feedback

| Field | Details |
|-------|---------|
| **TC ID** | TC-FBK-02 |
| **Title** | Student submits infrastructure feedback (Library, Transport, Canteen) |
| **Pre-conditions** | Logged in as Student |
| **Test Steps** | 1. Navigate to feedback section <br> 2. Rate Library, Transport, and Canteen facilities <br> 3. Submit |
| **Test Data** | Library: `4`, Transport: `3`, Canteen: `2` |
| **Expected Result** | Infrastructure feedback is stored; HTTP 201 returned |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-FBK-03: Prevent Duplicate Infrastructure Feedback

| Field | Details |
|-------|---------|
| **TC ID** | TC-FBK-03 |
| **Title** | System prevents a student from submitting infrastructure feedback twice |
| **Pre-conditions** | Student has already submitted infrastructure feedback |
| **Test Steps** | 1. Logged in as Student <br> 2. Attempt to submit infrastructure feedback again |
| **Test Data** | Same student, same academic period |
| **Expected Result** | HTTP 409 Conflict response; error message: *"Feedback already submitted"* |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-FBK-04: Faculty Views Feedback Summary

| Field | Details |
|-------|---------|
| **TC ID** | TC-FBK-04 |
| **Title** | Faculty views aggregated student feedback per CO |
| **Pre-conditions** | Logged in as Faculty; students have submitted CO feedback |
| **Test Steps** | 1. Open course detail <br> 2. Navigate to **Feedback** tab <br> 3. View per-CO average ratings |
| **Test Data** | N/A |
| **Expected Result** | Average rating per CO is displayed correctly; number of respondents is shown |
| **Actual Result** | |
| **Status** | Pending |

---

## 11. Module 7 — Attainment Calculation

---

### TC-ATT-01: Calculate CO Attainment

| Field | Details |
|-------|---------|
| **TC ID** | TC-ATT-01 |
| **Title** | System correctly calculates CO attainment for a course |
| **Pre-conditions** | Marks and feedback submitted for the course; CO-PO matrix set |
| **Test Steps** | 1. Navigate to **Attainment** tab <br> 2. Click **Calculate Attainment** |
| **Test Data** | Pre-loaded seeded course data |
| **Expected Result** | For each CO: `successPercentage`, `directAttainment`, `indirectAttainment`, and `finalAttainment` are calculated and displayed correctly as per the formula: `Final = (0.75 × Direct) + (0.25 × Indirect)` |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-ATT-02: Verify Direct Attainment Level Thresholds

| Field | Details |
|-------|---------|
| **TC ID** | TC-ATT-02 |
| **Title** | Direct attainment levels are assigned based on correct thresholds |
| **Pre-conditions** | Marks data is available |
| **Test Steps** | 1. Set marks such that `successPercentage` is exactly 70% <br> 2. Run attainment calculation |
| **Test Data** | 7 out of 10 students scoring ≥ 60% on CO1 |
| **Expected Result** | `directAttainment = 3` (since successPercentage ≥ 70%) |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-ATT-03: Verify Indirect Attainment Level from Feedback

| Field | Details |
|-------|---------|
| **TC ID** | TC-ATT-03 |
| **Title** | Indirect attainment level is assigned based on feedback average rating thresholds |
| **Pre-conditions** | Student feedback submitted |
| **Test Steps** | 1. Ensure average CO rating is between 3.5 and 4.49 <br> 2. Run attainment calculation |
| **Test Data** | Average feedback rating for CO1: `3.8` |
| **Expected Result** | `indirectAttainment = 2` (since averageRating ≥ 3.5) |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-ATT-04: PO Attainment Calculation

| Field | Details |
|-------|---------|
| **TC ID** | TC-ATT-04 |
| **Title** | PO Attainment is calculated correctly from CO-PO matrix and CO attainments |
| **Pre-conditions** | CO attainments calculated; CO-PO matrix set |
| **Test Steps** | 1. Trigger attainment calculation <br> 2. Review PO attainment values |
| **Test Data** | CO1 finalAttainment = `2.25`, CO1 → PO1 correlation = `3` |
| **Expected Result** | PO Attainment = `Σ(COAttainment × correlation) / Σ(correlations)` — computed correctly |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-ATT-05: PO with No CO Mapping Returns Null

| Field | Details |
|-------|---------|
| **TC ID** | TC-ATT-05 |
| **Title** | PO with no CO mapped returns null attainment value |
| **Pre-conditions** | CO-PO matrix set with all correlations for PO12 set to 0 |
| **Test Steps** | 1. Set all PO12 correlations to `0` <br> 2. Run attainment calculation |
| **Test Data** | All PO12 correlation values = `0` |
| **Expected Result** | `attainmentValue = null` for PO12; no error thrown |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-ATT-06: NAAC Grade Assignment

| Field | Details |
|-------|---------|
| **TC ID** | TC-ATT-06 |
| **Title** | Correct NAAC grade is assigned based on overall attainment percentage |
| **Pre-conditions** | Attainment has been calculated |
| **Test Steps** | 1. Arrange data such that `overallAttainmentPercentage` is 80% <br> 2. Check assigned grade |
| **Test Data** | `overallAttainmentPercentage = 80%` |
| **Expected Result** | `naacGrade = "A"` |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-ATT-07: Attainment with No Marks Data

| Field | Details |
|-------|---------|
| **TC ID** | TC-ATT-07 |
| **Title** | System handles attainment calculation when no marks are recorded |
| **Pre-conditions** | Course exists with COs but no marks uploaded |
| **Test Steps** | 1. Trigger attainment calculation for such a course |
| **Test Data** | Course with COs but no `Marks` documents |
| **Expected Result** | `successPercentage = 0`; system returns a warning about missing marks; no crash |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-ATT-08: Warn on Low Feedback Count

| Field | Details |
|-------|---------|
| **TC ID** | TC-ATT-08 |
| **Title** | System warns when fewer than 5 feedback responses are submitted |
| **Pre-conditions** | Only 3 students have submitted CO feedback |
| **Test Steps** | 1. Trigger attainment calculation |
| **Test Data** | 3 feedback submissions |
| **Expected Result** | Warning message: *"Insufficient feedback responses for statistical significance"*; calculation still proceeds |
| **Actual Result** | |
| **Status** | Pending |

---

## 12. Module 8 — Reports Generation

---

### TC-RPT-01: Admin Generates NBA Report

| Field | Details |
|-------|---------|
| **TC ID** | TC-RPT-01 |
| **Title** | Admin generates an NBA-compliant attainment report for a course |
| **Pre-conditions** | Logged in as Admin; attainment has been calculated for the course |
| **Test Steps** | 1. Navigate to `/admin/reports` <br> 2. Select the target course <br> 3. Click **Generate Report** |
| **Test Data** | Seeded course with full attainment data |
| **Expected Result** | Report is generated and displayed containing: CO attainments, PO attainments, overall percentage, and NAAC grade |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-RPT-02: Report for Course Without Attainment

| Field | Details |
|-------|---------|
| **TC ID** | TC-RPT-02 |
| **Title** | Attempt to generate a report for a course with no attainment data |
| **Pre-conditions** | Logged in as Admin; course exists but attainment has not been calculated |
| **Test Steps** | 1. Navigate to `/admin/reports` <br> 2. Select a course with no attainment calculated <br> 3. Try to generate report |
| **Test Data** | Course with no `Attainment` document |
| **Expected Result** | Informative message: *"Attainment not yet calculated for this course"*; no empty/corrupt report generated |
| **Actual Result** | |
| **Status** | Pending |

---

## 13. Module 9 — Role-Based Access Control

---

### TC-RBAC-01: Student Cannot Access Admin Dashboard

| Field | Details |
|-------|---------|
| **TC ID** | TC-RBAC-01 |
| **Title** | Student attempting to access admin-only routes is denied |
| **Pre-conditions** | Logged in as Student |
| **Test Steps** | 1. Manually navigate to `http://localhost:3000/admin/dashboard` <br> 2. Alternatively, call `GET /api/users` with student's JWT token |
| **Test Data** | Student JWT token |
| **Expected Result** | HTTP 403 Forbidden from API; frontend redirects to student dashboard or displays *"Access Denied"* |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-RBAC-02: Faculty Cannot Access Another Faculty's Course

| Field | Details |
|-------|---------|
| **TC ID** | TC-RBAC-02 |
| **Title** | Faculty cannot view or modify a course assigned to another faculty |
| **Pre-conditions** | Two faculty users exist with separate courses |
| **Test Steps** | 1. Logged in as Faculty A <br> 2. Send `GET /api/courses/{courseId}` using Course ID of Faculty B's course |
| **Test Data** | Course ID belonging to Faculty B |
| **Expected Result** | HTTP 403 Forbidden or HTTP 404 Not Found; data of Faculty B's course is not accessible |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-RBAC-03: Unauthenticated User Cannot Access Protected Routes

| Field | Details |
|-------|---------|
| **TC ID** | TC-RBAC-03 |
| **Title** | API request without a JWT token is rejected |
| **Pre-conditions** | No active session |
| **Test Steps** | 1. Send `GET /api/courses` without `Authorization` header |
| **Test Data** | No token |
| **Expected Result** | HTTP 401 Unauthorized; response body: `{ "message": "No token provided" }` or similar |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-RBAC-04: Admin Can Access All Courses

| Field | Details |
|-------|---------|
| **TC ID** | TC-RBAC-04 |
| **Title** | Admin has visibility over all courses across all departments |
| **Pre-conditions** | Logged in as Admin; multiple courses exist across departments |
| **Test Steps** | 1. Navigate to `/admin/courses` |
| **Test Data** | N/A |
| **Expected Result** | All courses from all faculties and departments are listed |
| **Actual Result** | |
| **Status** | Pending |

---

### TC-RBAC-05: Student Cannot Submit Marks

| Field | Details |
|-------|---------|
| **TC ID** | TC-RBAC-05 |
| **Title** | Student is not authorized to upload or modify marks |
| **Pre-conditions** | Logged in as Student |
| **Test Steps** | 1. Send `POST /api/marks` with student JWT token |
| **Test Data** | Student JWT token; valid marks payload |
| **Expected Result** | HTTP 403 Forbidden; marks are not uploaded |
| **Actual Result** | |
| **Status** | Pending |

---

## 14. Summary & Test Results

### 14.1 Test Case Summary

| Module | Total TCs | Passed | Failed | Pending |
|--------|-----------|--------|--------|---------|
| Authentication & User Management | 8 | — | — | 8 |
| Course Management | 4 | — | — | 4 |
| Course Outcomes (CO) | 4 | — | — | 4 |
| CO-PO Matrix | 3 | — | — | 3 |
| Marks Management | 5 | — | — | 5 |
| Feedback | 4 | — | — | 4 |
| Attainment Calculation | 8 | — | — | 8 |
| Reports Generation | 2 | — | — | 2 |
| Role-Based Access Control | 5 | — | — | 5 |
| **TOTAL** | **43** | **—** | **—** | **43** |

### 14.2 Entry & Exit Criteria

#### Entry Criteria
- Backend server is running on `http://localhost:5000`
- Frontend is running on `http://localhost:3000`
- Database is connected and seeded using `node seed.js`
- All user accounts (Admin, Faculty, Student) are accessible

#### Exit Criteria
- All 43 test cases have been executed
- All critical and high-priority test cases show **Pass** status
- Any failed test cases have been documented with bug reports
- Test results have been reviewed and signed off by the project supervisor

### 14.3 Defect Classification

| Priority | Description |
|----------|-------------|
| **Critical** | System crash, data loss, authentication bypass |
| **High** | Incorrect attainment calculation, broken core workflow |
| **Medium** | UI/UX issues, incorrect error messages |
| **Low** | Minor display issues, cosmetic defects |

---

*Document prepared for NBA Accreditation Report Project — Engineering College, Department of Computer Science & Engineering.*  
*Date: April 06, 2026*

---
