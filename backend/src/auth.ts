import User from '../models/User.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { validatePassword, validateEmail, getUser, validateToken, getUserFromToken } from './helper.js'
import { RegisterResponse, UserDetails, UserLoginResponse, UserLogout } from './types.js'
import { MissingFieldError, IncorrectEmailPasswordError, InvalidTokenError } from './errors.js'

//!                          adminRegisterUser
/* 
  Register a new user
 * @param {string} email - email to register under user
 * @param {string} businessName - name of business
 * @param {string} abn - unique 11 digit identifier 
 * @param {string} password - chosen password
 * @returns {SessionId} - returns object with user id
*/
export const adminRegisterUser = async (
  email: string, 
  businessName: string, 
  abn: string, 
  password: string
): Promise<RegisterResponse> => {
  if (!email || !businessName || !abn|| !password)
    throw new MissingFieldError('Missing required fields')
  
  // error checks email format and if in use, and if password valid
  await validateEmail(email)
  validatePassword(password)
  const hashedPassword = await bcrypt.hash(password, 10)

  // adds user to database
  const user = await User.create({
    email: email,
    businessName: businessName,
    abn: abn,
    password: hashedPassword
  })
  // return user id 
  // mongoDB automatically creates a unique id (_id) automatically for User
  return { code: 200, userId: user._id.toString() }
}


//!                          adminAuthLogin
/* 
  Logs in register user
 * @param {string} email - user's registered email
 * @param {string} password - user's registered password
 * @returns {SessionId} - returns object with user id
*/
export const adminAuthLogin = async (
  email: string,
  password: string
): Promise<UserLoginResponse> => {
  if (!email || !password) 
    throw new MissingFieldError('Email and password are required')
  
  // checks if password is correct for registered email 
  const user = await getUser(email)
  const passwordMatchUser = user && await bcrypt.compare(password, user.password)
  if (!passwordMatchUser) 
    throw new IncorrectEmailPasswordError('Incorrect email or password')

  // creates a token as user has been authenticated
  const token = jwt.sign(
    { adminId: user._id.toString() },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  )

  user.tokens.push(token)
  await user.save()

  return { code: 200, adminId: user._id.toString(), token }
}


//!                          adminAuthLogout
/* 
  Logs out register user
 * @returns {} - empty object 
*/
export const adminAuthLogout = async (
  token: string
): Promise<UserLogout> => {
  if (!token || !validateToken(token))
    throw new InvalidTokenError('Token is invalid')

  return { code: 200 }
}

//!                          adminUserDetails
/**
 * Gets a users details
 * @param token string
 * @returns object of email, buisnessName and abn
 */
export const adminUserDetails = async (
  token: string
): Promise<UserDetails> => {
  if (!token || !validateToken(token)) {
    throw new InvalidTokenError('Token is invalid')
  }

  const user = await getUserFromToken(token)
  return {
    email: user.email,
    businessName: user.businessName,
    abn: user.abn
  }
}
