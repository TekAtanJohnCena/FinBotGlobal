// Streaming helper function
async function sendMessageWithStreaming(message, chatId, setMessages, setActiveChatId, fetchHistory, scrollToBottom, botMessageIndex) {
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/chat/stream`, {
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
                    try {
                        const data = JSON.parse(line.slice(6));

                        if (data.type === 'financialData') {
                            financialDataReceived = data.data;
                        } else if (data.type === 'text') {
                            fullText += data.content;
                            setMessages((prev) => {
                                const newMessages = [...prev];
                                newMessages[botMessageIndex] = {
                                    sender: "bot",
                                    text: fullText,
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
                            throw new Error(data.error);
                        }
                    } catch (parseError) {
                        console.error('Parse error:', parseError);
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
