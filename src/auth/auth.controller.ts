import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { RegisterUserDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() data: RegisterUserDto) {
    return this.authService.register(data);
  }

  @Post('login')
  async login(@Body() data: RegisterUserDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(data);
    this.setSessionCookie(response, result.accessToken);
    return { message: 'Login exitoso', user: result.user };
  }

  @Post('google')
  async googleLogin(
    @Body() data: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginWithGoogle(data.credential);
    this.setSessionCookie(response, result.accessToken);
    return { message: 'Login con Google exitoso', user: result.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', this.cookieOptions());
    return { message: 'Sesión cerrada' };
  }

  private setSessionCookie(response: Response, accessToken: string): void {
    response.cookie('access_token', accessToken, {
      ...this.cookieOptions(),
      maxAge: 60 * 60 * 1000,
    });
  }

  private cookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/',
    };
  }
}
