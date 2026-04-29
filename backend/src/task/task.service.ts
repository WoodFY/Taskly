import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema'
import { CreateTaskDto } from './dto/create-task.dto'
import { GetTaskListDto } from './dto/get-task-list.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { DefaultException } from '../common/exceptions/default.exception'

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(userId: string, dto: CreateTaskDto) {
    return this.taskModel.create({
      ...dto,
      userId: new Types.ObjectId(userId)
    })
  }

  async getList(userId: string, dto: GetTaskListDto) {
    const { page = 1, pageSize = 10, status, keyword, dueDateStart, dueDateEnd } = dto

    const filter: any = {
      userId: new Types.ObjectId(userId),
      deletedAt: null
    }

    if (status) filter.status = status

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    }

    if (dueDateStart || dueDateEnd) {
      filter.dueDate = {}
      if (dueDateStart) filter.dueDate.$gte = new Date(dueDateStart)
      if (dueDateEnd) filter.dueDate.$lte = new Date(dueDateEnd)
    }

    const total = await this.taskModel.countDocuments(filter)
    const list = await this.taskModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // 统计各状态数量
    const stats = await this.taskModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    const statsMap = { pending: 0, in_progress: 0, completed: 0 }
    stats.forEach(s => {
      statsMap[s._id as TaskStatus] = s.count
    })

    return {
      list,
      total,
      page,
      pageSize,
      stats: {
        total: statsMap.pending + statsMap.in_progress + statsMap.completed,
        completed: statsMap.completed,
        completionRate:
          statsMap.pending + statsMap.in_progress + statsMap.completed > 0
            ? Math.round(
                (statsMap.completed / (statsMap.pending + statsMap.in_progress + statsMap.completed)) * 100
              )
            : 0
      }
    }
  }

  async update(userId: string, dto: UpdateTaskDto) {
    const task = await this.taskModel.findOne({
      _id: dto.id,
      userId: new Types.ObjectId(userId),
      deletedAt: null
    })
    if (!task) throw new DefaultException('task not found')

    const { id, ...updateData } = dto
    Object.assign(task, updateData)
    return task.save()
  }

  async delete(userId: string, id: string) {
    const task = await this.taskModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
      deletedAt: null
    })
    if (!task) throw new DefaultException('task not found')

    task.deletedAt = new Date()
    await task.save()
  }
}
