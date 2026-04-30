import { IsEnum, IsString } from 'class-validator'

export class SavePromptDto {
  @IsEnum(['daily', 'weekly'])
  type: 'daily' | 'weekly'

  @IsString()
  prompt: string
}
