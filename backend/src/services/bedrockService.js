// PATH: backend/src/services/bedrockService.js
/**
 * Amazon Bedrock Service - Claude 3.5 Sonnet Integration
 * Provides AI capabilities using AWS Bedrock Runtime API
 * Includes Retry Logic & Exponential Backoff for Rate Limits
 */

import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock client (credentials from Lambda execution role or local AWS config)
const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1"
});

// Use cross-region inference profile instead of direct model ID
// This allows on-demand throughput access to Claude 3.5 Sonnet
const MODEL_ID = process.env.ANTHROPIC_MODEL_ID || "us.anthropic.claude-3-5-sonnet-20241022-v2:0";

// Retry Configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Sleep helper for backoff
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Call Claude via Bedrock with OpenAI-compatible interface
 */
export async function invokeClaude(messages, options = {}) {
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
        try {
            const {
                temperature = 0.4,
                max_tokens = 1200,
                system = null
            } = options;

            // Convert OpenAI format to Claude format
            const claudeMessages = messages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role, content: m.content }));

            // Extract system message if exists
            const systemMessage = system || messages.find(m => m.role === 'system')?.content;

            // Prepare Bedrock request payload
            const requestBody = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens,
                temperature,
                messages: claudeMessages
            };

            if (systemMessage) {
                requestBody.system = systemMessage;
            }

            console.log(`🔷 [Bedrock] Invoking Claude 3.5 Sonnet (Attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);

            const command = new InvokeModelCommand({
                modelId: MODEL_ID,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify(requestBody)
            });

            const response = await bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));

            const content = responseBody.content?.[0]?.text || "";
            console.log(`✅ [Bedrock] Response received (${content.length} chars)`);

            return {
                choices: [
                    {
                        message: { role: "assistant", content: content },
                        finish_reason: responseBody.stop_reason
                    }
                ],
                model: MODEL_ID,
                usage: {
                    prompt_tokens: responseBody.usage?.input_tokens || 0,
                    completion_tokens: responseBody.usage?.output_tokens || 0,
                    total_tokens: (responseBody.usage?.input_tokens || 0) + (responseBody.usage?.output_tokens || 0)
                }
            };

        } catch (error) {
            const isThrottling = error.name === 'ThrottlingException' || error.message.includes('Too many requests');

            if (isThrottling && attempt < MAX_RETRIES) {
                const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt); // 1s, 2s, 4s...
                console.warn(`⚠️ [Bedrock] Rate limit hit. Retrying in ${delay}ms...`);
                await sleep(delay);
                attempt++;
                continue;
            }

            console.error("❌ [Bedrock] Error:", error.message);
            throw new Error(`Bedrock API Error: ${error.message}`);
        }
    }
}

/**
 * Stream Claude response via Bedrock (async generator)
 */
export async function* invokeClaudeStream(messages, options = {}) {
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
        try {
            const {
                temperature = 0.4,
                max_tokens = 1200,
                system = null
            } = options;

            const claudeMessages = messages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role, content: m.content }));

            const systemMessage = system || messages.find(m => m.role === 'system')?.content;

            const requestBody = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens,
                temperature,
                messages: claudeMessages
            };

            if (systemMessage) {
                requestBody.system = systemMessage;
            }

            console.log(`🔷 [Bedrock Stream] Invoking Claude 3.5 Sonnet (Attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);

            const command = new InvokeModelWithResponseStreamCommand({
                modelId: MODEL_ID,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify(requestBody)
            });

            const response = await bedrockClient.send(command);

            for await (const event of response.body) {
                if (event.chunk) {
                    const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
                    if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
                        yield chunk.delta.text;
                    }
                }
            }

            console.log(`✅ [Bedrock Stream] Stream completed`);
            return; // Success, exit retry loop

        } catch (error) {
            const isThrottling = error.name === 'ThrottlingException' || error.message.includes('Too many requests');

            if (isThrottling && attempt < MAX_RETRIES) {
                const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
                console.warn(`⚠️ [Bedrock Stream] Rate limit hit. Retrying in ${delay}ms...`);
                await sleep(delay);
                attempt++;
                continue;
            }

            console.error("❌ [Bedrock Stream] Error:", error.message);

            // If failed after retries, yield detailed error message to frontend
            if (attempt === MAX_RETRIES) {
                yield "\n\n**⚠️ Sistem Yoğunluğu:** Şu anda FinBot sunucuları çok yoğun.\nLütfen 10-15 saniye bekleyip tekrar deneyin. 🛑";
                throw new Error(`Bedrock Stream Error: ${error.message}`);
            }

            throw error;
        }
    }
}

/**
 * Create chat completion (OpenAI-compatible wrapper)
 */
export async function createChatCompletion(params) {
    const { messages, temperature, max_tokens, model, stream = false } = params;

    if (stream) {
        return invokeClaudeStream(messages, { temperature, max_tokens, model });
    }

    return await invokeClaude(messages, { temperature, max_tokens, model });
}

export default {
    invokeClaude,
    invokeClaudeStream,
    createChatCompletion
};
