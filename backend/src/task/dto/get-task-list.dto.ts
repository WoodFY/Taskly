import { IsOptional, IsEnum, IsInt, IsString, IsDateString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { TaskStatus } from '../schemas/task.schema'

export class GetTaskListDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsDateString()
  dueDateStart?: string

  @IsOptional()
  @IsDateString()
  dueDateEnd?: string

  @IsOptional()
  @IsDateString()
  createdAtDate?: string // 按创建日期精确筛选（点击日历格子时使用）
}
