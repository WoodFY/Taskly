import { HttpException, HttpStatus } from '@nestjs/common'

export class DefaultException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ code: status, message }, status)
  }
}
