// Streaming helper function
async function sendMessageWithStreaming(message, chatId, setMessages, setActiveChatId, fetchHistory, scrollToBottom, botMessageIndex) {
    try {
        let baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
        if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -4);

        const response = await fetch(`${baseUrl}/api/chat/stream`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                message,
                chatId: chatId || undefined
            })
        });

        if (!response.ok) {
            // Handle 429 Quota Exceeded specifically
            if (response.status === 429) {
                try {
                    const errorData = await response.json();
                    if (errorData.error === 'quota_exceeded') {
                        const plan = errorData.data?.plan || 'FREE';
                        const used = errorData.data?.used || 0;
                        const limit = errorData.data?.limit || 0;
                        const type = errorData.data?.type || 'finbotQueries';
                        const upgradeRequired = errorData.data?.upgradeRequired;

                        let quotaMessage = '';
                        if (type === 'finbotQueries') {
                            if (plan === 'FREE') {
                                quotaMessage = `🚫 Günlük ücretsiz sorgu hakkınız doldu (${used}/${limit}).\n\n💡 Daha fazla analiz için **Plus plana** geçin ve günde 50 sorgu hakkı kazanın!\n\n[🚀 Plus'a Yükselt →](/pricing)`;
                            } else if (plan === 'PLUS') {
                                quotaMessage = `⚡ Bugünkü Plus sorgu hakkınız doldu (${used}/${limit}).\n\nSınırsıza yakın kullanım için **Pro plana** geçin!\n\n[🚀 Pro'ya Yükselt →](/pricing)`;
                            } else {
                                quotaMessage = `☕ Bugünkü sorgu hakkınız doldu (${used}/${limit}).\n\nBiraz mola verin, yarın UTC 00:00'da sıfırlanacak!`;
                            }
                        } else if (type === 'newsAnalysis') {
                            if (plan === 'FREE') {
                                quotaMessage = `🚫 Günlük haber analizi hakkınız doldu (${used}/${limit}).\n\n💡 Daha fazla analiz için **Plus plana** geçin!\n\n[🚀 Plus'a Yükselt →](/pricing)`;
                            } else if (plan === 'PLUS') {
                                quotaMessage = `⚡ Bugünkü haber analizi hakkınız doldu (${used}/${limit}).\n\nPro planda 30 haber analizi hakkınız olur!\n\n[🚀 Pro'ya Yükselt →](/pricing)`;
                            } else {
                                quotaMessage = `☕ Bugünkü haber analizi hakkınız doldu (${used}/${limit}).\n\nYarın sıfırlanacak!`;
                            }
                        }

                        return {
                            success: false,
                            error: 'quota_exceeded',
                            quotaMessage,
                            upgradeRequired,
                            plan,
                            used,
                            limit
                        };
                    }
                } catch (parseErr) {
                    // If JSON parse fails, fall through to generic error
                }
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        let fullText = '';
        let uiText = '';
        let financialDataReceived = null;
        let pendingTextQueue = '';
        let flushTimer = null;
        let flushCount = 0; // Throttle scroll calls

        const flushTextQueue = (force = false) => {
            if (!pendingTextQueue && !force) return;

            if (pendingTextQueue) {
                uiText += pendingTextQueue;
                pendingTextQueue = '';
            }

            flushCount++;

            setMessages((prev) => {
                const newMessages = [...prev];
                if (newMessages[botMessageIndex]) {
                    newMessages[botMessageIndex] = {
                        ...newMessages[botMessageIndex],
                        sender: 'bot',
                        text: uiText,
                        isStreaming: true,
                        isThinking: newMessages[botMessageIndex].isThinking || false,
                        typewriter: true
                    };
                }
                return newMessages;
            });

            // Throttle scrollToBottom: only every 3rd flush to reduce mobile jank
            if (force || flushCount % 3 === 0) {
                scrollToBottom();
            }
        };

        const ensureFlushTimer = () => {
            if (flushTimer) return;
            // 150ms interval reduces React re-renders; prevents mobile scroll freeze
            flushTimer = setInterval(() => flushTextQueue(false), 150);
        };

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;

                const jsonStr = line.slice(6);
                if (!jsonStr.trim()) continue;

                let data;
                try {
                    data = JSON.parse(jsonStr);
                } catch (e) {
                    console.warn('Non-JSON stream line:', jsonStr);
                    continue;
                }

                if (data.type === 'financialData') {
                    financialDataReceived = data.data;
                    continue;
                }

                if (data.type === 'thought') {
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        const currentThought = newMessages[botMessageIndex]?.thought || '';

                        newMessages[botMessageIndex] = {
                            ...newMessages[botMessageIndex],
                            sender: 'bot',
                            thought: currentThought + data.content + '\n',
                            isStreaming: true,
                            isThinking: true,
                            typewriter: true
                        };
                        return newMessages;
                    });
                    
                    // Throttle thought scrolls too
                    flushCount++;
                    if (flushCount % 3 === 0) {
                        scrollToBottom();
                    }
                    continue;
                }

                if (data.type === 'text') {
                    fullText += data.content;
                    pendingTextQueue += data.content;
                    ensureFlushTimer();
                    continue;
                }

                if (data.type === 'done') {
                    if (!chatId && data.chatId) {
                        setActiveChatId(data.chatId);
                        fetchHistory();
                    }
                    continue;
                }

                if (data.error) {
                    console.error('Backend Stream Error:', data.error);
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages[botMessageIndex] = {
                            sender: 'bot',
                            text: `[HATA] ${data.error}`,
                            isStreaming: false,
                            isError: true,
                            typewriter: false
                        };
                        return newMessages;
                    });
                    if (flushTimer) clearInterval(flushTimer);
                    return { success: false, error: data.error };
                }
            }
        }

        if (flushTimer) {
            clearInterval(flushTimer);
        }
        flushTextQueue(true);

        setMessages((prev) => {
            const newMessages = [...prev];

            if (newMessages[botMessageIndex]) {
                newMessages[botMessageIndex] = {
                    ...newMessages[botMessageIndex],
                    sender: 'bot',
                    text: fullText,
                    isStreaming: false,
                    isThinking: false,
                    typewriter: true
                };
            }

            // Frontend artık finansal data bileşenini ayrı bir baloncukta (bubble) render etmediği için
            // bu message objesini ("analysis") pushlamıyoruz. Aksi takdirde 2 tane avatar çıkıyor.

            return newMessages;
        });

        scrollToBottom();
        return { success: true };

    } catch (error) {
        console.error('Streaming error:', error);
        return { success: false, error };
    }
}

export default sendMessageWithStreaming;
