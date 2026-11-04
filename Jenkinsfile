
pipeline {
    agent any

    tools {
        nodejs 'Node24'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Shivapatel07/StudentAttendanceSystem.git'
            }
        }

        stage('Check Node and npm') {
            steps {
                bat 'node --version'
                bat 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Build Complete') {
            steps {
                echo 'Student Attendance System CI Pipeline Completed Successfully!'
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Jenkins pipeline completed.'
        }

        failure {
            echo 'FAILED: Check the Jenkins Console Output.'
        }
    }
}
