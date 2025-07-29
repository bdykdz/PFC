// Simple logger that can be disabled in production
const isDevelopment = process.env.NODE_ENV === 'development'

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  error: (...args) => {
    // Always log errors
    console.error(...args)
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  }
}

module.exports = logger