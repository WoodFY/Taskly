import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { UserService } from '../user/user.service'
import { DefaultException } from '../common/exceptions/default.exception'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async register(email: string, password: string) {
    const user = await this.userService.create(email, password)
    const userId = (user._id as any).toString()
    const tokens = await this.generateTokens(userId, user.email)
    await this.userService.updateRefreshToken(userId, tokens.refreshToken)
    return tokens
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email)
    if (!user) throw new DefaultException('invalid credentials')

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new DefaultException('invalid credentials')

    const userId = (user._id as any).toString()
    const tokens = await this.generateTokens(userId, user.email)
    await this.userService.updateRefreshToken(userId, tokens.refreshToken)
    return tokens
  }

  async refresh(userId: string, email: string, refreshToken: string) {
    const isValid = await this.userService.validateRefreshToken(userId, refreshToken)
    if (!isValid) throw new DefaultException('invalid refresh token')

    const tokens = await this.generateTokens(userId, email)
    await this.userService.updateRefreshToken(userId, tokens.refreshToken)
    return tokens
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null)
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN') as any
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') as any
      })
    ])

    return { accessToken, refreshToken }
  }
}
