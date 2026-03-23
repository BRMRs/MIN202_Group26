# MIN202_Group26

## Project Description

This is the **CPT202 Software Engineering Group Project — Option A, Group 26**.

We are building a **Community Heritage Resource Sharing and Curation Platform** — a web-based system for submitting, reviewing, publishing, and archiving curated heritage resource entries. The platform focuses on community heritage and local culture topics (places, traditions, stories, objects, and educational materials).

**Tech Stack**: Java 17 + Spring Boot 3.2.5 (Backend) | React 18.3.1 (Frontend) | MySQL 8.0.x (Database)

## Members

9 members

## Prerequisites

All tools listed below must be installed with the exact version (or latest patch release of the specified major/minor version) to align the development environment. Verify versions using the provided commands after installation.

| Tool               | Required Version          | Verification Command                  |
|---------------------|---------------------------|---------------------------------------|
| Java JDK            | 17 (LTS, latest patch)    | `java -version` (output: `openjdk 17.x.x`) |
| Maven               | 3.9.x (latest patch)      | `mvn -v` (output: `Apache Maven 3.9.x`) |
| Node.js             | 20.x (LTS, latest patch)  | `node -v` (output: `v20.x.x`)         |
| npm                 | 10.x (latest patch)       | `npm -v` (output: `10.x.x`)           |
| MySQL Server        | 8.0.x (LTS, latest patch) | `mysql --version` (output: `mysql  Ver 8.0.x`) |
| Git                 | 2.40.x+ (stable)          | `git --version`                       |

## Tech Stack & Version Specifications

All dependencies use the **latest stable patch release** of the specified major/minor version (prioritize LTS versions for long-term stability).

### Backend (Spring Boot)
| Dependency               | Version          |
|--------------------------|------------------|
| Spring Boot              | 3.2.5 (Stable)   |
| Spring Data JPA          | 3.2.5            |
| Spring Web               | 3.2.5            |
| MySQL Connector/J        | 8.0.36           |
| Lombok                   | 1.18.30          |
| JUnit 5                  | 5.10.2           |

### Frontend (React)
| Dependency               | Version          |
|--------------------------|------------------|
| React                    | 18.3.1           |
| React DOM                | 18.3.1           |
| React Router DOM         | 6.23.0           |
| Axios                    | 1.6.8            |
| TypeScript               | 5.4.5 (optional) |
| ESLint                   | 8.57.0           |
| Prettier                 | 3.2.5            |

### Database
| Component                | Specification     |
|--------------------------|------------------|
| MySQL                    | 8.0.x (LTS)      |
| Character Set            | utf8mb4          |
| Collation                | utf8mb4_unicode_ci |
| Storage Engine           | InnoDB           |

---

## Database Setup

> ⚠️ **ALL TEAM MEMBERS MUST FOLLOW THESE STEPS EXACTLY.**
> We use identical database credentials to avoid configuration conflicts during remote development.

### Credentials (DO NOT CHANGE)

| Setting | Value |
|---------|-------|
| Database Name | `heritage_db` |
| Username | `root` |
| Password | `Heritage@2026` |
| Port | `3306` |
| Character Set | `utf8mb4` |

### Step 1: Create the Database

Open your MySQL client and run:

```sql
CREATE DATABASE IF NOT EXISTS heritage_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### Step 2: Set Your MySQL Root Password

If your MySQL root password is **not** `Heritage@2026`, change it:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Heritage@2026';
FLUSH PRIVILEGES;
```

### Step 3: Initialize Tables

From the project root directory, run:

```bash
mysql -u root -p'Heritage@2026' heritage_db < database/init.sql
```

> ⚠️ **IMPORTANT**: Do NOT modify `backend/src/main/resources/application.properties`. The database credentials are already configured. All team members must use `Heritage@2026` as the MySQL root password.

---

## Quick Start

### Backend (Spring Boot)

```bash
cd backend
chmod +x mvnw          # Mac/Linux only — run once
./mvnw spring-boot:run # Mac/Linux
mvnw.cmd spring-boot:run # Windows
```

Backend runs on: **http://localhost:8080**

### Frontend (React + Vite)

```bash
cd frontend
npm install            # First time only
npm run dev
```

Frontend runs on: **http://localhost:5173**

> API proxy is configured — all `/api` requests from the frontend automatically forward to `http://localhost:8080`.

---

## Project Architecture

