import { Controller, Post, Body, UseGuards, Request, Res } from '@nestjs/common'
import type { Response } from 'express'
import { AiService } from './ai.service'
import { GenerateReportDto } from './dto/generate-report.dto'
import { SavePromptDto } from './dto/save-prompt.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('get-prompt')
  getPrompt(@Request() req: any) {
    return this.aiService.getPrompt(req.user.userId)
  }

  @Post('save-prompt')
  savePrompt(@Request() req: any, @Body() dto: SavePromptDto) {
    return this.aiService.savePrompt(req.user.userId, dto)
  }

  @Post('generate')
  generate(@Request() req: any, @Body() dto: GenerateReportDto) {
    return this.aiService.generate(req.user.userId, dto)
  }

  @Post('generate-stream')
  async generateStream(@Request() req: any, @Body() dto: GenerateReportDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()
    await this.aiService.generateStream(req.user.userId, dto, res)
  }
}
