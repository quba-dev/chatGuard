import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../configuration/configuration.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthenticationService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: AppConfig,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      await this.usersService.updateLastSeen(user.id);
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      id: user.id,
      roles: user.roles,
      organizationId: user.organization ? user.organization.id : 0,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
