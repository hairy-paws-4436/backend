// infrastructure/services/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"Hairy Paws" <${this.configService.get<string>('EMAIL_FROM')}>`,
        to: email,
        subject: 'Welcome to Hairy Paws!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.postimg.cc/FsxmSfq9/logo-hairypaws.png" alt="Hairy Paws Logo" style="max-width: 150px;">
            </div>
            <h1 style="color: #4a4a4a; text-align: center;">Welcome to Hairy Paws!</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              Hello ${name},
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              Thank you for signing up at Hairy Paws! Your account has been successfully created.
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              On our platform, you can find pets to adopt, post pets for adoption, 
              and participate in events hosted by NGOs dedicated to animal care.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.configService.get<string>('FRONTEND_URL')}/login" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Log In</a>
            </div>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              If you have any questions, feel free to contact us.
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #666;">
              Best regards,<br>
              The GuardPets Team
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${email}: ${error.message}`);
    }
  }
}
