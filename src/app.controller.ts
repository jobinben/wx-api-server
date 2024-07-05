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
        if (receiveMsg && receiveMsg.length) {
          // 进群，发送二维码图片
          if (receiveMsg.includes('gpt')) {
            const mediaId =
              'xVfG8PVKKjvzzGiZ1dO0RMnEW3N8G69YKRpgnlzU39ZPN-s9ssF_3n8S6LxSkvvi'; // 图片id
            // 构建要响应的 XML 数据
            const responseXml = `<xml><ToUserName><![CDATA[${xmlData.fromusername[0]}]]></ToUserName><FromUserName><![CDATA[${xmlData.tousername[0]}]]></FromUserName><CreateTime>${Date.now()}</CreateTime><MsgType><![CDATA[image]]></MsgType><Image><MediaId><![CDATA[${mediaId}]]></MediaId></Image></xml>`;
            res.set('Content-Type', 'application/xml');
            res.send(responseXml);
            return;
          } else if (receiveMsg.includes('查体脂')) {
            replyTxt = this.appService.getBodyFatRate(receiveMsg);
          } else if (receiveMsg.includes('名称生成')) {
            replyTxt = this.appService.extractNameAndNumber(receiveMsg);
          } else {
            replyTxt = `请问要什么服务呢？\n 1. 查体脂 身高180 体重70kg 年龄25 性别男 \n 2. 名称生成 周星星00000 \n 3. 输入gpt即可获得博主联系方式和加入交流群`;
          }
        }
        break;
      }
      case 'event': {
        const eventType = xmlData?.event?.[0];
        if (eventType === 'subscribe') {
          replyTxt =
            '感谢关注～ \n 1. 如需加入GPT交流群，请回复：gpt \n 2. 给微信昵称加上上标电话号码，回复如：名称生成 周星星10086 \n 3. 给自己查体脂，回复如：查体脂 身高180 体重70kg 年龄25 性别男';
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
