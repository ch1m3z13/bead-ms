import OpenAI from 'openai';
import { createLogger } from '@bead/shared';

const logger = createLogger('llm');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratePostOptions {
  projectName: string;
  insights: Array<{
    content: string;
    source: string;
    author?: string;
  }>;
  tone: 'witty' | 'serious' | 'hype' | 'educational';
}

export async function generatePost(options: GeneratePostOptions): Promise<string> {
  const { projectName, insights, tone } = options;

  const systemPrompt = getSystemPrompt(tone);
  const userPrompt = buildUserPrompt(projectName, insights);

  try {
    logger.info('Generating post', { 
      projectName, 
      insightCount: insights.length, 
      tone 
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });

    const post = completion.choices[0].message.content?.trim() || '';
    
    logger.info('Post generated', { 
      length: post.length,
      tokensUsed: completion.usage?.total_tokens 
    });

    return post;
  } catch (error: any) {
    logger.error('LLM generation failed', { error: error.message });
    throw new Error(`LLM generation failed: ${error.message}`);
  }
}

function getSystemPrompt(tone: string): string {
  const prompts = {
    witty: `You are a crypto/web3 social media expert who writes witty, engaging posts. 
Your posts are clever, use emojis sparingly, and have a conversational tone. 
Keep posts under 280 characters. Focus on insights, not hype.`,

    hype: `You are an enthusiastic crypto community manager. 
Write energetic posts with emojis and exciting language. 
Keep posts under 280 characters. Make people excited but stay credible.`,

    educational: `You are a web3 educator who breaks down complex topics simply. 
Write informative threads that teach while staying accessible. 
Use clear structure and bullet points. Keep main post under 280 chars.`,

    serious: `You are a professional crypto analyst. 
Write objective, data-driven posts. Avoid emojis and hype. 
Focus on facts and insights. Keep posts under 280 characters.`,
  };

  return prompts[tone as keyof typeof prompts] || prompts.witty;
}

function buildUserPrompt(projectName: string, insights: any[]): string {
  const insightsList = insights
    .map((i, idx) => `${idx + 1}. [${i.source}] ${i.content}`)
    .join('\n');

  return `Project: ${projectName}

Recent insights and mentions:
${insightsList}

Create ONE engaging social media post about ${projectName} based on these insights. 
The post should:
- Synthesize the key themes from the insights
- Be authentic and engaging
- Be suitable for Twitter/Farcaster
- NOT directly quote the insights
- Be original and creative

Post:`;
}

// Alternative: Use Anthropic Claude
export async function generatePostWithClaude(options: GeneratePostOptions): Promise<string> {
  // Implement if you prefer Anthropic
  // npm install @anthropic-ai/sdk
  throw new Error('Not implemented - use OpenAI or implement Anthropic');
}