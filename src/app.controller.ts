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
    const receiveMsg = xmlData?.content[0];
    if (receiveMsg) {
      if (receiveMsg.length > 30) {
        replyTxt = '你发送的内容太长啦';
      } else {
        replyTxt= this.appService.extractNameAndNumber(receiveMsg);
      }
    } 

    // 构建要响应的 XML 数据
    const responseXml = `<xml><ToUserName><![CDATA[${xmlData.fromusername[0]}]]></ToUserName><FromUserName><![CDATA[${xmlData.tousername[0]}]]></FromUserName><CreateTime>${Date.now()}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[${replyTxt}]]></Content></xml>`;

    res.set('Content-Type', 'application/xml');
    res.send(responseXml);
  }
}
