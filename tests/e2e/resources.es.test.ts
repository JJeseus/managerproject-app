import { expect, test } from '@playwright/test'

test.skip('sincroniza vista y búsqueda del workspace de recursos con la URL', async ({ page }) => {
  await page.goto('/resources')

  await expect(page.getByRole('heading', { name: 'Recursos' })).toBeVisible()
  await expect(page.getByLabel('Buscar recursos')).toBeVisible()

  await page.getByLabel('Buscar recursos').fill('cliente')
  await expect(page).toHaveURL(/\/resources\?q=cliente/)

  await page.getByRole('button', { name: 'Mapa' }).click()
  await expect(page).toHaveURL(/view=map/)

  await page.getByRole('button', { name: 'Lista' }).click()
  await expect(page).toHaveURL(/\/resources\?q=cliente/)
  await expect(page).not.toHaveURL(/view=map/)
})
