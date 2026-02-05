/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: "finbot-global",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws"
        };
    },
    async run() {
        // Simple test - just backend Lambda
        const api = new sst.aws.Function("FinBotApi", {
            handler: "backend/lambda.handler",
            runtime: "nodejs20.x",
            timeout: "30 seconds",
            memory: "512 MB",
            url: true,
            environment: {
                NODE_ENV: "production",
                MONGO_URI: new sst.Secret("MONGO_URI").value,
                JWT_SECRET: new sst.Secret("JWT_SECRET").value,
                TIINGO_API_KEY: new sst.Secret("TIINGO_API_KEY").value,
                OPENAI_API_KEY: new sst.Secret("OPENAI_API_KEY").value,
                GEMINI_API_KEY: new sst.Secret("GEMINI_API_KEY").value,
                GOOGLE_CLIENT_ID: new sst.Secret("GOOGLE_CLIENT_ID").value,
                FINANCIAL_DATASETS_API_KEY: new sst.Secret("FINANCIAL_DATASETS_API_KEY").value,
                POLYGON_API_KEY: new sst.Secret("POLYGON_API_KEY").value,
                SMTP_HOST: new sst.Secret("SMTP_HOST").value,
                SMTP_PORT: new sst.Secret("SMTP_PORT").value,
                SMTP_EMAIL: new sst.Secret("SMTP_EMAIL").value,
                SMTP_PASSWORD: new sst.Secret("SMTP_PASSWORD").value,
                AWS_BEDROCK_REGION: "us-east-1",
                AWS_BEDROCK_MODEL_ID: "anthropic.claude-3-5-sonnet-20241022-v2:0",
                CLIENT_URL: ""
            },
            link: [],
            permissions: [
                {
                    actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
                    resources: ["arn:aws:bedrock:*::foundation-model/anthropic.claude-*"]
                }
            ]
        });

        return {
            api: api.url
        };
    }
});
