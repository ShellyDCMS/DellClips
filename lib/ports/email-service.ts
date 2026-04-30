export interface EmailService {
  sendMagicLink(email: string, url: string): Promise<void>;
}