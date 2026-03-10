import { Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'
import { extractBearerToken, validateToken } from "../src/helper.js"
import { AuthUser } from "../src/types.js"

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req)

  if (!token || !validateToken(token))
    return res.status(400).json({ error: 'INVALID_TOKEN', message: 'Token is invalid or empty' })

  req.user = jwt.decode(token) as AuthUser
  next()
}