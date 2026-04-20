import User from '../models/User.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { validatePassword, validateEmail, getUser, validateToken, getUserFromToken } from './helper.js'
import { RegisterResponse, UserDetails, UserLoginResponse, UserLogout, UserUpdate } from './types.js'
import { MissingFieldError, IncorrectEmailPasswordError, InvalidTokenError, UserNotFound, InvalidBusinessNameError } from './errors.js'

/**
 * Register a new user.
 * Validates fields, hashes the password, and saves the user to the database.
 *
 * @param email        - Must be unique and correctly formatted.
 * @param businessName - Display name of the business.
 * @param abn          - 11-digit Australian Business Number.
 * @param password     - Plaintext password (hashed before storage).
 * @returns The new user's MongoDB `_id`.
 * @throws {MissingFieldError} If any field is absent.
 */
export const adminRegisterUser = async (
  email: string,
  businessName: string,
  abn: string,
  password: string
): Promise<RegisterResponse> => {
  if (!email || !businessName || !abn || !password)
    throw new MissingFieldError('Missing required fields')

  await validateEmail(email)
  validatePassword(password)
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await User.create({
    email,
    businessName,
    abn,
    password: hashedPassword,
  })

  return { code: 200, userId: user._id.toString() }
}


/**
 * Log in a registered user.
 * On success, signs a 1-hour JWT and appends it to the user's token list.
 *
 * @param email    - The user's registered email.
 * @param password - Plaintext password to verify against the stored hash.
 * @returns The user's `_id` and a signed JWT.
 * @throws {MissingFieldError}           If either field is absent.
 * @throws {IncorrectEmailPasswordError} If credentials don't match.
 */
export const adminAuthLogin = async (
  email: string,
  password: string
): Promise<UserLoginResponse> => {
  if (!email || !password)
    throw new MissingFieldError('Email and password are required')

  const user = await getUser(email)
  const passwordMatch = user && await bcrypt.compare(password, user.password)
  if (!passwordMatch)
    throw new IncorrectEmailPasswordError('Incorrect email or password')

  const token = jwt.sign(
    { adminId: user._id.toString() },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  )

  user.tokens.push(token)
  await user.save()

  return { code: 200, adminId: user._id.toString(), token }
}


/**
 * Log out the current user.
 * Validates the token — the caller should discard it after this call.
 *
 * @param token - The JWT issued at login.
 * @throws {InvalidTokenError} If the token is missing or invalid.
 */
export const adminAuthLogout = async (
  token: string
): Promise<UserLogout> => {
  if (!token || !validateToken(token))
    throw new InvalidTokenError('Token is invalid')

  return { code: 200 }
}


/**
 * Get the authenticated user's profile details.
 * Returns email, business name, and ABN — password hash is excluded.
 *
 * @param token - A valid JWT.
 * @throws {InvalidTokenError} If the token is missing or invalid.
 */
export const adminUserDetails = async (
  token: string
): Promise<UserDetails> => {
  if (!token || !validateToken(token))
    throw new InvalidTokenError('Token is invalid')

  const user = await getUserFromToken(token)
  return {
    email: user.email,
    businessName: user.businessName,
    abn: user.abn,
    phoneNumber: user.phoneNumber ?? '',
    address: user.address ?? '',
    includeAbn: user.includeAbn ?? true,
    includeEmail: user.includeEmail ?? true,
    includePhoneNumber: user.includePhoneNumber ?? true,
    includeAddress: user.includeAddress ?? true,
  }
}


/**
 * Update the authenticated user's profile.
 * All fields are optional — only provided fields are updated.
 * Emails are normalised (trimmed + lowercased) and checked for uniqueness.
 *
 * @param token   - A valid JWT.
 * @param updates - Any of: `email`, `businessName`, `password`.
 * @throws {UserNotFound}             If no user matches the token.
 * @throws {InvalidBusinessNameError} If `businessName` is blank.
 */
export const adminUserDetailsUpdate = async (
  token: string,
  updates: UserUpdate
): Promise<void> => {
  const user = await getUserFromToken(token)

  if (!user)
    throw new UserNotFound('User does not exist')

  const {
    email,
    businessName,
    password,
    abn,
    phoneNumber,
    address,
    includeAbn,
    includeEmail,
    includePhoneNumber,
    includeAddress
  } = updates

  if (email !== undefined) {
    const normalisedEmail = email.trim().toLowerCase()
    if (normalisedEmail !== user.email) {
      await validateEmail(normalisedEmail)
      user.email = normalisedEmail
    }
  }

  if (businessName !== undefined) {
    if (businessName.trim().length === 0)
      throw new InvalidBusinessNameError('Business name cannot be empty')
    user.businessName = businessName.trim()
  }

  if (abn !== undefined) {
    user.abn = abn.trim()
  }

  if (phoneNumber !== undefined) {
    user.phoneNumber = phoneNumber.trim()
  }

  if (address !== undefined) {
    user.address = address.trim()
  }

  if (includeAbn !== undefined) {
    user.includeAbn = includeAbn
  }

  if (includeEmail !== undefined) {
    user.includeEmail = includeEmail
  }

  if (includePhoneNumber !== undefined) {
    user.includePhoneNumber = includePhoneNumber
  }

  if (includeAddress !== undefined) {
    user.includeAddress = includeAddress
  }

  if (password !== undefined) {
    validatePassword(password)
    user.password = await bcrypt.hash(password, 10)
  }

  await user.save()
}