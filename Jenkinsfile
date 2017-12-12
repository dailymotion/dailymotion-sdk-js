pipeline {
  environment {
    DOCKER_HOST = "tcp://inspect-02.adm.dc3.dailymotion.com:4243"
    serviceName = "dailymotion-sdk-js"

  }

  agent {
    label 'ci-ubuntu-slave'
  }

  stages{
    stage ("Quality") {
      steps {
        parallel(
          "Integrity" : {
            sh 'make integrity'
          }
        )
      }

      post {
        always {
          sh "docker-compose down"
        }
      }
    }
  }

  post {
    failure {
      slackSend "${serviceName}: Error on *${env.JOB_NAME}* for branch *${env.BRANCH_NAME}* (${env.BUILD_ID})"
    }
  }
}

