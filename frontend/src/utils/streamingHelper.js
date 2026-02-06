// Streaming helper function
async function sendMessageWithStreaming(message, chatId, setMessages, setActiveChatId, fetchHistory, scrollToBottom, botMessageIndex) {
    try {
        // Fix for Double API Path Bug
        let baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
        if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -4);

        const response = await fetch(`${baseUrl}/api/chat/stream`, {
            method: 'POST',
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
        let financialDataReceived = null;

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
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
                    } else if (data.type === 'text') {
                        fullText += data.content;
                        // Closure issue fix: create local variable
                        const currentText = fullText;
                        setMessages((prev) => {
                            const newMessages = [...prev];
                            newMessages[botMessageIndex] = {
                                sender: "bot",
                                text: currentText,
                                isStreaming: true
                            };
                            return newMessages;
                        });
                        scrollToBottom();
                    } else if (data.type === 'done') {
                        if (!chatId && data.chatId) {
                            setActiveChatId(data.chatId);
                            fetchHistory();
                        }
                    } else if (data.error) {
                        // Backend explicitly sent an error
                        console.error('Backend Stream Error:', data.error);
                        // Stop stream and show error in UI
                        setMessages((prev) => {
                            const newMessages = [...prev];
                            newMessages[botMessageIndex] = {
                                sender: "bot",
                                text: `⚠️ ${data.error}`,
                                isStreaming: false,
                                isError: true
                            };
                            return newMessages;
                        });
                        return { success: false, error: data.error };
                    }
                }
            }
        }

        // Finalize messages
        setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[botMessageIndex] = {
                sender: "bot",
                text: fullText,
                isStreaming: false
            };

            if (financialDataReceived) {
                newMessages.push({
                    sender: "bot",
                    type: "analysis",
                    analysis: financialDataReceived,
                    financialData: financialDataReceived
                });
            }

            return newMessages;
        });

        scrollToBottom();
        return { success: true };

    } catch (error) {
        console.error("Streaming error:", error);
        return { success: false, error };
    }
}

export default sendMessageWithStreaming;
