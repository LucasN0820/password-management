import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@repo/ui/primitives/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/primitives/dropdown-menu'

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function NavUser({ user }: NavUserProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors duration-150">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-[var(--accent-blue)] text-white">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground truncate">
            {user.name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-48">
        <DropdownMenuItem className="text-sm text-muted-foreground cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
