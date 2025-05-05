'use strict'

const Env = use('Env')
const AWS = require('aws-sdk')

// Chargement unique de la config AWS depuis le .env
AWS.config.update({
  accessKeyId: Env.get('AWS_ACCESS_KEY_ID'),
  secretAccessKey: Env.get('AWS_SECRET_ACCESS_KEY'),
  // sessionToken:    Env.get('AWS_SESSION_TOKEN'), // décommentez si vous utilisez STS
  region: Env.get('AWS_REGION', 'us-east-1'),
})

class SesTemplateController {
  /**
   * Extrait les champs dynamiques de type {{ field }} dans une string.
   */
  getDynamicFields(contentStr) {
    const dynamicFieldsArr = []
    if (!contentStr) return dynamicFieldsArr

    const matches = contentStr.match(/{{\s*[\w.]+\s*}}/g)
    if (matches) {
      matches.forEach(tag => {
        const field = tag.match(/[\w.]+/)[0]
        dynamicFieldsArr.push(field)
      })
    }
    return dynamicFieldsArr
  }

  /**
   * Create a new SES template
   */
  async createTemplate({ request, response }) {
    const { region, TemplateName, HtmlPart, SubjectPart, TextPart } = request.post()
    const ses = new AWS.SES({ region: region || AWS.config.region })

    const params = {
      Template: { TemplateName, HtmlPart, SubjectPart, TextPart }
    }

    try {
      await ses.createTemplate(params).promise()
      return response.status(201).send({ message: 'Template créé avec succès' })
    } catch (err) {
      return response.status(500).send({ error: err.message || err })
    }
  }

  /**
   * List all SES templates
   */
  async listTemplates({ request, response }) {
    const { region, MaxItems } = request.get()
    const ses = new AWS.SES({ region: region || AWS.config.region })

    try {
      const data = await ses.listTemplates({ MaxItems: MaxItems || 5000 }).promise()
      return response.status(200).send({ items: data.Templates || [] })
    } catch (err) {
      return response.status(500).send({ error: err.message || err })
    }
  }

  /**
   * Get a single SES template and extract its champs dynamiques
   */
  async getTemplate({ request, response }) {
    const { TemplateName } = request.params
    const { region } = request.get()
    const ses = new AWS.SES({ region: region || AWS.config.region })

    try {
      const { Template } = await ses.getTemplate({ TemplateName }).promise()

      // Extraction des champs dynamiques
      const fields = [
        ...this.getDynamicFields(Template.SubjectPart),
        ...this.getDynamicFields(Template.TextPart),
        ...this.getDynamicFields(Template.HtmlPart),
      ]
      Template.dynamicFields = Array.from(new Set(fields))

      return response.status(200).send({ data: Template })
    } catch (err) {
      return response.status(500).send({ error: err.message || err })
    }
  }

  /**
   * Update an existing SES template
   */
  async updateTemplate({ request, response }) {
    const { region, TemplateName, HtmlPart, SubjectPart, TextPart } = request.post()
    const ses = new AWS.SES({ region: region || AWS.config.region })

    const params = {
      Template: { TemplateName, HtmlPart, SubjectPart, TextPart }
    }

    try {
      await ses.updateTemplate(params).promise()
      return response.status(200).send({ message: 'Template mis à jour avec succès' })
    } catch (err) {
      return response.status(500).send({ error: err.message || err })
    }
  }

  /**
   * Delete an SES template
   */
  async deleteTemplate({ request, response }) {
    const { TemplateName } = request.params
    const { region } = request.get()
    const ses = new AWS.SES({ region: region || AWS.config.region })

    try {
      await ses.deleteTemplate({ TemplateName }).promise()
      return response.status(200).send({ message: 'Template supprimé avec succès' })
    } catch (err) {
      return response.status(500).send({ error: err.message || err })
    }
  }

  /**
   * Send an email using a stored SES template
   */
  async sendTemplate({ request, response }) {
    const { region, toAddress, source, templateName, templateData } = request.post()
    const ses = new AWS.SES({ region: region || AWS.config.region })

    const params = {
      Destination: { ToAddresses: [toAddress] },
      Source: source,
      Template: templateName,
      TemplateData: templateData,
    }

    try {
      await ses.sendTemplatedEmail(params).promise()
      return response.status(200).send({ message: 'Email envoyé avec succès' })
    } catch (err) {
      return response.status(500).send({ error: err.message || err })
    }
  }
}

module.exports = SesTemplateController