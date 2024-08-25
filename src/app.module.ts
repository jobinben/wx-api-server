import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ChatBotService } from './service/chat-bot.service';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService, ChatBotService],
})
export class AppModule {}
