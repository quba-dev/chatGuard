import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';

@Controller('api/emails')
@ApiTags('api/emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('/')
  @UseGuards(JwtAuthGuard)
  sendEmail() {
    const m = `
    John Doe updated the status of 'My first ticket' <br/>
    Old: opened <br/> 
    New: closed
    `;
    return this.emailsService.send(
      `alex@tzapu.com`,
      `Ticket 'My first ticket' status updated`,
      m,
    );
  }
}
