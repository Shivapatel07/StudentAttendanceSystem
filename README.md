# Student Attendance Management System

A web-based attendance app built with HTML, CSS, JavaScript, Node.js, Express and SQLite. It supports student CRUD, seven-period daily attendance, monthly summaries, shortage flags and CSV export.

## Requirements
- Node.js 20 or later
- npm
- Optional: Docker, Jenkins, Kubernetes, Google Chrome for Selenium

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:3000`.

The app creates `database/attendance.db` automatically and inserts three demonstration students into an empty database. Replace sample records with your actual class data.

## Test
```bash
npm test
```
The automated API tests use a temporary SQLite database. Optional Selenium smoke test:
1. Start the app in one terminal with `npm start`.
2. In another terminal, run `node tests/selenium.test.js`.
3. Ensure Chrome and Selenium's compatible driver are available.

## Git and GitHub
```bash
git init
git add .
git commit -m "Initial Student Attendance System"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
Do not commit database files containing real student data, credentials or secrets.

## Docker
```bash
docker build -t student-attendance-system:latest .
docker run --name attendance-app -p 3000:3000 -v attendance-data:/app/database student-attendance-system:latest
```
Open `http://localhost:3000`. The volume keeps SQLite data across container replacement.

## Jenkins
- Install/configure the Jenkins NodeJS tool named `Node20`, Docker on the agent, and required permissions.
- Add this repository as a Pipeline job and select `Jenkinsfile`.
- The pipeline runs tests then builds a Docker image. Check the real console output before claiming success.
- If the Jenkins agent is Windows, adapt `sh` commands to Windows batch or use a Linux agent.

## Kubernetes
Build the image in a cluster-accessible image registry or load it into your local cluster. Then apply:
```bash
kubectl apply -f k8s/deployment.yaml
kubectl get pods
kubectl get services
```
Open `http://localhost:30080` only if using a local cluster configuration that exposes the NodePort on localhost. Image availability differs by cluster.

**Important database note:** SQLite is a local file. Multiple replicas with separate local files do not share records. This manifest uses one replica for a demonstration. Configure persistent storage and backups; for multi-replica production deployments, consider a centralized database.

## Attendance calculation
Attendance % = (Present periods / (Present periods + Absent periods)) × 100.
Unrecorded periods are excluded from the denominator. Confirm this rule matches your institution's official working calendar before academic submission.

## API summary
- `GET /api/health`
- `GET /api/students`
- `POST /api/students` with `{ "roll_no":"STU004", "name":"Student Name", "department":"CSE" }`
- `PUT /api/students/:rollNo`
- `DELETE /api/students/:rollNo`
- `GET /api/attendance?date=YYYY-MM-DD`
- `POST /api/attendance` with `{ "date":"YYYY-MM-DD", "records":[{"roll_no":"STU001","period":1,"status":"Present"}] }`
- `GET /api/reports/monthly?month=YYYY-MM&threshold=75`
- `GET /api/reports/monthly.csv?month=YYYY-MM&threshold=75`

## Before final submission
Capture your own current screenshots and actual terminal logs. Do not claim Jenkins, Docker, Kubernetes or Selenium succeeded until you have run them and recorded the output.
