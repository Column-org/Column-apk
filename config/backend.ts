/**
 * Backend API Configuration
 *
 * Change USE_LOCAL_BACKEND to switch between local and production
 * - true: Use local backend (for development/testing)
 * - false: Use production backend (for deployment)
 *
 * PRODUCTION: Update PRODUCTION_HOST with your Vercel URL after deployment
 * LOCAL: Update LOCAL_HOST with ipconfig when network changes
 */

// Set to true for local development, false for production
export const USE_LOCAL_BACKEND = false

const LOCAL_HOST = '10.148.185.245'
const LOCAL_PORT = 3000

// TODO: Update this with your Vercel URL after deployment
const PRODUCTION_HOST = 'column-backend.vercel.app'

export const BACKEND_CONFIG = {
  get HOST() {
    return USE_LOCAL_BACKEND ? LOCAL_HOST : PRODUCTION_HOST
  },

  get PORT() {
    return USE_LOCAL_BACKEND ? LOCAL_PORT : ''
  },

  get BASE_URL() {
    if (USE_LOCAL_BACKEND) {
      return `http://${LOCAL_HOST}:${LOCAL_PORT}`
    }
    return `https://${PRODUCTION_HOST}`
  },

  get WS_URL() {
    if (USE_LOCAL_BACKEND) {
      return `ws://${LOCAL_HOST}:${LOCAL_PORT}`
    }
    return `wss://${PRODUCTION_HOST}`
  },
}

// Default export for convenience
export default BACKEND_CONFIG
