import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  register(@Body() data: RegisterUserDto) {
    return this.authService.register(data);
  }

  @Post('login')
  async login(@Body() data: RegisterUserDto, @Res({ passthrough: true }) response: Response) {
    const  access_token  = await this.authService.login(data);
    
    response.cookie('access_token', access_token, {
      httpOnly: true,    // Protege contra XSS
      secure: true,      // Solo envía por HTTPS (en prod)
      sameSite: 'strict',// Protege contra CSRF
      maxAge: 3600000,   // Tiempo de vida (ej. 1 hora)
    })
    return { status: 200, message: 'Login Exitoso' }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/', // Asegúrate de que el path coincida con el que usaste al crearla
  });
    return { message: 'Sesión cerrada' };
  }
}
