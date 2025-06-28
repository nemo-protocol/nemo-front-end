import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

const TOKEN_EXPIRATION_TIME = 60 * 60 * 1000 // 1小时，单位：毫秒

interface JwtData {
  token: string
  timestamp: string
  address: string
  isActive: boolean
}

interface JwtState {
  users: JwtData[]
  current?: JwtData
  setToken: (token: string, timestamp: string, address: string) => void
  setActiveUser: (address: string) => void
}

const JWT_STORAGE_KEY = "nemo_auth_token"

const isTokenExpired = (timestamp: string): boolean => {
  const tokenTime = new Date(timestamp).getTime()
  const currentTime = new Date().getTime()
  return currentTime - tokenTime > TOKEN_EXPIRATION_TIME
}

const customStorage = {
  getItem: (name: string) => {
    const value = localStorage.getItem(name)
    if (!value) return null
    
    try {
      const data = JSON.parse(value)
      if (data?.state?.users) {
        // 过滤掉过期的 token
        const validUsers = data.state.users.filter(
          (user: JwtData) => !isTokenExpired(user.timestamp)
        )
        if (validUsers.length === 0) {
          localStorage.removeItem(name)
          return null
        }
        data.state.users = validUsers
        // 如果当前用户已过期，则清除
        if (data.state.current && isTokenExpired(data.state.current.timestamp)) {
          data.state.current = undefined
        }
        return JSON.stringify(data)
      }
      return value
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
}

export const useJwtStore = create<JwtState>()(
  persist(
    (set) => ({
      users: [],
      current: undefined,
      setToken: (token: string, timestamp: string, address: string) => {
        if (!timestamp || !token || !address) {
          throw new Error("Invalid token, timestamp or address")
        }
        set((state) => {
          const existingUserIndex = state.users.findIndex(
            (user) => user.address === address
          )
          const newUser = { token, timestamp, address, isActive: true }
          
          if (existingUserIndex >= 0) {
            // 更新现有用户
            const updatedUsers = [...state.users]
            updatedUsers[existingUserIndex] = newUser
            return { 
              users: updatedUsers,
              current: newUser
            }
          } else {
            // 添加新用户
            return { 
              users: [...state.users, newUser],
              current: newUser
            }
          }
        })
      },
      setActiveUser: (address: string) => {
        set((state) => {
          if (!address) {
            return {
              users: state.users.map((user) => ({
                ...user,
                isActive: false
              })),
              current: undefined
            }
          }
          const user = state.users.find(u => u.address === address)
          return {
            users: state.users.map((user) => ({
              ...user,
              isActive: user.address === address
            })),
            current: user
          }
        })
      }
    }),
    {
      name: JWT_STORAGE_KEY,
      storage: createJSONStorage(() => customStorage),
    },
  ),
)
