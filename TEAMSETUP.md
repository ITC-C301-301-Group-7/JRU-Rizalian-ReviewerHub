# ReviewerHub — Team Setup Guide

Every teammate runs **two programs on their own laptop**: the Laravel backend (port 8000) and the React frontend (port 5173). Each laptop has its **own database**, so accounts and uploads are not shared between teammates.

## 1. Install these once

| Tool | Version | Check it with |
|---|---|---|
| Git | any | `git --version` |
| PHP | 8.2 or newer (XAMPP includes it) | `php -v` |
| Composer | 2.x | `composer -V` |
| Node.js | 20.19 or newer (22 LTS is best) | `node -v` |
| MySQL | XAMPP's MySQL (or use SQLite, see step 4) | |

If `php` is not recognized, add XAMPP's PHP folder (for example `C:\xampp\php`) to the Windows PATH, then reopen PowerShell.

## 2. Get the code (pick ONE way)

**A. Clone from GitHub**

```powershell
git clone BACKEND-REPO-URL reviewerhub-backend
git clone FRONTEND-REPO-URL jru-rizalian-reviewerhub
```

(If everything is in one repository, clone it once instead.)

**B. Download the ZIP**

Unzip it, so you have two folders: `reviewerhub-backend` and `jru-rizalian-reviewerhub`.

Do not copy anyone's `.env`, `vendor` or `node_modules` folders. Each laptop makes its own in the steps below.

## 3. Backend setup (terminal 1)

```powershell
cd reviewerhub-backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

## 4. Database

**MySQL (XAMPP):** start MySQL in the XAMPP Control Panel, open `http://localhost/phpmyadmin`, create a database named `reviewerhub`, then edit `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=reviewerhub
DB_USERNAME=root
DB_PASSWORD=
```

**SQLite (easiest):** leave `.env` as it is. When you run `php artisan migrate`, answer "yes" if it asks to create the database file.

## 5. Create the tables and sample data

```powershell
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve
```

Leave this terminal open. The API runs at `http://127.0.0.1:8000`.

The seeder creates the test teacher account and imports the reviewer PDFs. **The PDFs are not stored on GitHub.** Get them from the person who shares the project and put them in `reviewerhub-backend\storage\app\private\resources\`, then run `php artisan db:seed --class=ExistingReviewersSeeder`.

## 6. Frontend setup (terminal 2)

```powershell
cd jru-rizalian-reviewerhub
npm install
Copy-Item .env.example .env
npm run dev
```

Open the address it prints, usually `http://localhost:5173`.

## 7. Sign in

| Account | How |
|---|---|
| Teacher | Choose Faculty. Faculty ID `99-000001` (or `teacher@jru.edu.ph`), password `Teacher123` |
| Student | Sign Up. The student ID looks like `25-260000` |

## 8. Quick check that it works

1. Sign in as the teacher and open the Overview tab.
2. Upload a reviewer under Upload Resource.
3. Sign out, register a student, and find the reviewer in the Reviewer Community.
4. Open Saved, Translate Document and the class schedule once.

## 9. Getting new changes later

```powershell
git pull                        # in both folders (skip if you use ZIP files)
cd reviewerhub-backend
composer install
php artisan migrate
cd ..\jru-rizalian-reviewerhub
npm install
```

Then restart both servers. If you see "table not found", you missed `php artisan migrate`. If you see "Failed to resolve import", run `npm install`.

## 10. Common problems

| Problem | Fix |
|---|---|
| `php` or `composer` not recognized | Add PHP to PATH, reopen the terminal |
| `could not find driver` or database connection error | Start MySQL in XAMPP, check the `DB_*` lines, and that the database exists |
| Login or API calls fail | Check `php artisan serve` is running and `VITE_API_URL` is `http://127.0.0.1:8000` |
| Port 8000 or 5173 is busy | Close the other program, or run `php artisan serve --port=8001` and set `VITE_API_URL` to match |
| Teacher login fails | Run `php artisan db:seed --class=TeacherSeeder`, and check `APP_ENV=local` in `.env` |
| Route or class "not found" after pulling | `php artisan optimize:clear`, then restart `php artisan serve` |
| Reviewer preview says file not found | The PDFs are missing from `storage\app\private\resources`. See step 5 |

## Git rules for the team

- Never commit `.env`, `vendor/` or `node_modules/`.
- Run `git pull` before you start working and before you push.
- Work on your own branch, for example `git checkout -b feature-your-name`, then open a pull request. (Only when you don't how to use Github)