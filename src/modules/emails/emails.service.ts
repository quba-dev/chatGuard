import { Injectable } from '@nestjs/common';
import { AppConfig } from '../configuration/configuration.service';
import { EmailOptions, MailgunService } from '@nextnm/nestjs-mailgun';
import { NotificationTypes } from '../notifications/enums/notification-types.enum';
import { Notification } from '../notifications/entities/notification.entity';
import { Procurement } from '../procurements/entities/procurement.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from '../files/entities/file.entity';
import { join, extname } from 'path';

@Injectable()
export class EmailsService {
  // private mailer: NodeMailgun;

  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    private mailgunService: MailgunService,
    private config: AppConfig,
  ) {}

  async send(
    to: string,
    subject: string,
    message: string,
    buttonText: string = undefined,
    buttonUrl: string = undefined,
    attachment: string = undefined,
  ) {
    const options: EmailOptions = {
      template: 'generic',
      from: this.config.values.mailgun.notificationsSenderAddress,
      to: to,
      subject: subject,
      attachment: attachment,
      'h:X-Mailgun-Variables': JSON.stringify({
        content: message,
        buttonText: buttonText,
        buttonUrl: buttonUrl,
      }),
    };
    return await this.mailgunService.sendEmail(options);
  }

  async sendOTP(to: string, pwd: string) {
    const options: EmailOptions = {
      template: 'generic',
      from: this.config.values.mailgun.otpSenderAddress,
      to: to,
      subject: 'Welcome to cafmdash.com',
      'h:X-Mailgun-Variables': JSON.stringify({
        content: 'Your one time password is:',
        bigContent: pwd,
        buttonText: 'Login',
        buttonUrl: 'https://cafmdash.com/login',
      }),
    };

    return await this.mailgunService.sendEmail(options);
  }

  async sendEmailForNotification(notification: Notification) {
    switch (notification.type) {
      case NotificationTypes.ticketStatusChanged:
        const subject = `Ticket '${notification.metadata.ticketSubject}' status updated`;
        const message = `
         ${notification.metadata.creatorFirstName} ${notification.metadata.creatorLastName}
         updated the status of '${notification.metadata.ticketSubject}' <br/>
          Old: ${notification.metadata.previousStatus} <br/>
          New: ${notification.metadata.status}
        `;
        const url = `${this.config.values.app.url}/projects/${notification.metadata.projectId}/tickets/${notification.metadata.ticketId}`;
        // return this.send(notification.creator.email, subject, message);
        return this.send(
          'alex@tzapu.com',
          subject,
          message,
          'View Ticket',
          url,
        );
        break;
      default:
        console.error('unknown notification type', notification);
    }
  }

  async sendEmailForProcurementProposal(
    procurement: Procurement,
    ccEmails: string[],
  ) {
    const receivers = [];
    for (const chatParticipant of procurement.externalChat.chatParticipants) {
      receivers.push(chatParticipant.user.email);
    }

    const fileRecord = await this.filesRepository.findOne({
      where: {
        uuid: procurement.proposalFile.uuid,
      },
    });
    const base = 'files';

    const filePath = join(
      process.cwd(),
      base,
      String(fileRecord.organizationId),
      fileRecord.fileName,
    );

    const url = `${this.config.values.app.url}/projects/${procurement.projectId}/procurements/${procurement.id}`;

    const options: EmailOptions = {
      template: 'generic',
      from: this.config.values.mailgun.notificationsSenderAddress,
      to: [...receivers, ...ccEmails],
      subject: 'A new procurement proposal was submitted',
      attachment: filePath,
      'h:X-Mailgun-Variables': JSON.stringify({
        content: 'A new procurement proposal was submitted',
        buttonText: 'View Procurement',
        buttonUrl: url,
      }),
    };
    return await this.mailgunService.sendEmail(options);
  }
}
