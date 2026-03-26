import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProductsModule } from './products/products.module';
import { ProjectsModule } from './projects/projects.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtStrategy } from './auth/jwt.strategy.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Esto hace que el .env esté disponible en todo el proyecto
    }),
    ProductsModule,
    ProjectsModule,
    AuthModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE', // <--- Este nombre debe coincidir exactamente
        transport: Transport.TCP, // o el que uses (REDIS, NATS, etc.)
        options: { host: 'localhost', port: 3001 },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule { }
