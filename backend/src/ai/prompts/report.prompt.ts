import { ChatPromptTemplate } from '@langchain/core/prompts'

// 日报 Prompt 模版
export const dailyReportPrompt = ChatPromptTemplate.fromMessages([
    // SystemMessage: 系统级别的指令
    [
        'system',
        `You are a professional work report writer.
You must respond in {language}.
Requirements:
- Use concise, professional language
- Categorize tasks by completion status (completed, in progress, pending)
- End with a brief summary of the day's work
- Do NOT make up tasks or details not in the provided data`
    ],

    // HumanMessage: 用户输入
    [
        'human',
        `Please generate a professional daily work report based on the following task list.

{taskTable}`
    ]
])

// 周报 Prompt 模版
export const weeklyReportPrompt = ChatPromptTemplate.fromMessages([
    [
        'system',
        `You are a professional work report writer.
You must respond in {language}.
Requirements:
- Use concise, professional language
- Summarize the week's work by categories
- Highlight key accomplishments and blockers
- End with a brief outlook for next week
- Do NOT make up tasks or details not in the provided data`
    ],
    
    [
        'human',
        `Please generate a professional weekly work report based on the following task list.

{taskTable}`
    ]
])

// 自由对话 Prompt 模版
export const chatPrompt = ChatPromptTemplate.fromMessages([
    'system',
    `You are a helpful work assistant. You help users manage their tasks, plan their work, and improve productivity.
You must respond in {language}.
Keep your answers concise and actionable.`
])

export function getReportPrompt(type: 'daily' | 'weekly' | 'chat') {
    switch (type) {
        case 'daily':
            return dailyReportPrompt
        case 'weekly':
            return weeklyReportPrompt
        default:
            return chatPrompt
    }
} 