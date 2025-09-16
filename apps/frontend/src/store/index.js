// store/index.js
export const initialStore = () => {
  return {
    auth: {
      isAuthenticated: false,
      user: null,
      role: null,
      isLoading: false,
      error: null,
      requires2FA: false,
      requires2FASetup: false
    },
    ui: {
      notifications: []
    }
  }
}

export const ACTION_TYPES = {
  // Auth actions
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGIN_REQUIRES_2FA: 'LOGIN_REQUIRES_2FA',
  LOGIN_REQUIRES_2FA_SETUP: 'LOGIN_REQUIRES_2FA_SETUP',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  
  // UI actions
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
}

export default function storeReducer(store, action = {}) {
  switch(action.type) {
    case ACTION_TYPES.LOGIN_START:
      return {
        ...store,
        auth: {
          ...store.auth,
          isLoading: true,
          error: null,
          requires2FA: false,
          requires2FASetup: false
        }
      }

    case ACTION_TYPES.LOGIN_SUCCESS:
      return {
        ...store,
        auth: {
          ...store.auth,
          isAuthenticated: true,
          user: action.payload.user,
          role: action.payload.role,
          isLoading: false,
          error: null,
          requires2FA: false,
          requires2FASetup: false
        }
      }

    case ACTION_TYPES.LOGIN_REQUIRES_2FA:
      return {
        ...store,
        auth: {
          ...store.auth,
          isLoading: false,
          error: null,
          requires2FA: true,
          requires2FASetup: false
        }
      }

    case ACTION_TYPES.LOGIN_REQUIRES_2FA_SETUP:
      return {
        ...store,
        auth: {
          ...store.auth,
          isLoading: false,
          error: null,
          requires2FA: false,
          requires2FASetup: true
        }
      }

    case ACTION_TYPES.LOGIN_ERROR:
      return {
        ...store,
        auth: {
          ...store.auth,
          isAuthenticated: false,
          user: null,
          role: null,
          isLoading: false,
          error: action.payload,
          requires2FA: false,
          requires2FASetup: false
        }
      }

    case ACTION_TYPES.LOGOUT:
      return {
        ...store,
        auth: {
          isAuthenticated: false,
          user: null,
          role: null,
          isLoading: false,
          error: null,
          requires2FA: false,
          requires2FASetup: false
        }
      }

    case ACTION_TYPES.SET_USER:
      return {
        ...store,
        auth: {
          ...store.auth,
          user: action.payload,
          isAuthenticated: true
        }
      }

    case ACTION_TYPES.ADD_NOTIFICATION:
      return {
        ...store,
        ui: {
          ...store.ui,
          notifications: [...store.ui.notifications, action.payload]
        }
      }

    case ACTION_TYPES.REMOVE_NOTIFICATION:
      return {
        ...store,
        ui: {
          ...store.ui,
          notifications: store.ui.notifications.filter(n => n.id !== action.payload)
        }
      }

    case ACTION_TYPES.CLEAR_ERRORS:
      return {
        ...store,
        auth: {
          ...store.auth,
          error: null
        }
      }

    default:
      throw Error(`Acción desconocida: ${action.type}`)
  }
}