import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";



@Module({
   imports: [
    // Configura el JWT aquí
    JwtModule.register({
      global: true, // Esto permite usarlo en otros módulos si fuera necesario
      secret: process.env.SECRET, // Usa una variable de entorno en producción
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})


export class AuthModule{};