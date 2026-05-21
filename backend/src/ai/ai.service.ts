import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import type { Response } from 'express'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { trimMessages } from '@langchain/core/messages'

import { UserSetting, UserSettingDocument } from './schemas/user-setting.schema'
import { AiConversation, AiConversationDocument } from './schemas/ai-conversation.schema'
import { GenerateReportDto } from './dto/generate-report.dto'
import { SavePromptDto } from './dto/save-prompt.dto'
import { CreateConversationDto } from './dto/create-conversation.dto'
import { UpdateConversationDto } from './dto/update-conversation.dto'
import { DefaultException } from '../common/exceptions/default.exception'
import { LlmFactory } from './llm.factory'

@Injectable()
export class AiService {
  constructor(
    @InjectModel(UserSetting.name) private userSettingModel: Model<UserSettingDocument>,
    @InjectModel(AiConversation.name) private conversationModel: Model<AiConversationDocument>,
    private llmFactory: LlmFactory
  ) {}

  async getPrompt(userId: string) {
    const setting = await this.userSettingModel.findOne({ userId: new Types.ObjectId(userId) })
    return {
      dailyPrompt: setting?.dailyPrompt ?? '',
      weeklyPrompt: setting?.weeklyPrompt ?? ''
    }
  }

  async savePrompt(userId: string, dto: SavePromptDto) {
    const field = dto.type === 'daily' ? 'dailyPrompt' : 'weeklyPrompt'
    await this.userSettingModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { [field]: dto.prompt },
      { upsert: true, new: true }
    )
    return { success: true }
  }

  private toLangChainMessages(messages: { role: string, content: string }[]) {
    // 将 DTO 中的消息（{role, content} 格式）转换为 LangChain 的标准消息格式
    return messages.map((msg) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content)
      } else {
        return new AIMessage(msg.content)
      }
    })
  }

  async generate(userId: string, dto: GenerateReportDto) {
    // 创建模型实例
    const model = dto.type === 'chat'
      ? this.llmFactory.createForChat()
      : this.llmFactory.createForReport()

    const langChainMessages = this.toLangChainMessages(dto.messages)

    // 对消息进行修剪以适应模型的上下文窗口
    const trimmedMessages = await trimMessages(langChainMessages, {
      maxTokens: 6000,
      strategy: 'last', // 保留最后的消息
      tokenCounter: model,  // 使用模型自身的 tokenizer 来计算 token 数
      startOn: 'human'  // 从最后一个 human message 开始保留消息，确保上下文的连续性
    })

    // 调用 LLM 生成内容
    try {
      // const response = await model.invoke(langChainMessages)
      const response = await model.invoke(trimmedMessages)
      const content = typeof response.content === 'string'
        ? response.content
        : (response.content as any[]).map(
          // 处理多模态的 content（LangChain 返回类型是联合类型）
          c => typeof c === 'object' && 'text' in c ? c.text : ''
        ).join('')
      
      return { content }
    } catch (error) {
      throw new DefaultException('AI request failed: ${(error as Error).message}')
    }
  }

  async generateStream(userId: string, dto: GenerateReportDto, res: Response) {
    // 创建模型实例
    const model = dto.type === 'chat'
      ? this.llmFactory.createForChat()
      : this.llmFactory.createForReport()

    const langChainMessages = this.toLangChainMessages(dto.messages)

    // 调用 LLM 生成内容（流式）
    try {
      const stream = await model.stream(langChainMessages)

      for await (const chunk of stream) {
        const text = typeof chunk.content === 'string'
          ? chunk.content
          : (chunk.content as any[]).map(c => 
            typeof c === 'object' && 'text' in c ? c.text : ''
          ).join('')

        if (text) {
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`)
        }
      }

      res.write('data: [DONE]\n\n')
      res.end()

    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: `Stream error: ${(error as Error).message}` })}\n\n`)
      res.end()
    }
  }

  async getConversations(userId: string) {
    return this.conversationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .lean()
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const conv = await this.conversationModel.create({
      userId: new Types.ObjectId(userId),
      type: dto.type,
      name: dto.name,
      messages: dto.messages
    })
    return conv
  }

  async updateConversation(userId: string, id: string, dto: UpdateConversationDto) {
    const conv = await this.conversationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { ...(dto.name !== undefined && { name: dto.name }), ...(dto.messages !== undefined && { messages: dto.messages }) },
      { new: true }
    )
    if (!conv) throw new DefaultException('Conversation not found')
    return conv
  }

  async deleteConversation(userId: string, id: string) {
    await this.conversationModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    })
    return { success: true }
  }
}
