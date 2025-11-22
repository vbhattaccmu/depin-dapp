/**
 * BigWater DePIN Backend Server
 * 
 * This is a basic Express.js server implementation for persisting wallet and user data using Redis.
 * 
 * To run:
 * 1. Install dependencies: npm install express redis cors dotenv
 * 2. Set up Redis (local or cloud)
 * 3. Create .env file with REDIS_URL and PORT
 * 4. Run: node server.js
 */

const express = require('express')
const redis = require('redis')
const cors = require('cors')
const nodemailer = require('nodemailer')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 4000
// In Docker, use service name 'redis', otherwise default to localhost
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Middleware
app.use(cors())
app.use(express.json())

// Connect to Redis
const client = redis.createClient({
  url: REDIS_URL,
})

client.on('error', (err) => console.error('Redis Client Error:', err))
client.on('connect', () => console.log('Connecting to Redis...'))
client.on('ready', () => console.log('Connected to Redis'))

client.connect().catch(err => {
  console.error('Redis connection error:', err)
  process.exit(1)
})

// Redis key prefixes
const WALLET_PREFIX = 'wallet:'
const USER_CREDENTIAL_PREFIX = 'user:'

// Email configuration
const createEmailTransporter = () => {
  // Use Gmail SMTP by default, but can be configured via env vars
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  })
  return transporter
}

// Admin email for notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'viku453@gmail.com'

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// Wallet endpoints
app.post('/api/wallets', async (req, res) => {
  try {
    const address = req.body.address
    if (!address) {
      return res.status(400).json({ message: 'Wallet address is required' })
    }

    const walletData = {
      ...req.body,
      updatedAt: Date.now(),
      createdAt: req.body.createdAt || Date.now(),
    }
    
    const key = `${WALLET_PREFIX}${address.toLowerCase()}`
    await client.set(key, JSON.stringify(walletData))
    
    res.json({ success: true, address })
  } catch (error) {
    console.error('Error storing wallet:', error)
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/wallets/:address', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase()
    const key = `${WALLET_PREFIX}${address}`
    
    const walletData = await client.get(key)
    if (!walletData) {
      return res.status(404).json({ message: 'Wallet not found' })
    }
    
    res.json(JSON.parse(walletData))
  } catch (error) {
    console.error('Error getting wallet:', error)
    res.status(500).json({ message: error.message })
  }
})

app.patch('/api/wallets/:address', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase()
    const key = `${WALLET_PREFIX}${address}`
    
    // Get existing wallet
    const existingData = await client.get(key)
    if (!existingData) {
      return res.status(404).json({ message: 'Wallet not found' })
    }
    
    const existingWallet = JSON.parse(existingData)
    const updatedWallet = {
      ...existingWallet,
      ...req.body,
      updatedAt: Date.now(),
    }
    
    await client.set(key, JSON.stringify(updatedWallet))
    res.json(updatedWallet)
  } catch (error) {
    console.error('Error updating wallet:', error)
    res.status(500).json({ message: error.message })
  }
})

// User credentials endpoints
app.post('/api/users/credentials', async (req, res) => {
  try {
    const identifier = req.body.identifier
    if (!identifier) {
      return res.status(400).json({ message: 'Identifier is required' })
    }

    const credentialData = {
      ...req.body,
      createdAt: req.body.createdAt || Date.now(),
    }
    
    const key = `${USER_CREDENTIAL_PREFIX}${identifier.toLowerCase()}`
    await client.set(key, JSON.stringify(credentialData))
    
    res.json({ success: true, identifier })
  } catch (error) {
    console.error('Error storing user credential:', error)
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/users/credentials/:identifier', async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.identifier).toLowerCase()
    const key = `${USER_CREDENTIAL_PREFIX}${identifier}`
    
    const credentialData = await client.get(key)
    if (!credentialData) {
      return res.status(404).json({ message: 'Credential not found' })
    }
    
    res.json(JSON.parse(credentialData))
  } catch (error) {
    console.error('Error getting user credential:', error)
    res.status(500).json({ message: error.message })
  }
})

// Email endpoints
app.post('/api/email/send', async (req, res) => {
  try {
    const { to, subject, body, html } = req.body
    
    if (!to || !subject || (!body && !html)) {
      return res.status(400).json({ message: 'to, subject, and body/html are required' })
    }

    const transporter = createEmailTransporter()
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || `BigWater DePIN <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to,
      subject,
      text: body,
      html: html || body?.replace(/\n/g, '<br>'),
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully' 
    })
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ 
      message: 'Failed to send email: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // Look up wallet by email
    const normalizedEmail = email.toLowerCase().trim()
    const key = `${USER_CREDENTIAL_PREFIX}${normalizedEmail}`
    const credentialData = await client.get(key)
    
    if (!credentialData) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email, password reset instructions have been sent.' 
      })
    }

    const credential = JSON.parse(credentialData)
    const walletAddress = credential.address

    // Send password reset email to admin
    const transporter = createEmailTransporter()
    
    const resetEmailBody = `
Password Reset Request

A password reset has been requested for the following account:

Email: ${email}
Wallet Address: ${walletAddress}
Request Time: ${new Date().toLocaleString()}

To reset the password, please contact the user and verify their identity.

If you did not request this password reset, please ignore this email.
    `.trim()

    const mailOptions = {
      from: process.env.EMAIL_FROM || `BigWater DePIN <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: 'Password Reset Request - BigWater DePIN',
      text: resetEmailBody,
      html: resetEmailBody.replace(/\n/g, '<br>'),
    }

    await transporter.sendMail(mailOptions)
    console.log('Password reset email sent to admin:', ADMIN_EMAIL)
    
    res.json({ 
      success: true, 
      message: 'Password reset instructions have been sent.' 
    })
  } catch (error) {
    console.error('Error processing forgot password:', error)
    res.status(500).json({ 
      message: 'Failed to process password reset request: ' + error.message 
    })
  }
})

// Registration notification endpoint
app.post('/api/email/registration', async (req, res) => {
  try {
    const { userEmail, username, walletAddress } = req.body
    
    if (!userEmail || !username || !walletAddress) {
      return res.status(400).json({ message: 'userEmail, username, and walletAddress are required' })
    }

    const transporter = createEmailTransporter()
    
    const emailBody = `
New User Registration - BigWater DePIN

A new user has registered on BigWater DePIN:

Username: ${username}
Email: ${userEmail}
Wallet Address: ${walletAddress}
Registration Date: ${new Date().toLocaleString()}

Please verify and activate the account if needed.
    `.trim()

    const mailOptions = {
      from: process.env.EMAIL_FROM || `BigWater DePIN <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: 'New User Registration - BigWater DePIN',
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
    }

    await transporter.sendMail(mailOptions)
    console.log('Registration email sent to admin:', ADMIN_EMAIL)
    
    res.json({ 
      success: true, 
      message: 'Registration notification sent successfully' 
    })
  } catch (error) {
    console.error('Error sending registration email:', error)
    res.status(500).json({ 
      message: 'Failed to send registration email: ' + error.message 
    })
  }
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`BigWater DePIN API server running on port ${PORT}`)
  console.log(`API URL: http://localhost:${PORT}/api`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server and Redis connection')
  server.close(() => {
    console.log('HTTP server closed')
  })
  await client.quit()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server and Redis connection')
  server.close(() => {
    console.log('HTTP server closed')
  })
  await client.quit()
  process.exit(0)
})

