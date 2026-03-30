import { AsgardeoSPAClient } from '@asgardeo/auth-spa'

const client = AsgardeoSPAClient.getInstance()

const AUTH_TOKEN_STORAGE_KEY = 'asgardeo_access_token'

let initialized = false
let initializePromise = null

const requiredConfig = {
  clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID,
  baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL,
  signInRedirectURL: window.location.origin,
  signOutRedirectURL: window.location.origin,
  scope: ['openid', 'profile']
}

const hasAuthConfig = () => requiredConfig.clientID && requiredConfig.baseUrl

const saveAccessToken = async () => {
  const token = await client.getAccessToken()
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  }
}

const clearAccessToken = () => {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

const hasAuthCallbackParams = () => {
  const params = new URLSearchParams(window.location.search)
  return params.has('code') && params.has('session_state')
}

export const initializeAuth = async () => {
  if (!hasAuthConfig()) {
    return { isConfigured: false, isAuthenticated: false }
  }

  if (initialized) {
    const isAuthenticated = await client.isAuthenticated()
    if (isAuthenticated) {
      await saveAccessToken()
    } else {
      clearAccessToken()
    }
    return { isConfigured: true, isAuthenticated }
  }

  if (!initializePromise) {
    initializePromise = (async () => {
      await client.initialize(requiredConfig)

      if (hasAuthCallbackParams()) {
        await client.signIn()
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      initialized = true
      const isAuthenticated = await client.isAuthenticated()

      if (isAuthenticated) {
        await saveAccessToken()
      } else {
        clearAccessToken()
      }

      return { isConfigured: true, isAuthenticated }
    })().finally(() => {
      initializePromise = null
    })
  }

  return initializePromise
}

export const startLogin = async () => {
  await initializeAuth()
  await client.signIn()
}

export const startLogout = async () => {
  clearAccessToken()
  await client.signOut()
}
