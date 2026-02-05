# SST Secret Setup Commands

# Copy and paste these commands one by one into your terminal
# Make sure you're in the project root directory: FinBotGlobal/FinBotGlobal

# Core Secrets
npx sst secret set MONGO_URI "mongodb+srv://finbot:LuU23uZak9uAPiyU@cluster0.zdjpryt.mongodb.net/finbot?appName=Cluster0"
npx sst secret set JWT_SECRET "finbot_cok_gizli_guvenlik_anahtari_2024"

# API Keys
npx sst secret set TIINGO_API_KEY "8d7674649237b42f01f6024a01e874fa3b2e9bfb"
npx sst secret set OPENAI_API_KEY "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"
npx sst secret set GEMINI_API_KEY "AIzaSyBDoqpMHAlk8aVTi0R1p9TVm3UOgFt_9lo"
npx sst secret set FINANCIAL_DATASETS_API_KEY "b1bf3b67-13bf-4c37-92f6-00d900bfb246"
npx sst secret set POLYGON_API_KEY "5dhtJnVPIwEVhD0wy0Sjk_epIxnT5h2F"
npx sst secret set GOOGLE_CLIENT_ID "31375613755-tu8dkeo411m0kltv4sa2bc6jbjd7cbep.apps.googleusercontent.com"

# SMTP Configuration
npx sst secret set SMTP_HOST "smtp.turkticaret.net"
npx sst secret set SMTP_PORT "587"
npx sst secret set SMTP_EMAIL "destek@finbot.com.tr"
npx sst secret set SMTP_PASSWORD "Efsun*2005"

# After setting all secrets, verify with:
# npx sst secret list
