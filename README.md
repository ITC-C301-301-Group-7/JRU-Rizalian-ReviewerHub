# JRU Rizalian ReviewerHub — Frontend

A React web app where JRU students and teachers share study reviewers. It talks to the Laravel API in `reviewerhub-backend`.

## Features

### Students
- **Student dashboard:** profile with a changeable picture, and tabs for Overview & Schedule, My Courses, Study Reviewers & Files, and Rules & Policies.
- **Class schedule:** add, edit and delete classes. Saved to your account.
- **Reviewer Community:** search and filter reviewers by college, upload your own, preview and download files, and see the contributor leaderboard.
- **Rate, comment and save:** give a 1–5 star rating, leave comments, and bookmark reviewers. Saved reviewers are listed under **Saved**.
- **QR codes:** share any reviewer as a QR code (save it as an image or copy the link). **Scan QR** opens a reviewer from the camera, a picture of a code, or a pasted link.
- **Document translation:** upload a PDF, Word (.docx), PowerPoint (.pptx) or image. The app reads the text in the browser (OCR for scans and photos), lets you correct it, then translates it into your language. Copy it or save it as `.txt`.

### Teachers (faculty)
- **Overview:** reviewer, submission and member counts, a 7-day upload chart, top contributors and recent uploads.
- **Manage Reviewers:** search, preview, download, edit details, hide or restore, and delete any reviewer.
- **Upload Resource:** publish a learning resource straight to the community.
- **Student Submissions:** review what students uploaded and hide anything that doesn't belong.
- **Community:** search students and faculty, with upload counts.
- Teachers can also use the community, Saved, QR scanner and translator.

## Tech stack

| Tool | Use |
|---|---|
| React 19 | UI |
| Vite | Dev server and build |
| Tailwind CSS 4 | Styling |
| Lucide React | Icons |
| `qrcode` | Generating QR codes |
| `jsqr` | Reading QR codes from the camera or a picture |
| `pdfjs-dist` | Reading PDF text and drawing pages for OCR |
| `tesseract.js` | OCR for scans and photos |
| `jszip` | Reading `.docx` and `.pptx` files |

## Getting started

Start the backend first (see `reviewerhub-backend/README.md`), then:

```powershell
cd jru-rizalian-reviewerhub
npm install
Copy-Item .env.example .env
npm run dev
```

Open the address Vite prints, usually `http://localhost:5173`.

### Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Laravel API address. Default `http://127.0.0.1:8000` |
| `VITE_PUBLIC_APP_URL` | Address placed inside generated QR codes. Defaults to the page's own address |

### Test accounts

- **Teacher:** choose Faculty on the login page, then Faculty ID `99-000001` (or `teacher@jru.edu.ph`) and password `Teacher123`. Created by `php artisan db:seed` in the backend.
- **Student:** register from the Sign Up page.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Check the code with oxlint |

## Project structure

```
src/
  App.jsx                    Sign-in, navigation, and app-wide modals
  components/
    LoginForm / SignUpForm / ForgotPasswordView
    StudentDashboardPreview  Student dashboard
    SchedulePanel            Class schedule (add / edit / delete)
    TeacherDashboard         Faculty dashboard
    ReviewerCommunityView    Reviewer feed, uploads, leaderboard
    ResourceDetailModal      Details, rating, bookmark, QR, comments
    QrShareModal / QrScannerModal
    BookmarksView            Saved reviewers
    DocumentTranslator       OCR and translation
    FeatureNav, PdfPreview, ContributorLeaderboardView, CampusFooter
  utils/
    Session.js               Token storage and API address
    Authedfile.js            Authenticated file download / preview
    teacherApi.js            API request helper and formatters
    documentText.js          Text extraction (PDF, DOCX, PPTX, OCR)
    translateClient.js       Sends text to the translation API in pieces
    languages.js             Language list for translation and OCR
    resourceLinks.js         Share links and QR deep links
    idValidation.js          Student and faculty ID format checks
```

## Notes and limits

- **Document translation:** old `.doc` and `.ppt` files can't be read. Save them as `.docx`, `.pptx` or PDF. Text inside pictures in Word or PowerPoint files isn't read. Export to PDF instead. Only the first 40 pages of a PDF are read, and files can be up to 20 MB.
- **OCR:** the first scan downloads a language file, so it needs internet and can take a minute.
- **Translation quota:** the free service has a small daily limit. See the backend README to raise it.
- **QR scanning on a phone:** browsers only allow the camera on `https://` or `localhost`. For same-Wi-Fi testing, run `npm run dev -- --host` and set `VITE_PUBLIC_APP_URL` to your computer's address, for example `http://192.168.1.5:5173`. Otherwise the QR codes point to `localhost`. Uploading a picture of a QR code works on any address.
- **Shared links:** a link like `/?resource=12` asks the user to sign in, then opens that reviewer.

## Troubleshooting

- **"Failed to resolve import ..." for a package:** run `npm install`.
- **"Failed to resolve import ./components/..." for a file:** the file is missing or misspelled in `src/components/`.
- **Requests fail or lists are empty:** check that `php artisan serve` is running and that `VITE_API_URL` is correct.
- **"Your session has expired":** sign out and sign in again.