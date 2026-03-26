import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {

  constructor(private jwtService: JwtService, private prisma: PrismaService) { }

  async register(data: RegisterUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword, // Asegúrate de tener este campo en tu schema.prisma
          name: data.name || null,
        },
      });
      return user;
      
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Este correo electrónico ya está registrado.'); // Envía un 409
      }
      // 2. Otros errores (Base de datos caída, etc)
      throw new InternalServerErrorException('Error al crear el usuario. Inténtalo más tarde.'); // Envía un 500
    }
  }

  async login(data: RegisterUserDto): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return new UnauthorizedException('Credenciales invalidas');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) return new UnauthorizedException('Password incorrecto');

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
