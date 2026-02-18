/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'chartwise-secret-key';

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Save user (simplified - would use proper DB in production)
    logger.info(`User registered: ${username}`);
    
    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    logger.error('Error registering user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Verify user (simplified)
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true, 
      token,
      user: { username }
    });
  } catch (error) {
    logger.error('Error logging in:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate license
router.post('/license', async (req, res) => {
  try {
    const { licenseKey, hardwareId } = req.body;
    
    // Validate license (simplified)
    const isValid = licenseKey && licenseKey.length >= 16;
    
    res.json({ 
      success: true, 
      valid: isValid,
      message: isValid ? 'License valid' : 'Invalid license'
    });
  } catch (error) {
    logger.error('Error validating license:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
