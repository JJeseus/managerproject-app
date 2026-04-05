import { expect, test } from '@playwright/test'

test('muestra navegación principal en español', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Inicio')).toBeVisible()
  await expect(page.getByText('Proyectos')).toBeVisible()
  await expect(page.getByText('Tareas')).toBeVisible()
  await expect(page.getByText('Calendario')).toBeVisible()
})
