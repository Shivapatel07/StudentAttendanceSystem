pipeline {
  agent any
  tools {
    // Configure NodeJS installation named "Node20" in Jenkins Global Tool Configuration,
    // or remove this tools block if Node.js is already available on the agent.
    nodejs 'Node20'
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Install dependencies') {
      steps { sh 'npm ci' }
    }
    stage('Automated API tests') {
      steps { sh 'npm test' }
    }
    stage('Build Docker image') {
      steps { sh 'docker build -t student-attendance-system:latest .' }
    }
  }
  post {
    always { echo 'Pipeline finished. Review stage logs for the actual result.' }
  }
}
