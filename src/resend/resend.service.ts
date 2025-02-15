import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
    this.fromEmail = this.configService.get('EMAIL_FROM');
  }

  async sendOrderConfirmationEmail(
    to: string,
    orderDetails: {
      orderId: string;
      products: Array<{
        name: string;
        quantity: number;
        price: number;
        size: string;
      }>;
      totalAmount: number;
    }
  ) {
    try {
      const { data } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Order Confirmation #${orderDetails.orderId}`,
        html: this.generateOrderEmailHtml(orderDetails),
      });
      return data;
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      throw error;
    }
  }

  async sendOrderStatusUpdateEmail(
    to: string,
    data: {
      orderId: string;
      newStatus: string;
      trackingNumber?: string;
      estimatedDelivery?: string;
    }
  ) {
    try {
      const subject = `Order ${data.orderId} Update: ${data.newStatus}`;
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html: this.generateStatusEmailHtml(data),
      });
    } catch (error) {
      console.error('Error sending status email:', error);
      throw error;
    }
  }

  private generateOrderEmailHtml(orderDetails: {
    orderId: string;
    products: Array<{
      name: string;
      quantity: number;
      price: number;
      size: string;
    }>;
    totalAmount: number;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d;">Thank you for your order! 🎉</h1>
        <p style="font-size: 16px;">Order ID: #${orderDetails.orderId}</p>
        <h2 style="color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          Order Summary
        </h2>
        <ul style="list-style: none; padding: 0;">
          ${orderDetails.products.map(product => `
            <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <strong>${product.name}</strong><br>
                  <span style="color: #718096;">Size: ${product.size}</span>
                </div>
                <div style="text-align: right;">
                  ${product.quantity} x $${product.price.toFixed(2)}<br>
                  <span style="color: #718096;">$${(product.quantity * product.price).toFixed(2)}</span>
                </div>
              </div>
            </li>`
          ).join('')}
        </ul>
        <div style="margin-top: 24px; text-align: right;">
          <h3 style="color: #1a365d;">
            Total Amount: $${orderDetails.totalAmount.toFixed(2)}
          </h3>
        </div>
        <p style="margin-top: 32px; color: #718096;">
          We'll notify you once your order ships. For any questions, reply to this email.
        </p>
      </div>`;
  }

  private generateStatusEmailHtml(data: {
    orderId: string;
    newStatus: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d;">Order Update #${data.orderId}</h1>
        <p>Status: <strong>${data.newStatus}</strong></p>
        ${data.trackingNumber ? `<p>Tracking Number: ${data.trackingNumber}</p>` : ''}
        ${data.estimatedDelivery ? `<p>Estimated Delivery: ${data.estimatedDelivery}</p>` : ''}
        <p style="margin-top: 20px; color: #718096;">
          Contact us if you have any questions.
        </p>
      </div>`;
  }
}