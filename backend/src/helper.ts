import validator from 'validator';
import { InvalidPasswordError, InvalidEmailError, UserNotFound, InvalidTokenError, EmailExistsError } from './errors.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken'
import { Request } from 'express'
import { InvoiceData, OrderLine } from './types.js';
import { create } from 'xmlbuilder2'

/**
 * Validates an email address and checks it isn't already in use.
 * @throws {InvalidEmailError} If the format is invalid.
 * @throws {EmailExistsError}  If the email is already registered.
 */
export async function validateEmail(email: string) {
  const normaliseEmail = email.trim().toLocaleLowerCase()
  if (!validator.isEmail(normaliseEmail))
    throw new InvalidEmailError('Email is invalid')

  const existingUser = await User.findOne({ email: normaliseEmail })
  if (existingUser)
    throw new EmailExistsError('Email is already in use')
}

/**
 * Validates a password meets minimum complexity rules:
 * at least 8 characters, with at least one letter and one number.
 * @throws {InvalidPasswordError} If the password fails any rule.
 */
export function validatePassword(password: string) {
  const hasNoNumber = /^[^0-9]*$/.test(password)
  const hasNoLetter = /^[^a-zA-Z]*$/.test(password)

  if (password.length < 8)
    throw new InvalidPasswordError('Password is less than 8 characters')

  if (hasNoNumber || hasNoLetter)
    throw new InvalidPasswordError('Password must contain at least 1 letter and 1 number')
}

/**
 * Looks up a user by email address (case-insensitive).
 * Returns null if not found.
 */
export async function getUser(email: string) {
  return User.findOne({ email: email.toLowerCase() })
}

/**
 * Verifies a JWT against the app secret.
 * Returns true if valid, false otherwise.
 */
export function validateToken(token: string) {
  try {
    jwt.verify(token, process.env.JWT_SECRET as string)
    return true
  } catch {
    return false
  }
}

/**
 * Extracts the bearer token from an Authorization header.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(req: Request) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer '))
    return null

  return header.split('Bearer ')[1]
}

/**
 * Sums the line extension amounts (quantity * unitPrice) across all order lines.
 */
export const calculateLineExtension = (orderlines: OrderLine[]) => {
  const total = orderlines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0)
  return Math.round(total * 100) / 100
}

/**
 * Looks up a user's ABN by their user ID.
 * @throws {UserNotFound} If no user matches the given ID.
 */
export const getUserAbn = async (userId: string) => {
  const user = await User.findById(userId)
  if (!user)
    throw new UserNotFound('User does not exist')

  return user.abn
}

/**
 * Decodes a JWT and returns the corresponding user from the database.
 * @throws {InvalidTokenError} If the token is invalid or expired.
 * @throws {UserNotFound}      If the token's user no longer exists.
 */
export const getUserFromToken = async (token: string) => {
  let decoded: { adminId: string }

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { adminId: string }
  } catch {
    throw new InvalidTokenError('Invalid token')
  }

  const user = await User.findById(decoded.adminId)
  if (!user)
    throw new UserNotFound('User does not exist')

  return user
}

/**
 * Builds a UBL 2.1 compliant XML invoice string from the provided invoice data.
 * Line extension amounts are calculated per line (quantity * unitPrice).
 *
 * @param invoiceData - The invoice payload including seller, buyer, line items, and totals.
 * @param invoiceId   - The unique identifier to embed in the XML document.
 * @returns A pretty-printed UBL XML string.
 */
export const generateXMLString = (invoiceData: InvoiceData, invoiceId: string) => {
  const root = create({ version: '1.0' })
    .ele('Invoice', {
      xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
    })
    .ele('cbc:ID').txt(invoiceId).up()
    .ele('cbc:IssueDate').txt(invoiceData.issueDate).up()

  // Only add InvoicePeriod if both dates are present
  if (invoiceData.invoicePeriod?.startDate && invoiceData.invoicePeriod?.endDate) {
    root
      .ele('cac:InvoicePeriod')
        .ele('cbc:StartDate').txt(invoiceData.invoicePeriod.startDate).up()
        .ele('cbc:EndDate').txt(invoiceData.invoicePeriod.endDate).up()
      .up()
  }

  root
    .ele('cac:AccountingSupplierParty')
      .ele('cac:Party').ele('cac:PartyName').ele('cbc:Name').txt(invoiceData.seller.name).up().up().up()
    .up()
    .ele('cac:AccountingCustomerParty')
      .ele('cac:Party').ele('cac:PartyName').ele('cbc:Name').txt(invoiceData.buyer.name).up().up().up()
    .up()
    .ele('cac:LegalMonetaryTotal')
      .ele('cbc:PayableAmount', { currencyID: invoiceData.payableAmount.currency })
        .txt(invoiceData.payableAmount.amount.toString())
      .up()
    .up()

  invoiceData.lineItems.forEach(line => {
    root
      .ele('cac:InvoiceLine')
        .ele('cbc:ID').txt(line.lineId).up()
        .ele('cbc:LineExtensionAmount', { currencyID: invoiceData.payableAmount.currency })
          .txt((line.quantity * line.unitPrice).toString())
        .up()
        .ele('cac:Item').ele('cbc:Description').txt(line.itemName).up().up()
      .up()
  })

  return root.end({ prettyPrint: true })
}

export const isOverdue = (dueDate: string) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return new Date(dueDate) < startOfToday;
}