```
backend/src/main/java/com/group26/heritage/
├── HeritagePlatformApplication.java
├── entity/          # SHARED — All JPA entities (cross-module contracts)
│   └── enums/       # UserRole, ResourceStatus, ApplicationStatus
├── common/          # SHARED — Infrastructure
│   ├── config/      # SecurityConfig, CorsConfig, WebMvcConfig
│   ├── security/    # JwtTokenProvider, JwtAuthFilter
│   ├── repository/  # ALL repositories (prevents cross-module coupling)
│   ├── dto/         # ApiResponse, PageResult, shared DTOs
│   ├── exception/   # GlobalExceptionHandler
│   └── util/        # ValidationConstants
├── module_a/        # Team A: User & Access Management
├── module_b/        # Team B: Resource Submission
├── module_c/        # Team C: Review & Publication Workflow
├── module_d/        # Team D: Discovery & Search
└── module_e/        # Team E: System Administration

frontend/src/
├── common/          # Shared components, context, hooks, utils
├── module_a/        # Team A pages, components, API calls
├── module_b/        # Team B pages, components, API calls
├── module_c/        # Team C pages, components, API calls
├── module_d/        # Team D pages, components, API calls
└── module_e/        # Team E pages, components, API calls
```

---

## Module Map

| Module | Scope | Backend Package | Frontend Dir | API Prefix |
|--------|-------|-----------------|--------------|------------|
| **A** | User & Access Management | `module_a/` | `module_a/` | `/api/auth/**`, `/api/users/**`, `/api/admin/users/**` |
| **B** | Resource Submission | `module_b/` | `module_b/` | `/api/resources/**` |
| **C** | Review & Publication Workflow | `module_c/` | `module_c/` | `/api/reviews/**` |
| **D** | Discovery & Search | `module_d/` | `module_d/` | `/api/discover/**`, `/api/comments/**` |
| **E** | System Administration | `module_e/` | `module_e/` | `/api/admin/categories/**`, `/api/admin/tags/**`, `/api/admin/dashboard/**` |

### Shared Code (requires cross-team review to modify)

| Path | Purpose |
|------|---------|
| `backend/.../entity/` | All JPA entities — shared data contracts |
| `backend/.../common/repository/` | All repository interfaces — shared data access layer |
| `backend/.../common/config/` | Security, CORS, Web MVC configuration |
| `backend/.../common/dto/` | Shared response wrappers (ApiResponse, PageResult) |
| `frontend/src/common/` | Shared React components (Navbar, Footer, AuthContext) |
| `database/init.sql` | Database schema — all teams depend on this |

---

## Development Rules

### 🔴 Repository Rule (CRITICAL)

ALL repositories live in `common/repository/`. **NEVER** create a repository interface inside your module package (`module_a/`, `module_b/`, etc.).

If your service needs to access data from another module's entity, inject the repository from `common/repository/`. This prevents Spring Boot duplicate bean errors.

```java
// ✅ CORRECT — inject from common/repository/
@Autowired
private ResourceRepository resourceRepository; // lives in common/repository/

// ❌ WRONG — never create a duplicate repository in your module
// module_d/repository/ResourceRepository.java  ← DO NOT DO THIS
```

### 🔴 Entity Rule

ALL entities live in `entity/`. If you need a new field or entity, discuss with ALL affected module teams first. Entity changes require cross-team code review.

### 🟡 File Ownership

- **ONLY modify files in YOUR module's directory** (`module_a/`, `module_b/`, etc.)
- Files in `entity/`, `common/`, `App.jsx`, and `database/init.sql` are **shared** — changes require agreement from all affected teams
- If you need a shared DTO, add it to `common/dto/` via a Pull Request

---

## Git Branching Strategy

### Branch Naming

```
feature/module-X/short-description
```

**Examples:**
- `feature/module-a/user-registration`
- `feature/module-a/jwt-auth`
- `feature/module-b/resource-crud`
- `feature/module-c/review-dashboard`
- `feature/module-d/search-api`
- `feature/module-e/category-management`

### Workflow

1. Create your branch from `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/module-X/description
   ```
2. Develop and commit locally with clear messages
3. Push and open a Pull Request to `main`
4. Get at least **1 review** from your own team
5. Changes to `entity/`, `common/`, or `database/` require review from **another module's lead**

### Commit Message Format

```
type(scope): short description

Examples:
feat(module-a): add user registration endpoint
fix(module-b): fix file upload validation
docs(readme): update database setup instructions
```
