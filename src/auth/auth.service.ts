import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { env } from 'process';

interface AuthResult {
  accessToken: string;
  user: { id: number; email: string; name: string; role: string; avatarUrl: string | null };
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.getOrThrow<string>(env.GOOGLE_CLIENT_ID),
    );
  }

  async register(data: RegisterUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      return await this.prisma.user.create({
        data: { email: data.email, password: hashedPassword, name: data.name },
      });
    } catch (error) {
      if (error) throw new ConflictException('Este correo electrónico ya está registrado.');
      throw new InternalServerErrorException('Error al crear el usuario. Inténtalo más tarde.');
    }
  }

  async login(data: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.password) {
      throw new UnauthorizedException('Esta cuenta usa inicio de sesión con Google');
    }
    if (!(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.createSession(user);
  }

  async loginWithGoogle(credential: string): Promise<AuthResult> {
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: this.configService.getOrThrow<string>(env.GOOGLE_CLIENT_ID),
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('La credencial de Google no es válida o expiró');
    }

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Google no pudo verificar este correo electrónico');
    }

    const byGoogleId = await this.prisma.user.findUnique({ where: { googleId: payload.sub } });
    const byEmail = byGoogleId
      ? null
      : await this.prisma.user.findUnique({ where: { email: payload.email } });

    const user = byGoogleId
      ? await this.prisma.user.update({
          where: { id: byGoogleId.id },
          data: { avatarUrl: payload.picture ?? byGoogleId.avatarUrl },
        })
      : byEmail
        ? await this.prisma.user.update({
            where: { id: byEmail.id },
            data: { googleId: payload.sub, avatarUrl: payload.picture ?? byEmail.avatarUrl },
          })
        : await this.prisma.user.create({
            data: {
              email: payload.email,
              name: payload.name ?? payload.email.split('@')[0],
              googleId: payload.sub,
              avatarUrl: payload.picture ?? null,
            },
          });

    return this.createSession(user);
  }

  private async createSession(user: {
    id: number;
    email: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  }): Promise<AuthResult> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
