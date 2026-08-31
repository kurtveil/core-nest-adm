import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser = require('cookie-parser');
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Lista de dominios permitidos (Local y Producción)
  const allowedOrigins = [
    'http://localhost:3000',
    ...((process.env.FRONTEND_URL ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)),
  ];
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (como Postman o Server-to-Server) o que estén en la lista
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por políticas de CORS'));
      }
    },
    methods: 'GET, HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Application running on port ${port}`);

}
bootstrap();
