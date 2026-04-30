import { IsEnum, IsString, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class ChatMessageDto {
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant'

  @IsString()
  content: string
}

export class GenerateReportDto {
  @IsEnum(['daily', 'weekly'])
  type: 'daily' | 'weekly'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[]
}
