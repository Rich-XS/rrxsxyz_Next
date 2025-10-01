class CozeChat {
  constructor(botId, token) {
    this.botId = botId;
    this.token = token;
    this.apiUrl = 'https://api.coze.cn/open_api/v2/chat';
  }

  async sendMessage(message) {
    try {
      console.log('Sending message:', message);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          bot_id: this.botId,
          user: "user123",
          query: message,
          stream: false
        })
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      console.log('API response data:', responseData);

      if (responseData.code !== 0) {
        throw new Error(`API error: ${responseData.msg}`);
      }

      console.log('Raw response messages:', responseData.messages);

      // 过滤出answer类型的消息
      const answerMessage = responseData.messages.find(msg => msg.type === 'answer');
      const followUpMessages = responseData.messages
        .filter(msg => msg.type === 'follow-up')
        .map(msg => msg.content);

      let responseMessage = answerMessage ? answerMessage.content : '抱歉，暂时无法处理您的请求';

      return {
        data: {
          message: responseMessage,
          followUps: followUpMessages
        }
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        data: {
          message: '抱歉，暂时无法处理您的请求'
        }
      };
    }
  }
}

// 初始化聊天实例
const cozeChat = new CozeChat(
  '7463491067267481609',
  'pat_QwGwVJ6DKff8AYVVt4YHCQdNeE5UIlupvnaba7kiS5HTnljaqqNKk3ezisJfpkcl'
);

// 暴露接口给全局
window.CozeChat = {
  sendMessage: cozeChat.sendMessage.bind(cozeChat)
};