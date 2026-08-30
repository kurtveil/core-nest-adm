import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { ConfigModule, ConfigService } from "@nestjs/config";



@Module({
   imports: [
    // Configura el JWT aquí
    ConfigModule,
    JwtModule.registerAsync({
      global: true, // Esto permite usarlo en otros módulos si fuera necesario
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})


export class AuthModule{};
