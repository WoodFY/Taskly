import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface TaskDocument extends Document {
  title: string // 任务标题
  description: string // 任务描述
  status: TaskStatus // 任务状态
  userId: Types.ObjectId // 所属用户ID
  isPinned: boolean // 是否置顶
  createdAt: Date
  updatedAt: Date
  dueDate?: Date // 截止日期（可选）
  pinnedAt?: Date // 置顶时间（可选）
  deletedAt?: Date // 软删除时间（可选）
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true, trim: true })
  title: string

  @Prop({ default: '' })
  description: string

  @Prop({ enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ default: false })
  isPinned: boolean

  @Prop({ default: null })
  dueDate: Date

  @Prop({ default: null })
  pinnedAt: Date

  @Prop({ default: null })
  deletedAt: Date
}

export const TaskSchema = SchemaFactory.createForClass(Task)
