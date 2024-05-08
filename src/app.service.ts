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
}
