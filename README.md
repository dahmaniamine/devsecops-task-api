# DevSecOps Task API

A small portfolio project built to demonstrate the exact foundations commonly requested for a junior DevSecOps internship:

- Git / GitHub workflow
- Docker and Docker Compose
- Node.js REST API development
- MongoDB / NoSQL
- Automated tests
- CI/CD with GitHub Actions
- Dependency auditing with `npm audit`
- Container vulnerability scanning with Trivy
- Cloud deployment to Render

## Architecture

```text
Developer
   |
   | git push
   v
GitHub Repository
   |
   v
GitHub Actions
   |-- npm test
   |-- npm audit
   |-- docker build
   |-- Trivy scan
   |
   v
Render Deploy Hook (optional)
   |
   v
Dockerized Node.js API
   |
   v
MongoDB Atlas (cloud)
```

For local development, Docker Compose runs both the API and MongoDB:

```text
Browser / Postman
       |
       v
Node.js API container :3000
       |
       v
MongoDB container :27017
```

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

Example task body:

```json
{
  "title": "Learn Docker",
  "description": "Containerize the API",
  "completed": false
}
```

## 1. Run with Docker Compose

Install Docker Desktop, then run:

```bash
docker compose up --build
```

Open:

```text
http://localhost:3000/health
```

Stop the stack:

```bash
docker compose down
```

Remove the local MongoDB volume too:

```bash
docker compose down -v
```

## 2. Run without Docker

You need Node.js 20+ and MongoDB running locally.

```bash
cp .env.example .env
npm install
npm start
```

For development with automatic restart:

```bash
npm run dev
```

## 3. Run tests

```bash
npm test
```

The tests use Jest and Supertest. The task model is mocked, so CI can test the HTTP layer without requiring a database service.

## 4. Try the API

Health check:

```bash
curl http://localhost:3000/health
```

Create a task:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Docker","description":"Containerize the API"}'
```

List tasks:

```bash
curl http://localhost:3000/api/tasks
```

Or run:

```bash
./scripts/demo.sh
```

## 5. CI/CD pipeline

The workflow is located at:

```text
.github/workflows/ci.yml
```

On pushes and pull requests, GitHub Actions performs:

1. Checkout
2. Node.js setup
3. Install dependencies (`npm ci` when a lockfile exists, otherwise `npm install`)
4. Automated tests
5. `npm audit`
6. Docker image build
7. Trivy container vulnerability scan
8. Optional Render deployment through a deploy hook

### Important: generate `package-lock.json`

Before pushing the repository for the first time, run:

```bash
npm install
```

This generates `package-lock.json`. Commit it. Once the lockfile exists, the CI workflow automatically uses `npm ci` for reproducible installs.

## 6. Deploy to Render

The repository includes `render.yaml` and `Dockerfile`.

### Database

For cloud deployment, create a MongoDB Atlas database and copy its connection string.

In Render, add:

```text
MONGODB_URI=<your MongoDB Atlas connection string>
NODE_ENV=production
```

Do not commit the real connection string into Git.

### Optional CD deploy hook

To let GitHub Actions trigger Render after a successful pipeline:

1. Create the Render web service.
2. In Render, create/copy its Deploy Hook URL.
3. In GitHub repository settings, add an Actions secret named:

```text
RENDER_DEPLOY_HOOK_URL
```

4. Push to `main` or `master`.

If the secret is not present, CI still runs and the deployment step is skipped safely.

## 7. Security choices in this project

- `helmet` adds common HTTP security headers.
- Request JSON is limited to 100 KB.
- `npm audit` checks dependency vulnerabilities.
- Trivy scans the built Docker image for HIGH/CRITICAL vulnerabilities.
- The Docker container runs as an unprivileged user (`appuser`), not root.
- Secrets are provided through environment variables rather than committed to Git.
- The API only accepts an allowlist of fields during updates.

## 8. Suggested Git workflow

```bash
git init
git add .
git commit -m "Build Dockerized task API with CI/CD security pipeline"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```

For future changes, create branches and pull requests instead of working directly on `main`.

## 9. What this project demonstrates in an interview

You can explain the project like this:

> I built a Node.js REST API backed by MongoDB and containerized the API and database with Docker Compose. I added automated tests with Jest and Supertest and created a GitHub Actions CI/CD pipeline that tests the code, audits Node dependencies, builds the Docker image, scans it with Trivy, and can trigger deployment to Render after a successful push.

Do not memorize the sentence only. Be able to explain each step and why it exists.
