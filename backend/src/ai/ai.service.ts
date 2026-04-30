import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import { UserSetting, UserSettingDocument } from './schemas/user-setting.schema'
import { GenerateReportDto } from './dto/generate-report.dto'
import { SavePromptDto } from './dto/save-prompt.dto'
import { DefaultException } from '../common/exceptions/default.exception'

@Injectable()
export class AiService {
  constructor(
    @InjectModel(UserSetting.name) private userSettingModel: Model<UserSettingDocument>,
    private configService: ConfigService
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

  async generate(userId: string, dto: GenerateReportDto) {
    const baseUrl = this.configService.get<string>('AI_BASE_URL')
    const apiKey = this.configService.get<string>('AI_API_KEY')
    const model = this.configService.get<string>('AI_MODEL')

    if (!baseUrl || !apiKey || !model) {
      throw new DefaultException('AI service not configured')
    }

    const typeLabel = dto.type === 'daily' ? '日报' : '周报'

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: dto.messages,
        max_tokens: 2048,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new DefaultException(`AI request failed: ${errorText}`)
    }

    const data = (await response.json()) as any
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      throw new DefaultException(`AI returned empty ${typeLabel}`)
    }

    return { content }
  }

  async generateStream(userId: string, dto: GenerateReportDto, res: Response) {
    const baseUrl = this.configService.get<string>('AI_BASE_URL')
    const apiKey = this.configService.get<string>('AI_API_KEY')
    const model = this.configService.get<string>('AI_MODEL')

    const writeError = (msg: string) => {
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
      res.end()
    }

    if (!baseUrl || !apiKey || !model) {
      return writeError('AI service not configured')
    }

    let aiResponse: globalThis.Response
    try {
      aiResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: dto.messages,
          max_tokens: 2048,
          temperature: 0.7,
          stream: true
        })
      })
    } catch (err) {
      return writeError(`Network error: ${String(err)}`)
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text().catch(() => `HTTP ${aiResponse.status}`)
      return writeError(errorText)
    }

    const reader = aiResponse.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n')
            res.end()
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`)
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch (err) {
      return writeError(`Stream error: ${String(err)}`)
    }

    res.write('data: [DONE]\n\n')
    res.end()
  }
}
