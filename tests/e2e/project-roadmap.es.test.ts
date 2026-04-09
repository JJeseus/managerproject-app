import { test } from '@playwright/test'

test.skip('permite gestionar fases y mover tareas dentro de la hoja de ruta de un proyecto', async ({
  page,
}) => {
  await page.goto('/projects/proj-1')

  await page.getByRole('tab', { name: /Hoja de ruta/ }).click()
  await page.getByRole('button', { name: /Nueva fase/ }).click()
  await page.getByLabel('Título').fill('QA final')
  await page.getByRole('button', { name: /Crear fase/ }).click()

  await page.getByRole('button', { name: /Nueva tarea/ }).click()
  await page.getByLabel('Título').fill('Verificar entregable')
  await page.getByRole('button', { name: /Crear tarea/ }).click()
})
