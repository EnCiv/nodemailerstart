'use strict'

const nodemailer=require('nodemailer')

if(typeof logger === 'undefined'){
    global.logger=console
}

var config
if (process.env.NODEMAILER_SERVICE === 'Zoho') {
  config = {
    service: 'Zoho',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  }
} else if (process.env.NODEMAILER_SERVICE === 'gmail') {
  config = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: process.env.NODEMAILER_USER,
      serviceClient: process.env.NODEMAILER_SERVICE_CLIENT,
      privateKey: process.env.NODEMAILER_PRIVATE_KEY.replace(/\\n/g, '\n'), // the key has \n in it that needs to be converted
    },
  }
} else {
  logger.error('send-email NODEMAILER_SERVICE not supported', process.env.NODEMAILER_SERVICE)
}

var transporter

async function start() {
  try {
    transporter = nodemailer.createTransport(config)
  } catch (err) {
    logger.error('send-email createTransport failed', config, err)
  }
  try {
    await transporter.verify()
  } catch (err) {
    logger.error("nodemailer transport didn't verify", err)
  }
}

if (process.env.NODEMAILER_SERVICE && !transporter) start()

function sendEmail(options = {}) {
  logger.log('Sending email', options)
  return new Promise(async (pass, fail) => {
    if (!process.env.NODEMAILER_SERVICE)
      return fail(new Error('NODEMAILER_SERVICE environment variable not configured'))
    if (!options.to) return fail(new Error('Missing email recipient'))
    if (!options.subject) return fail(new Error('Missing email subject'))
    let results = await transporter.sendMail(options)
    if (parseInt(results.response) === 250)
      //'250 Message received' from Zoho but gmail is like '250 2.0.0 OK  1573250273 a21sm6579793pjq.1 - gsmtp'
      pass()
    else {
      logger.error('sendEmail failed with:', results.response)
      fail(new Error(results.response))
    }
  })
}
module.exports=sendEmail

