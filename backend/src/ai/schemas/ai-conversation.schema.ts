import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export interface MessageEntry {
  role: 'user' | 'assistant'
  content: string
}

export interface AiConversationDocument extends Document {
  userId: Types.ObjectId
  type: 'daily' | 'weekly'
  name: string
  messages: MessageEntry[]
  createdAt: Date
  updatedAt: Date
}

@Schema({ timestamps: true })
export class AiConversation {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId

  @Prop({ required: true, enum: ['daily', 'weekly', 'chat'] })
  type: string

  @Prop({ required: true })
  name: string

  @Prop({
    type: [{ role: { type: String, required: true }, content: { type: String, required: true } }],
    default: []
  })
  messages: MessageEntry[]
}

export const AiConversationSchema = SchemaFactory.createForClass(AiConversation)
