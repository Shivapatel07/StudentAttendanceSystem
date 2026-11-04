
pipeline {
    agent any

    tools {
        nodejs 'Node24'
    }

    environment {
        PYTHON = 'C:\\Program Files\\Python313\\python.exe'
        DOCKER_PATH = 'C:\\Program Files\\Docker\\Docker\\resources\\bin'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Environment') {
            steps {
                bat 'node --version'
                bat 'npm --version'
                bat '"%PYTHON%" --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat '''
                    set "PATH=C:\\Program Files\\Python313;%PATH%"
                    set "npm_config_python=%PYTHON%"
                    npm config set msvs_version 2022
                    npm ci
                '''
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat '''
                    set "PATH=%DOCKER_PATH%;%PATH%"
                    docker --version
                    docker build -t student-attendance-system:latest .
                '''
            }
        }
    }

    post {
        success {
            echo 'Student Attendance System pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check Console Output.'
        }
    }
}
