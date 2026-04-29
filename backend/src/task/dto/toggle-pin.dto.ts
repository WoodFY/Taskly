import { IsString } from 'class-validator'

export class TogglePinDto {
  @IsString()
  id: string
}
