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

  convertToSuperSubScript(
    name: string,
    number: string,
    position: string = 'sub',
  ) {
    const subscripts = {
      0: '₀',
      1: '₁',
      2: '₂',
      3: '₃',
      4: '₄',
      5: '₅',
      6: '₆',
      7: '₇',
      8: '₈',
      9: '₉',
    };

    const superscripts = {
      0: '⁰',
      1: '¹',
      2: '²',
      3: '³',
      4: '⁴',
      5: '⁵',
      6: '⁶',
      7: '⁷',
      8: '⁸',
      9: '⁹',
    };

    let formattedNumber = '';
    if (position == 'super') {
      formattedNumber = number
        .toString()
        .split('')
        .map((digit) => superscripts[digit])
        .join('');
    } else {
      formattedNumber = number
        .toString()
        .split('')
        .map((digit) => subscripts[digit])
        .join('');
    }

    return `${name}℡${formattedNumber}`;
  }

  extractNameAndNumber(text: string): string {
    const pattern = /([\u4e00-\u9fa5]+)(\d+)/g;
    let match;
    const directRegex = /号码([上下])/;
    const directMatch = text.match(directRegex);
    const position = directMatch ? (directMatch[1] === '上' ? 'super' : 'sub') : 'super';
    while ((match = pattern.exec(text)) !== null) {
      return this.convertToSuperSubScript(match[1], match[2], position);
    }
    return '输入内容不符合';
  }

  // 解析用户查体脂的输入
  parseUserInput(input: string) {
    const heightRegex = /身高(\d+)/;
    const weightRegex = /体重(\d+)/;
    const ageRegex = /年龄(\d+)/;
    const genderRegex = /性别([男女])/;

    const heightMatch = input.match(heightRegex);
    const weightMatch = input.match(weightRegex);
    const ageMatch = input.match(ageRegex);
    const genderMatch = input.match(genderRegex);

    return {
      height: heightMatch ? parseInt(heightMatch[1]) : 0,
      weight: weightMatch ? parseInt(weightMatch[1]) : 0,
      age: ageMatch ? parseInt(ageMatch[1]) : 0,
      gender: genderMatch ? genderMatch[1] : '',
    };
  }

  calculateMetrics({ height, weight, age, gender }): string {
    // 计算BMI
    const heightInMeters = height / 100;
    const bmi = weight / heightInMeters ** 2;

    // 计算体脂率
    let bodyFatRate;
    if (gender === '女') {
      bodyFatRate = 1.2 * bmi + 0.23 * age - 5.4;
    } else {
      bodyFatRate = 1.2 * bmi + 0.23 * age - 16.2;
    }
    bodyFatRate = bodyFatRate.toFixed(2);

    // 正常体脂率范围
    let normalBodyFatRange;
    if (gender === '女') {
      normalBodyFatRange = { min: 17, max: 24 };
    } else {
      normalBodyFatRange = { min: 10, max: 20 };
    }

    // 计算标准体重
    const standardWeight = +((height - 100) * 0.9).toFixed(3);

    // 正常标准体重范围
    const normalWeightRangeMin = (standardWeight * 0.9).toFixed(2);
    const normalWeightRangeMax = (standardWeight * 1.1).toFixed(2);
    const normalWeightRange = `${normalWeightRangeMin}~${normalWeightRangeMax}（kg）`;

    // 健康风险和身材管理建议
    let healthRisk;
    let managementAdvice;
    const bodyFatRateValue = parseFloat(bodyFatRate);

    if (bodyFatRateValue < normalBodyFatRange.min) {
      healthRisk = '风险较高';
      managementAdvice = '体脂率过低，建议增加营养摄入，适当进行力量训练。';
    } else if (bodyFatRateValue > normalBodyFatRange.max) {
      healthRisk = '风险较高';
      managementAdvice = '体脂率偏高，建议控制饮食并增加有氧运动。';
    } else {
      healthRisk = '健康';
      managementAdvice = '保持良好的饮食和锻炼习惯。';
    }

    // 如果体重不在正常标准体重范围内，调整建议
    if (weight < normalWeightRangeMin) {
      managementAdvice += ' 你的体重偏低，建议增加营养摄入，适当进行力量训练。';
    } else if (weight > normalWeightRangeMax) {
      managementAdvice += ' 你的体重偏高，建议控制饮食并增加有氧运动。';
    }

    return `当前体脂率: ${bodyFatRate}%\n正常体脂率范围: ${normalBodyFatRange.min}%-${normalBodyFatRange.max}%\n标准体重: ${standardWeight}（kg）\n正常标准体重范围: ${normalWeightRange}\n健康风险: ${healthRisk}\n身材管理建议: ${managementAdvice}`;
  }


  getBodyFatRate(input: string): string {
    const { height, weight, age, gender } = this.parseUserInput(input);
    return this.calculateMetrics({ height, weight, age, gender });
  }

}
