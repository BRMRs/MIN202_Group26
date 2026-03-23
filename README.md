# MIN202_Group26

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
