// PATH: backend/src/services/bedrockService.js
/**
 * Amazon Bedrock Service - Claude 3.5 Sonnet Integration
 * Provides AI capabilities using AWS Bedrock Runtime API
 */

import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock client (credentials from Lambda execution role or local AWS config)
const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1"
});

// Use cross-region inference profile instead of direct model ID
// This allows on-demand throughput access to Claude 3.5 Sonnet
const MODEL_ID = process.env.ANTHROPIC_MODEL_ID || "us.anthropic.claude-3-5-sonnet-20241022-v2:0";

/**
 * Call Claude via Bedrock with OpenAI-compatible interface
 * @param {Array} messages - Array of {role, content} messages
 * @param {Object} options - Optional parameters (temperature, max_tokens)
 * @returns {Promise<Object>} Response in OpenAI format
 */
export async function invokeClaude(messages, options = {}) {
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

        console.log(`🔷 [Bedrock] Invoking Claude 3.5 Sonnet (${claudeMessages.length} messages)...`);

        // DEBUG: Log prompt content to verify Tiingo data
        const lastUserMsg = claudeMessages[claudeMessages.length - 1];
        if (lastUserMsg && lastUserMsg.content) {
            const hasFinancialContext = lastUserMsg.content.includes('<financial_context>');
            console.log("📊 [Bedrock] Financial Data Check:");
            console.log(`   - Has <financial_context>: ${hasFinancialContext ? '✅ YES' : '❌ NO'}`);
            if (hasFinancialContext) {
                const match = lastUserMsg.content.match(/<net_income>(.*?)<\/net_income>/);
                console.log(`   - Sample Data (Net Income): ${match ? match[1] : 'Not found'}`);
            } else {
                console.log("   - WARNING: Financial context missing in prompt!");
            }
        }

        const command = new InvokeModelCommand({
            modelId: MODEL_ID,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(requestBody)
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        // Convert Claude response to OpenAI format
        const content = responseBody.content?.[0]?.text || "";

        console.log(`✅ [Bedrock] Response received (${content.length} chars)`);

        return {
            choices: [
                {
                    message: {
                        role: "assistant",
                        content: content
                    },
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
        console.error("❌ [Bedrock] Error:", error.message);

        // Re-throw with additional context
        const bedrockError = new Error(`Bedrock API Error: ${error.message}`);
        bedrockError.status = error.$metadata?.httpStatusCode || 500;
        bedrockError.code = error.name;
        bedrockError.originalError = error;

        throw bedrockError;
    }
}

/**
 * Stream Claude response via Bedrock (async generator)
 * @param {Array} messages - Array of {role, content} messages
 * @param {Object} options - Optional parameters (temperature, max_tokens)
 * @yields {string} Text chunks as they arrive
 */
export async function* invokeClaudeStream(messages, options = {}) {
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

        console.log(`🔷 [Bedrock Stream] Invoking Claude 3.5 Sonnet (${claudeMessages.length} messages)...`);

        const command = new InvokeModelWithResponseStreamCommand({
            modelId: MODEL_ID,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(requestBody)
        });

        const response = await bedrockClient.send(command);

        // Process streaming response
        for await (const event of response.body) {
            if (event.chunk) {
                const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

                // Claude streaming format
                if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
                    yield chunk.delta.text;
                }
            }
        }

        console.log(`✅ [Bedrock Stream] Stream completed`);

    } catch (error) {
        console.error("❌ [Bedrock Stream] Error:", error.message);
        throw new Error(`Bedrock Stream Error: ${error.message}`);
    }
}

/**
 * Create chat completion (OpenAI-compatible wrapper)
 * @param {Object} params - Parameters matching OpenAI chat.completions.create()
 * @returns {Promise<Object>} Response in OpenAI format
 */
export async function createChatCompletion(params) {
    const { messages, temperature, max_tokens, model, stream = false } = params;

    // If streaming requested, return async generator
    if (stream) {
        return invokeClaudeStream(messages, {
            temperature,
            max_tokens,
            model
        });
    }

    // Otherwise, use regular invocation
    return await invokeClaude(messages, {
        temperature,
        max_tokens,
        model
    });
}

export default {
    invokeClaude,
    invokeClaudeStream,
    createChatCompletion
};
