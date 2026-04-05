'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Settings,
  ChevronDown,
  Plus,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface SidebarStats {
  activeProjects: number
  openTasks: number
}

interface AppSidebarProps {
  stats: SidebarStats
}

const mainNavItems = [
  {
    title: 'Inicio',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Proyectos',
    url: '/projects',
    icon: FolderKanban,
  },
  {
    title: 'Tareas',
    url: '/tasks',
    icon: CheckSquare,
  },
  {
    title: 'Calendario',
    url: '/calendar',
    icon: Calendar,
  },
]

const settingsNavItems = [
  {
    title: 'Configuración',
    url: '/settings',
    icon: Settings,
  },
]

export function AppSidebar({ stats }: AppSidebarProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const [sidebarStats, setSidebarStats] = useState<SidebarStats>(stats)

  useEffect(() => {
    const controller = new AbortController()

    async function loadStats() {
      try {
        const response = await fetch('/api/sidebar-stats', {
          method: 'GET',
          signal: controller.signal,
        })
        const payload = (await response.json()) as
          | { ok: true; data: SidebarStats }
          | { ok: false; message: string }

        if (payload.ok) {
          setSidebarStats(payload.data)
        }
      } catch {
        // No-op: el sidebar puede usar los valores iniciales.
      }
    }

    void loadStats()

    return () => controller.abort()
  }, [])

  const isActive = (url: string) => {
    if (url === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(url)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background">
                    <FolderKanban className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Gestor de Proyectos</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Espacio personal
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuItem disabled>
                  <Plus className="mr-2 size-4" />
                  No disponible
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 size-4" />
                  Configuración del espacio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                      {item.title === 'Proyectos' && state === 'expanded' && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {sidebarStats.activeProjects}
                        </span>
                      )}
                      {item.title === 'Tareas' && state === 'expanded' && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {sidebarStats.openTasks}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-foreground/10 text-foreground text-xs">
                      JP
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Usuario personal</span>
                    <span className="truncate text-xs text-muted-foreground">Sin login</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="end"
                side="top"
                sideOffset={4}
              >
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 size-4" />
                  Configuración de cuenta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" disabled>
                  No disponible
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
