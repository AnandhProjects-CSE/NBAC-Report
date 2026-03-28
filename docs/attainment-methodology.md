# Attainment Calculation Methodology

## Overview

This document describes the complete attainment calculation logic used in the NBAC platform, derived directly from `nbac-backend/services/attainment.service.js`.

The system follows NBA (National Board of Accreditation) OBE (Outcome-Based Education) guidelines.

---

## Data Flow

```
Marks Upload → Success % per CO → Direct Attainment Level
                                                           ↘
                                                            Final CO Attainment → PO Attainment
                                                           ↗
Student Feedback → Average Rating → Indirect Attainment Level
```

---

## Step 1: Success Percentage per CO (from Marks)

For each Course Outcome (CO):

1. Collect all question-wise marks for all students across all assessment types (Internal 1, Internal 2, Assignment, External).
2. Sum `marksObtained` and `maxMarks` for all questions mapped to that CO per student.
3. Calculate each student's CO score percentage:
   ```
   studentCOScore% = (marksObtained / maxMarks) × 100
   ```
4. A student **attains** a CO if their score ≥ threshold (default: 60%).
5. Calculate success percentage:
   ```
   successPercentage = (studentsWhoAttained / totalStudents) × 100
   ```

**Edge case:** If no marks are mapped to a CO, `successPercentage = 0` and a warning is generated.

**Sample:**
| Student | CO1 Obtained | CO1 Max | CO1 Score% | Attained (≥60%)? |
|---------|-------------|---------|-----------|----------------|
| S1      | 18          | 25      | 72%       | ✅ Yes          |
| S2      | 12          | 25      | 48%       | ❌ No           |
| S3      | 20          | 25      | 80%       | ✅ Yes          |

→ CO1 Success% = (2/3) × 100 = **66.67%**

---

## Step 2: Direct Attainment Level (from Success Percentage)

```
successPercentage ≥ 70%  →  Direct Attainment = 3
successPercentage ≥ 60%  →  Direct Attainment = 2
successPercentage ≥ 50%  →  Direct Attainment = 1
successPercentage < 50%  →  Direct Attainment = 0
```

**Sample (continuing):**
- CO1 Success% = 66.67% → **Direct Attainment = 2**

---

## Step 3: Indirect Attainment Level (from Student Feedback)

Students rate each CO on a **1–5 star scale**.

1. Collect all feedback for the course.
2. Average all ratings per CO across all students:
   ```
   averageRating(CO) = sum(ratings) / count(ratings)
   ```
3. Normalize to attainment level (0–3):
   ```
   averageRating ≥ 4.5  →  Indirect Attainment = 3
   averageRating ≥ 3.5  →  Indirect Attainment = 2
   averageRating ≥ 2.5  →  Indirect Attainment = 1
   averageRating < 2.5  →  Indirect Attainment = 0
   ```

**Warning:** If fewer than 5 feedback responses are submitted, a warning is generated noting statistical insignificance.

**Sample:**
- CO1 received ratings: [4, 5, 3, 4, 4] → Average = 4.0 → **Indirect Attainment = 2**

---

## Step 4: Final CO Attainment (Weighted Formula)

```
Final CO Attainment = (0.75 × Direct Attainment) + (0.25 × Indirect Attainment)
```

Rounded to 2 decimal places.

**Rationale:** Direct assessment (marks) carries 75% weight; indirect assessment (student feedback) carries 25%.

**Sample:**
```
CO1 Final Attainment = (0.75 × 2) + (0.25 × 2) = 1.50 + 0.50 = 2.00
```

**Attainment Level Interpretation:**
| Range      | Level     |
|-----------|-----------|
| ≥ 2.5     | High (3)  |
| 1.5–2.49  | Medium (2)|
| 0.5–1.49  | Low (1)   |
| < 0.5     | Very Low (0)|

---

## Step 5: PO Attainment (Weighted from CO-PO Matrix)

For each PO (PO1–PO12):

1. Look up the CO-PO matrix correlation values (0 = no mapping, 1 = low, 2 = medium, 3 = high).
2. For each CO with correlation > 0:
   ```
   contribution = Final CO Attainment × correlation
   ```
3. Weighted average:
   ```
   PO Attainment = Σ(CO Attainment × correlation) / Σ(correlations)
   ```
4. If no COs map to a PO → `attainmentValue = null` (not applicable).

**Sample:**

CO-PO Matrix for PO1:
| CO  | Correlation | Final CO Attainment | Contribution |
|-----|------------|-------------------|-------------|
| CO1 | 3          | 2.00              | 6.00        |
| CO2 | 2          | 2.50              | 5.00        |
| CO3 | 0          | 1.75              | 0 (skipped) |

```
PO1 Attainment = (6.00 + 5.00) / (3 + 2) = 11.00 / 5 = 2.20
```

---

## NAAC Grade Derivation

Overall Attainment Percentage:
```
overallAttainmentPercentage = (averageCOAttainment / 3) × 100
```

Grading schema (configurable in `config/gradingSchema.js`):
| Percentage | Grade |
|-----------|-------|
| ≥ 90%     | A++   |
| ≥ 85%     | A+    |
| ≥ 80%     | A     |
| ≥ 75%     | B++   |
| ≥ 70%     | B+    |
| ≥ 60%     | B     |
| ≥ 0%      | C     |

---

## Infrastructure Feedback Rating

Infrastructure ratings (Library, Transport, Canteen) are independent of CO attainment. They are:
- Submitted once per student per facility per semester/academic year
- Stored in the `InfrastructureFeedback` collection
- Aggregated as average rating per facility type
- Included in Section 6 of the NAAC report for institutional improvement context

---

## Edge Cases Handled

| Scenario | Handling |
|---------|---------|
| No marks mapped to a CO | Success% = 0, warning generated |
| No feedback submitted | Indirect attainment = 0, no penalty |
| < 5 feedback responses | Warning generated about statistical significance |
| Division by zero (maxMarks = 0) | Skipped gracefully |
| PO with no CO mapping | `attainmentValue = null` |
| Invalid rating value | Mongoose validation rejects at model level |
| Duplicate infrastructure rating | Unique index prevents; 409 returned |
| Missing grading config | Falls back to "C" grade |
