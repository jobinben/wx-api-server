import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as xmlparser from 'express-xml-bodyparser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // use middleware xml-bodyparser
  app.use(express.urlencoded({extended: true}));
  app.use(xmlparser());
  await app.listen(3000);
}
bootstrap();
