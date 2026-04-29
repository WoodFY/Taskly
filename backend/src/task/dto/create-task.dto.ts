import { IsString, IsOptional, IsEnum, IsDateString, MinLength } from 'class-validator'
import { TaskStatus } from '../schemas/task.schema'

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string

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
