import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatOpenAI } from '@langchain/openai'

@Injectable()
export class LlmFactory {
    constructor(private configService: ConfigService) {}

    // 创建一个用于报告生成的模型实例
    createForReport(): ChatOpenAI {
        return new ChatOpenAI({
            configuration: {
                baseURL: this.configService.get<string>('AI_BASE_URL')!,
                apiKey: this.configService.get<string>('AI_API_KEY')!
            },

            model: this.configService.get<string>('AI_MODEL')!,
            temperature: 0.7,
            maxTokens: 2048,
            streaming: true
        })
    }

    // 创建一个用于对话的模型实例
    createForChat(): ChatOpenAI {
        return new ChatOpenAI({
            configuration: {
                baseURL: this.configService.get<string>('AI_BASE_URL')!,
                apiKey: this.configService.get<string>('AI_API_KEY')!
            },
            model: this.configService.get<string>('AI_MODEL')!,
            temperature: 0.8,
            maxTokens: 4096,
            streaming: true
        })
    }
}