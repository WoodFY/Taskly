import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export interface UserDocument extends Document {
  email: string // 用户邮箱
  password: string // 加密后的密码
  refreshToken?: string // refresh token（可选）
  createdAt: Date
  updatedAt: Date
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string

  @Prop({ required: true })
  password: string

  @Prop({ default: null })
  refreshToken: string
}

export const UserSchema = SchemaFactory.createForClass(User)
