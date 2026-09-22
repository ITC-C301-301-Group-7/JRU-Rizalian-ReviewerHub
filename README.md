# Student Portal & Reviewer Community Hub

A modern web application built with **React** and **Vite**, featuring an interactive **Student Dashboard** and a collaborative **Reviewer Community** platform.

---

## 🚀 What Was Built (Project Overview)

Here is a summary of the key features, architecture, and UI components implemented in this repository so team members can quickly understand what was done in the codebase:

### 1. Student Dashboard (`StudentDashboardPreview.jsx`)
* **Dynamic Student Profile Header**: Displays student identity metadata including ID, College, Program, GPA, and Honor Points.
* **4-Tab Interactive Navigation**:
  * **Overview & Schedule**: Displays current class schedules, room assignments, faculty information, and quick announcements.
  * **My Courses**: Lists enrolled subjects and current grade performance.
  * **Study Reviewers & Files**: Interactive study material repository with real-time text searching and automated file download simulation using client-side Blob generation.
  * **Rules & Policies**: Cleanly displays **5 structured institutional guidelines** governing acceptable portal usage and academic integrity.
* **Navigation Handlers**: Supports callback-driven tab switching and full routing to the Reviewer Community Hub via `onNavigate`.

### 2. Tech Stack & Dependencies

| Library / Tool | Description & Usage |
| :--- | :--- |
| **React 18** | Core UI library (`useState`, `useMemo` hooks for reactive state and search filtering). |
| **Vite** | Next-generation frontend build tool and hot-module replacement (HMR) server. |
| **Lucide React** | Icon library (`BookOpen`, `ShieldCheck`, `Download`, `GraduationCap`, `Lock`, etc.). |
| **Tailwind CSS** | Responsive styling, grid/flex layouts, modern color palettes, and glassmorphism UI elements. |

---
