'use strict'

const Env = use('Env')
const AWS = require('aws-sdk')

// Configure AWS une bonne fois pour toutes depuis votre .env
AWS.config.update({
  accessKeyId: Env.get('AWS_ACCESS_KEY_ID'),
  secretAccessKey: Env.get('AWS_SECRET_ACCESS_KEY'),
  // sessionToken:    Env.get('AWS_SESSION_TOKEN'), // décommentez si besoin
  region: Env.get('AWS_REGION'),
})

class SesTemplateController {

  getDynamicFields(contentStr) {
    …
  }

  async createTemplate({ request, response }) {
    // si vous voulez surcharger la région à la volée, sinon AWS.config.region suffit
    const region = request.post().region || AWS.config.region
    const ses = new AWS.SES({ region })

    const params = {
      Template: {
        TemplateName: request.post().TemplateName,
        HtmlPart: request.post().HtmlPart,
        SubjectPart: request.post().SubjectPart,
        TextPart: request.post().TextPart,
      }
    }

    try {
      await ses.createTemplate(params).promise()
      return response.status(200).send('Created')
    } catch (err) {
      return response.status(500).send(err)
    }
  }

  async listTemplates({ request, response }) {
    const region = request.get().region || AWS.config.region
    const ses = new AWS.SES({ region })

    try {
      const data = await ses.listTemplates({ MaxItems: request.get().MaxItems || 5000 }).promise()
      return response.status(200).send({ items: data })
    } catch (err) {
      return response.status(500).send(err)
    }
  }

  async getTemplate({ request, response }) {
    const region = request.get().region || AWS.config.region
    const ses = new AWS.SES({ region })
    const name = request.params.TemplateName

    try {
      const { Template } = await ses.getTemplate({ TemplateName: name }).promise()

      // Récupère les champs dynamiques
      const dynamicFields = [
        ...this.getDynamicFields(Template.SubjectPart),
        ...this.getDynamicFields(Template.TextPart),
        ...this.getDynamicFields(Template.HtmlPart),
      ].filter((v, i, a) => a.indexOf(v) === i)   // unique

      Template.dynamicFields = dynamicFields
      return response.status(200).send({ data: Template })
    } catch (err) {
      return response.status(500).send(err)
    }
  }

  async updateTemplate({ request, response }) {
    const region = request.post().region || AWS.config.region
    const ses = new AWS.SES({ region })

    const params = {
      Template: {
        TemplateName: request.post().TemplateName,
        HtmlPart: request.post().HtmlPart,
        SubjectPart: request.post().SubjectPart,
        TextPart: request.post().TextPart,
      }
    }

    try {
      await ses.updateTemplate(params).promise()
      return response.status(200).send()
    } catch (err) {
      return response.status(500).send(err)
    }
  }

  async deleteTemplate({ request, response }) {
    const region = request.get().region || AWS.config.region
    const ses = new AWS.SES({ region })
    const name = request.params.TemplateName

    try {
      await ses.deleteTemplate({ TemplateName: name }).promise()
      return response.status(200).send()
    } catch (err) {
      return response.status(500).send(err)
    }
  }

  async sendTemplate({ request, response }) {
    const region = request.post().region || AWS.config.region
    const ses = new AWS.SES({ region })

    const params = {
      Destination: { ToAddresses: [request.post().toAddress] },
      Source: request.post().source,
      Template: request.post().templateName,
      TemplateData: request.post().templateData,
    }

    try {
      await ses.sendTemplatedEmail(params).promise()
      return response.status(200).send()
    } catch (err) {
      return response.status(500).send(err)
    }
  }
}

module.exports = SesTemplateController