import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'
import { TaskService } from './task.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { GetTaskListDto } from './dto/get-task-list.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { DeleteTaskDto } from './dto/delete-task.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('task')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post('create')
  create(@Request() req: any, @Body() dto: CreateTaskDto) {
    return this.taskService.create(req.user.userId, dto)
  }

  @Post('get-list')
  getList(@Request() req: any, @Body() dto: GetTaskListDto) {
    return this.taskService.getList(req.user.userId, dto)
  }

  @Post('update')
  update(@Request() req: any, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(req.user.userId, dto)
  }

  @Post('delete')
  delete(@Request() req: any, @Body() dto: DeleteTaskDto) {
    return this.taskService.delete(req.user.userId, dto.id)
  }
}
