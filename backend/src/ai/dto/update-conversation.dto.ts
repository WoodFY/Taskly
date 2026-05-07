import { IsEnum, IsString, IsArray, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class MessageEntryDto {
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant'

  @IsString()
  content: string
}

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageEntryDto)
  messages?: MessageEntryDto[]
}
