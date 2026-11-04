
pipeline {
    agent any

    tools {
        nodejs 'Node24'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Run Automated Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Build Complete') {
            steps {
                echo 'Student Attendance System build completed!'
            }
        }
    }

    post {
        success {
            echo 'Jenkins pipeline executed successfully!'
        }

        failure {
            echo 'Jenkins pipeline failed. Check Console Output.'
        }
    }
}
