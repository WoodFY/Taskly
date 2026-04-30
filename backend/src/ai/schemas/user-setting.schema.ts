import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export interface UserSettingDocument extends Document {
  userId: Types.ObjectId // 关联用户
  dailyPrompt: string // 日报 prompt 模板
  weeklyPrompt: string // 周报 prompt 模板
  createdAt: Date
  updatedAt: Date
}

@Schema({ timestamps: true })
export class UserSetting {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true })
  userId: Types.ObjectId

  @Prop({ default: '' })
  dailyPrompt: string

  @Prop({ default: '' })
  weeklyPrompt: string
}

export const UserSettingSchema = SchemaFactory.createForClass(UserSetting)
