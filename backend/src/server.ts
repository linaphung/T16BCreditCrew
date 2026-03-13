import express from 'express'
import type { Request, Response } from 'express'
import dotenv from 'dotenv'

console.log('MINIMAL SERVER FILE IS RUNNING')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use((req, _res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`)
  next()
})

app.get('/health', (_req: Request, res: Response) => {
  console.log('Health check hit')
  res.status(200).send('ok')
})

app.get('/', (_req: Request, res: Response) => {
  console.log('Root hit')
  res.send('Hello from Credit Crew')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})