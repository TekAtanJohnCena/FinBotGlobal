// PATH: backend/checkModels.js
// Google Gemini API - Mevcut Modelleri Listele
// Kullanım: node checkModels.js

import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// .env dosyasını yükle
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ HATA: GEMINI_API_KEY environment variable bulunamadı!');
    console.log('💡 .env dosyanızda GEMINI_API_KEY tanımlı olduğundan emin olun.');
    process.exit(1);
}

console.log('🔍 Google Gemini API - Mevcut Modelleri Kontrol Ediliyor...\n');
console.log('🔑 API Key:', GEMINI_API_KEY.substring(0, 10) + '...' + GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 5));
console.log('─'.repeat(80));

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function listAvailableModels() {
    try {
        console.log('\n📋 Erişilebilir Modeller:\n');

        // Google Gemini API'de listModels metodu genellikle doğrudan mevcut değildir
        // Bunun yerine, bilinen model isimleriyle deneme yapacağız

        const commonModels = [
            'gemini-pro',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.0-pro',
            'models/gemini-pro',
            'models/gemini-1.5-pro',
            'models/gemini-1.5-flash',
            'models/gemini-1.0-pro'
        ];

        console.log('🧪 Yaygın model isimlerini test ediyorum...\n');

        for (const modelName of commonModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });

                // Basit bir test prompt ile modeli dene
                const result = await model.generateContent('Test');
                const response = await result.response;

                console.log(`✅ ÇALIŞIYOR: ${modelName}`);
            } catch (error) {
                const statusCode = error.message.includes('404') ? '404' :
                    error.message.includes('403') ? '403' :
                        error.message.includes('429') ? '429' : 'Bilinmeyen';
                console.log(`❌ ÇALIŞMIYOR: ${modelName} (Hata: ${statusCode})`);
            }
        }

        console.log('\n' + '─'.repeat(80));
        console.log('\n💡 SONUÇ:');
        console.log('Yukarıda ✅ işareti olan model isimlerini kullanabilirsiniz.');
        console.log('news.js dosyanızda model: "✅ olan isim" şeklinde yazın.\n');

    } catch (error) {
        console.error('\n❌ GENEL HATA:', error.message);
        console.log('\n🔍 Olası Çözümler:');
        console.log('1. API anahtarınızın geçerli olduğundan emin olun');
        console.log('2. Google AI Studio\'dan (https://makersuite.google.com/) yeni key alın');
        console.log('3. API anahtarınızın kota limitini kontrol edin\n');
    }
}

listAvailableModels();
