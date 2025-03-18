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
  async handleWxMsg(@Body() data, @Res() res) {
    const xmlData = data.xml; // 获取已经解析后的 XML 数据
    console.log('xmlData: ', xmlData);

    let replyTxt = '你好,回复消息中';
    const msgType = xmlData?.msgtype?.[0]; // 小心类型
    switch (msgType) {
      case 'text': {
        const receiveMsg: string = xmlData?.content?.[0];
        if (receiveMsg && receiveMsg.length) {
          // 进群，发送二维码图片
          if (
            receiveMsg.trim()?.startsWith('加群') ||
            receiveMsg.trim()?.includes('订阅') ||
            receiveMsg.trim()?.includes('降智')
          ) {
            const mediaId =
              'xVfG8PVKKjvzzGiZ1dO0RMnEW3N8G69YKRpgnlzU39ZPN-s9ssF_3n8S6LxSkvvi'; // 图片id
            // 构建要响应的 XML 数据
            const responseXml = `<xml><ToUserName><![CDATA[${xmlData.fromusername[0]}]]></ToUserName><FromUserName><![CDATA[${xmlData.tousername[0]}]]></FromUserName><CreateTime>${Date.now()}</CreateTime><MsgType><![CDATA[image]]></MsgType><Image><MediaId><![CDATA[${mediaId}]]></MediaId></Image></xml>`;
            res.set('Content-Type', 'application/xml');
            res.send(responseXml);
            return;
          } else if (receiveMsg.includes('查体脂')) {
            const isReject =
              !receiveMsg.includes('身高') || !receiveMsg.includes('体重');
            if (isReject) {
              replyTxt =
                '请输入相关信息如：查体脂 身高180 体重65kg 年龄25 性别男';
            } else {
              replyTxt = this.appService.getBodyFatRate(receiveMsg);
            }
          } else if (
            receiveMsg.includes('号码上') ||
            receiveMsg.includes('号码下')
          ) {
            replyTxt = this.appService.extractNameAndNumber(receiveMsg);
          } else if (receiveMsg?.toLocaleLowerCase()?.includes('mbti')) {
            replyTxt = '免费的Mbti测试官网地址：https://chatgpi.cn/mbti/';
          } else if (receiveMsg?.toLocaleLowerCase()?.includes('gpt')) {
            replyTxt =
              'ChatGPT模型使用统计插件地址：https://chromewebstore.google.com/detail/chatgpt-degrade-checker-%E9%99%8D/inidgeckbobnafenlmlgfbeoijiamepm';
          } else if (receiveMsg?.toLocaleLowerCase()?.includes('grok')) {
            replyTxt =
              'Grok3次数查询统计工具：https://chromewebstore.google.com/detail/grok-rate-limits/alfhaokdckjioipagadidpbldgfabgjp';
          } else if (receiveMsg.includes('解锁')) {
            this.appService.addAIPaintingCount(receiveMsg);
            replyTxt = '已经成功增加10次绘画次数';
          } else if (receiveMsg.includes('steam')) {
            replyTxt = 'Steam状态查询：https://steamstat.us/';
          } else if (receiveMsg.trim()?.startsWith('查名字')) {
            replyTxt = await this.appService.GetNameMeaning(receiveMsg);
          } else if (receiveMsg.trim()?.startsWith('$')) {
            replyTxt = await this.appService.getDeepSeekReply(receiveMsg);
          } else {
            replyTxt = `请问要什么服务呢？\n 1. 查体脂 身高180 体重65kg 年龄25 性别男 \n 2. 号码上 周星星18927901285 \n 3. 输入“加群”即可获得【博主联系方式】或【加入交流群】 \n 4. 查Mbti性格测试，回复：mbti \n 5. 查名字解析，回复格式如：查名字 王富贵`;
          }
        }
        break;
      }
      case 'event': {
        const eventType = xmlData?.event?.[0];
        if (eventType === 'subscribe') {
          replyTxt =
            '感谢关注～ \n 1. 如需加入交流群，请回复：加群 \n 2. 给微信昵称加上上标电话号码，回复如：号码上 周星星18927901285 \n 3. 给自己查体脂，回复如：查体脂 身高180 体重65kg 年龄25 性别男\n 4. 查Mbti性格测试，回复：mbti \n 5. 查名字解析，回复格式如：查名字 王富贵、\n 6. 以"$"符号开头，可以使用DeepSeek对话，如："$帮我写一份小红书文案"';
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

  @Post('test')
  async test(@Body() data, @Res() res) {
    const phone = data.phone;
    const result = await this.appService.getYouKuVip(phone, 'test_open_id');
    res.send(result);
  }
}
