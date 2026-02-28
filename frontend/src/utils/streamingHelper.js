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

        const flushTextQueue = (force = false) => {
            if (!pendingTextQueue && !force) return;

            if (pendingTextQueue) {
                uiText += pendingTextQueue;
                pendingTextQueue = '';
            }

            setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[botMessageIndex] = {
                    ...newMessages[botMessageIndex],
                    sender: 'bot',
                    text: uiText,
                    isStreaming: true,
                    isThinking: false,
                    typewriter: true
                };
                return newMessages;
            });

            scrollToBottom();
        };

        const ensureFlushTimer = () => {
            if (flushTimer) return;
            flushTimer = setInterval(() => flushTextQueue(false), 40);
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
                    scrollToBottom();
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

            if (financialDataReceived) {
                newMessages.push({
                    sender: 'bot',
                    type: 'analysis',
                    analysis: financialDataReceived,
                    financialData: financialDataReceived
                });
            }

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
