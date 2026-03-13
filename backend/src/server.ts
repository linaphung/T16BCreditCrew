import express from 'express'
import type { Request, Response } from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.get('/health', (_req: Request, res: Response) => {
  console.log('Health check hit')
  res.status(200).send('ok')
})

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello from Credit Crew')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})