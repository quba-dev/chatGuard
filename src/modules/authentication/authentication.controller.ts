import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('api/auth')
@ApiTags('api/auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
      },
    },
  })
  async login(@Request() req) {
    return this.authenticationService.login(req.user);
  }
}
