import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { User, UserDocument } from './schemas/user.schema'
import { DefaultException } from '../common/exceptions/default.exception'

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(email: string, password: string): Promise<UserDocument> {
    const exists = await this.userModel.findOne({ email })
    if (exists) throw new DefaultException('email already registered')

    const hashed = await bcrypt.hash(password, 10)
    return this.userModel.create({ email, password: hashed })
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email })
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id)
  }

  async updateRefreshToken(userId: string, token: string | null): Promise<void> {
    const hashed = token ? await bcrypt.hash(token, 10) : null
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashed })
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userModel.findById(userId)
    if (!user?.refreshToken) return false
    return bcrypt.compare(token, user.refreshToken)
  }
}
