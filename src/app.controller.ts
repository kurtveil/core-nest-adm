import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(@Inject('AUTH_SERVICE') private client: ClientProxy) { }

 

  @Post('register')
  register(@Body() createUserDto: any) {
    return this.client.send({ cmd: 'register' }, createUserDto);
  }

  @Post('login')
  login(@Body() loginDto: any) {
    return this.client.send({ cmd: 'login' }, loginDto);
  }
}
