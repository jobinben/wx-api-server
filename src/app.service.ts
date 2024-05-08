import { Injectable } from '@nestjs/common';
const crypto = require('crypto');

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  
  checkSignature(signature: string, timestamp: string, nonce: string): boolean {
    const token = 'testapiToken'; // Assuming TOKEN is stored in environment variables
    const tmpArr = [token, timestamp, nonce];
    tmpArr.sort();
    const tmpStr = tmpArr.join('');
    const hashedStr = this.sha1(tmpStr);

    return hashedStr === signature;
  }

  private sha1(input: string): string {
    return crypto.createHash('sha1').update(input, 'utf8').digest('hex');
  }

  convertToSuperSubScript(name: string, number: string, position: string = 'sub') {
    const subscripts = {
      0: "₀",
      1: "₁",
      2: "₂",
      3: "₃",
      4: "₄",
      5: "₅",
      6: "₆",
      7: "₇",
      8: "₈",
      9: "₉",
    };
  
    const superscripts = {
      0: "⁰",
      1: "¹",
      2: "²",
      3: "³",
      4: "⁴",
      5: "⁵",
      6: "⁶",
      7: "⁷",
      8: "⁸",
      9: "⁹",
    };
  
    let formattedNumber = '';
    if (position == "super") {
      formattedNumber = number.toString().split("").map((digit) => superscripts[digit]).join("");
    } else {
      formattedNumber = number.toString().split("").map((digit) => subscripts[digit]).join("");
    }
  
    return `${name}℡${formattedNumber}`;
  }

  extractNameAndNumber(text: string): string{
    const pattern = /([\u4e00-\u9fa5]+)(\d+)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      return this.convertToSuperSubScript(match[1], match[2]);
    }
    return '输入内容不符合';
  }


}
