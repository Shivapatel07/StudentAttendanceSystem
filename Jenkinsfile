
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
                    @echo off
                    set "PATH=C:\\Program Files\\Python313;%PATH%"
                    set "PYTHON=C:\\Program Files\\Python313\\python.exe"
                    set "GYP_MSVS_VERSION=2022"
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
                    @echo off

                    set "DOCKER_EXE="

                    if exist "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" (
                        set "DOCKER_EXE=C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"
                    )

                    if not defined DOCKER_EXE if exist "C:\\Program Files\\Docker\\Docker\\resources\\docker.exe" (
                        set "DOCKER_EXE=C:\\Program Files\\Docker\\Docker\\resources\\docker.exe"
                    )

                    if not defined DOCKER_EXE if exist "C:\\Users\\Administrator\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" (
                        set "DOCKER_EXE=C:\\Users\\Administrator\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe"
                    )

                    if not defined DOCKER_EXE (
                        echo ERROR: Docker CLI was not found.
                        echo Install Docker Desktop or configure its correct executable path.
                        exit /b 1
                    )

                    echo Docker executable found:
                    echo %DOCKER_EXE%

                    "%DOCKER_EXE%" --version

                    "%DOCKER_EXE%" build -t student-attendance-system:latest .
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Student Attendance System pipeline completed!'
        }

        failure {
            echo 'FAILURE: Check the Jenkins Console Output for details.'
        }
    }
}
