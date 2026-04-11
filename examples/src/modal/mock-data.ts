export interface User {
  id: string
  name: string
  email: string
}

export const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com' },
  { id: '2', name: 'Jane Doe', email: 'jane.doe@example.com' },
  { id: '3', name: 'John Smith', email: 'john.smith@example.com' },
]
