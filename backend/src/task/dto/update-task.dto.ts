import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator'
import { TaskStatus } from '../schemas/task.schema'

export class UpdateTaskDto {
  @IsString()
  id: string

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus

  @IsOptional()
  @IsDateString()
  dueDate?: string
}
