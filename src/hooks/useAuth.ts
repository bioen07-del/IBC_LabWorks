import { useState } from 'react'

interface CurrentUser {
  id: number
  email: string
  full_name: string | null
  role: string
}

// Используем существующего admin пользователя из БД
const DEMO_USER: CurrentUser = {
  id: 2,
  email: 'admin@bmcp.lab',
  full_name: 'Иванов Алексей Петрович',
  role: 'admin'
}

export function useAuth() {
  const [user] = useState<CurrentUser | null>(DEMO_USER)
  const [loading] = useState(false)

  return { user, loading, userId: user?.id || 2 }
}

// Для использования в insert/update операциях
export function getCurrentUserId(): number {
  // Используем admin (id=2) из таблицы users
  return 2
}
