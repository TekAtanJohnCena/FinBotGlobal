/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST v3 Configuration - FinBotGlobal AWS Infrastructure
 * Pure JavaScript (No TypeScript)
 */

export default $config({
    app(input) {
        return {
            name: "finbot-global",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
            providers: {
                aws: {
                    region: "us-east-1" // Change if you prefer another region
                }
            }
        };
    },
    async run() {
        // ===== BACKEND: Express.js API as Lambda Function =====
        const api = new sst.aws.Function("FinBotApi", {
            handler: "backend/lambda.handler",
            runtime: "nodejs20.x",
            timeout: "30 seconds",
            memory: "512 MB", // Starting with 512MB for cost optimization
            environment: {
                NODE_ENV: "production",
                // MongoDB
                MONGO_URI: new sst.Secret("MONGO_URI").value,
                JWT_SECRET: new sst.Secret("JWT_SECRET").value,

                // API Keys
                TIINGO_API_KEY: new sst.Secret("TIINGO_API_KEY").value,
                OPENAI_API_KEY: new sst.Secret("OPENAI_API_KEY").value,
                GEMINI_API_KEY: new sst.Secret("GEMINI_API_KEY").value,
                FINANCIAL_DATASETS_API_KEY: new sst.Secret("FINANCIAL_DATASETS_API_KEY").value,
                POLYGON_API_KEY: new sst.Secret("POLYGON_API_KEY").value,

                // Google OAuth
                GOOGLE_CLIENT_ID: new sst.Secret("GOOGLE_CLIENT_ID").value,

                // SMTP (Email)
                SMTP_HOST: new sst.Secret("SMTP_HOST").value,
                SMTP_PORT: new sst.Secret("SMTP_PORT").value,
                SMTP_EMAIL: new sst.Secret("SMTP_EMAIL").value,
                SMTP_PASSWORD: new sst.Secret("SMTP_PASSWORD").value,

                // AWS Bedrock Region (for Claude 3.5 Sonnet)
                AWS_BEDROCK_REGION: "us-east-1",
                AWS_BEDROCK_MODEL_ID: "anthropic.claude-3-5-sonnet-20241022-v2:0",

                // Frontend URL (will be set after frontend deployment)
                CLIENT_URL: "" // Placeholder - will update after frontend is deployed
            },
            nodejs: {
                install: ["sharp"] // For image processing if needed
            },
            url: true, // Enable Lambda Function URL
            permissions: [
                {
                    actions: [
                        "bedrock:InvokeModel",
                        "bedrock:InvokeModelWithResponseStream"
                    ],
                    resources: [
                        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
                        "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
                    ]
                }
            ]
        });

        // ===== FRONTEND: React Static Site (S3 + CloudFront) =====
        const frontend = new sst.aws.StaticSite("FinBotFrontend", {
            path: "frontend",
            build: {
                command: "npm run build",
                output: "build"
            },
            environment: {
                // Inject App Runner URL into React build
                REACT_APP_API_URL: "https://kabc8j4wap.us-east-1.awsapprunner.com"
            },
            domain: {
                name: "www.finbot.com.tr",
                redirects: ["finbot.com.tr"]
            }
        });

        // ===== OUTPUTS =====
        return {
            api: api.url,
            frontend: frontend.url
        };
    }
});
