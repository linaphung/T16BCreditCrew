export class MissingFieldError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'MISSING_FIELD'
    this.statusCode = statusCode
  }
}

export class InvalidEmailError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'INVALID_EMAIL'
    this.statusCode = statusCode
  }
}

export class EmailExistsError extends Error{
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'EMAIL_EXISTS'
    this.statusCode = statusCode
  }
}

export class InvalidPasswordError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'INVALID_PASSWORD'
    this.statusCode = statusCode
  }
}

export class InvalidBusinessNameError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'INVALID_BUSINESS_NAME'
    this.statusCode = statusCode
  }
}

export class IncorrectEmailPasswordError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'INVALID_PASSWORD_OR_EMAIL'
    this.statusCode = statusCode
  }
}

export class InvalidTokenError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'INVALID_TOKEN'
    this.statusCode = statusCode
  }
}

export class UserNotFound extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 404) {
    super(message)
    this.name = 'USER_DOES_NOT_EXIST'
    this.statusCode = statusCode
  }
}

export class InvoiceBadRequest extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'INVOICE_BAD_REQUEST'
    this.statusCode = statusCode
  }
}

export class InvoiceNotFoundError extends Error {
  statusCode: number
  constructor(message: string = 'Invoice not found', statusCode: number = 404) {
    super(message)
    this.name = 'INVOICE_NOT_FOUND'
    this.statusCode = statusCode
  }
}

export class InvalidFileError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'INVALID_FILE'
    this.statusCode = statusCode
  }
}