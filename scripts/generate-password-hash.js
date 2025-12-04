#!/usr/bin/env node

/**
 * Password Hash Generator
 *
 * This script generates a bcrypt hash for the admin password.
 * Usage: node scripts/generate-password-hash.js <password>
 *
 * Example:
 *   node scripts/generate-password-hash.js mySecurePassword123
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Error: Please provide a password');
  console.log('Usage: node scripts/generate-password-hash.js <password>');
  console.log('Example: node scripts/generate-password-hash.js mySecurePassword123');
  process.exit(1);
}

if (password.length < 8) {
  console.warn('Warning: Password should be at least 8 characters long');
}

const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }

  console.log('\n=== Password Hash Generated ===\n');
  console.log('Add this to your .env file:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  console.log('Make sure to also set SESSION_SECRET in your .env file.');
  console.log('Generate a session secret with: openssl rand -base64 32\n');
});
