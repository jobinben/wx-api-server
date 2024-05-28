import {
  Controller,
  Get,
  Req,
  Res,
  Post,
  Body,
  HttpCode,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('wxMsg')
  async getWxMsg(@Req() request: Request): Promise<any> {
    console.log('query: ', request.query);
    const query = request.query || ({} as any);

    const signature = query.signature || '';
    const timestamp = query.timestamp || '';
    const nonce = query.nonce || '';
    const isPassed = await this.appService.checkSignature(
      signature,
      timestamp,
      nonce,
    );

    console.log('isPassed: ', isPassed, 'echostr: ', query.echostr);

    if (isPassed && query.echostr) {
      return query.echostr;
    }

    return 'unknow';
  }

  @HttpCode(200)
  @Post('wxMsg')
  handleWxMsg(@Body() data, @Res() res) {
    const xmlData = data.xml; // 获取已经解析后的 XML 数据
    console.log('xmlData: ', xmlData);

    let replyTxt = '你好,回复消息中';
    const msgType = xmlData?.msgtype?.[0]; // 小心类型
    switch (msgType) {
      case 'text': {
        const receiveMsg = xmlData?.content?.[0];
        if (receiveMsg) {
          // 进群，发送二维码图片
          if (receiveMsg.length && receiveMsg.includes('gpt')) {
            const mediaId = 'xVfG8PVKKjvzzGiZ1dO0RMnEW3N8G69YKRpgnlzU39ZPN-s9ssF_3n8S6LxSkvvi'; // 图片id
            // 构建要响应的 XML 数据
            const responseXml = `<xml><ToUserName><![CDATA[${xmlData.fromusername[0]}]]></ToUserName><FromUserName><![CDATA[${xmlData.tousername[0]}]]></FromUserName><CreateTime>${Date.now()}</CreateTime><MsgType><![CDATA[image]]></MsgType><Image><MediaId><![CDATA[${mediaId}]]></MediaId></Image></xml>`;
            res.set('Content-Type', 'application/xml');
            res.send(responseXml);
            return;
          }

          // 其他消息处理
          if (receiveMsg.length > 30) {
            replyTxt = '你发送的内容太长啦';
          } else {
            replyTxt= this.appService.extractNameAndNumber(receiveMsg);
          }
        } 
        break;
      }
      case 'event': {
        const eventType = xmlData?.event?.[0];
        if (eventType === 'subscribe') {
          replyTxt = '感谢关注～ 如需加入GPT交流群，请回复：gpt';
        }
        break;
      }
      default: {
        replyTxt = '抱歉～ 我暂时无法处理该信息，请稍后再试。';
        break;
      }
    }
    

    // 构建要响应的 XML 数据
    const responseXml = `<xml><ToUserName><![CDATA[${xmlData.fromusername[0]}]]></ToUserName><FromUserName><![CDATA[${xmlData.tousername[0]}]]></FromUserName><CreateTime>${Date.now()}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[${replyTxt}]]></Content></xml>`;

    res.set('Content-Type', 'application/xml');
    res.send(responseXml);
  }
}
