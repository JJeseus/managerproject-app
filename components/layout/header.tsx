'use client'

import { Fragment } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Search, Bell, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HeaderProps {
  title: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function Header({ title, breadcrumbs = [] }: HeaderProps) {
  const { setTheme } = useTheme()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.length === 0 ? (
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.label}>
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" disabled>
                <Search className="size-4" />
                <span className="sr-only">Buscar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>No disponible</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" disabled>
                <Bell className="size-4" />
                <span className="sr-only">Notificaciones</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>No disponible</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Cambiar tema</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              Oscuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 gap-1" disabled>
              <Plus className="size-4" />
              <span className="hidden sm:inline">No disponible</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>Crear proyecto</DropdownMenuItem>
            <DropdownMenuItem disabled>Crear tarea</DropdownMenuItem>
            <DropdownMenuItem disabled>Crear nota</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
