import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatBotService {
  async fetchChatGPTByName(name: string): Promise<string | null>{
    const url = 'https://api.siliconflow.cn/v1/chat/completions';
    const msgGroup = [
      { role: 'user', content: `${name}这个名字代表什么意思？有什么寓意？` },
    ];

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization:
          'Bearer sk-pwoqzidhqusbkqbldtpolaswbgaffjhgowzhnxubxwwfkulq',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2-7B-Instruct',
        messages: [
          {
            role: 'system',
            content:
              '当询问你是谁，或者你是什么模型，或者由什么训练的这些类似的话题时，你可以回复你是由周星星科长训练的模型，可以叫你小星星等。另外，每次的回答简洁一些，保持回答总结在200字以内。如果回答的字超过200时，做一个总结，让回答简洁保持在200字以内。',
          },
          ...msgGroup,
        ],
        stream: false,
        max_tokens: 256,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1,
      }),
    };

    return fetch(url, options)
      .then((res) => res.json())
      .then((json: any) => json?.choices?.[0].message.content)
      .catch((err) => {
        console.error('error:' + err);
        return null;
      });
  }
}
