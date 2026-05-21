import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { LlmFactory } from './llm.factory'
import { UserSetting, UserSettingSchema } from './schemas/user-setting.schema'
import { AiConversation, AiConversationSchema } from './schemas/ai-conversation.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSetting.name, schema: UserSettingSchema },
      { name: AiConversation.name, schema: AiConversationSchema }
    ])
  ],
  controllers: [AiController],
  providers: [
    AiService,
    LlmFactory
  ]
})
export class AiModule {}
