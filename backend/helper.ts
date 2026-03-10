import validator from 'validator';
import { InvalidPasswordError, InvalidEmailError, UserNotFound, InvalidTokenError } from './errors.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken'
import { Request } from 'express'
import { InvoiceData, OrderLine } from './types.js';
import {create} from 'xmlbuilder2'

export async function validateEmail(email: string) {
  const normaliseEmail = email.trim().toLocaleLowerCase()
  if (!validator.isEmail(normaliseEmail))
    throw new InvalidEmailError('Email is invalid')

  const existingUser = await User.findOne({email: normaliseEmail})
  if (existingUser)
    throw new InvalidEmailError('Email is already in use')
}

export function validatePassword(password: string) {
  const hasNoNumber = /^[^0-9]*$/.test(password)
  const hasNoLetter = /^[^a-zA-Z]*$/.test(password)

  if (password.length < 8)
    throw new InvalidPasswordError('Password is less than 8 characters')

  if (hasNoNumber || hasNoLetter) 
    throw new InvalidPasswordError('Password must contain at least 1 letter and 1 number')
}

export async function getUser(email: string) {
  return User.findOne({ email: email.toLowerCase() })
}

export function validateToken(token: string) {
  try {
    jwt.verify(token, process.env.JWT_SECRET as string)
    return true
  } catch {
    return false
  }
}

export function extractBearerToken(req: Request) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer '))
    return null

  return header.split('Bearer ')[1]
}

export const calculateLineExtension = (orderlines: OrderLine[]) => {
  return orderlines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0)
}

export const getUserAbn = async (userId: string) => {
  const user =  await User.findById(userId)
  if (!user) {
    throw new UserNotFound('User does not exist')
  }
  return user.abn;
}

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
  if (!user) {
    throw new UserNotFound('User does not exist')
  }

  return user
}

export const generateXMLString = (invoiceData: InvoiceData, invoiceId: string) => {
  const doc = create({ version: '1.0' })
    .ele('Invoice', {
      xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
    })

    .ele('cbc:ID')
      .txt(invoiceId)
    .up()

    .ele('cbc:IssueDate')
      .txt(invoiceData.issueDate)
    .up()

    .ele('cac:InvoicePeriod')
      .ele('cbc:StartDate')
        .txt(invoiceData.invoicePeriod.invoiceStartDate)
      .up()
      .ele('cbc:EndDate')
        .txt(invoiceData.invoicePeriod.invoiceEndDate)
      .up()
    .up()

    .ele('cac:AccountingSupplierParty')
      .ele('cac:Party')
        .ele('cac:PartyName')
          .ele('cbc:Name')
            .txt(invoiceData.seller.name)
          .up()
        .up()
      .up()
    .up()

    .ele('cac:AccountingCustomerParty')
      .ele('cac:Party')
        .ele('cac:PartyName')
          .ele('cbc:Name')
            .txt(invoiceData.buyer.name)
          .up()
        .up()
      .up()
    .up()

    .ele('cac:LegalMonetaryTotal')
      .ele('cbc:PayableAmount', {
        currencyID: invoiceData.payableAmount.currency
      })
        .txt(invoiceData.payableAmount.amount.toString())
      .up()
    .up()
  invoiceData.lineItems.forEach(line => {
    doc
      .ele('cac:InvoiceLine')
        .ele('cbc:ID')
          .txt(line.lineId)
        .up()
        .ele('cbc:LineExtensionAmount', {
          currencyID: invoiceData.payableAmount.currency
        })
          .txt((line.quantity * line.unitPrice).toString())
        .up()
        .ele('cac:Item')
          .ele('cbc:Description')
            .txt(line.itemName)
          .up()
        .up()
      .up()
  })

  return doc.end({ prettyPrint: true })
}