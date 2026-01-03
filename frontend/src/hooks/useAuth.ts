import { useAuthContext } from '../context/AuthContext'

// simple passthrough hook
export function useAuth() {
  return useAuthContext()
}
