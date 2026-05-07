import { IsEnum, IsString, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class MessageEntryDto {
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant'

  @IsString()
  content: string
}

export class CreateConversationDto {
  @IsEnum(['daily', 'weekly', 'chat'])
  type: 'daily' | 'weekly' | 'chat'

  @IsString()
  name: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageEntryDto)
  messages: MessageEntryDto[]
}
