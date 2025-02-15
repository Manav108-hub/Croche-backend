import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;
  private fromEmail: string;
  private readonly logger = new Logger(ResendService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.error('RESEND_API_KEY is not configured');
      throw new Error('RESEND_API_KEY must be configured');
    }

    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL');
    if (!this.fromEmail) {
      this.logger.error('EMAIL_FROM is not configured');
      throw new Error('EMAIL_FROM must be configured');
    }

    this.resend = new Resend(apiKey);
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
      this.logger.log(`Sending order confirmation email for order ${orderDetails.orderId} to ${to}`);
      
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Order Confirmation #${orderDetails.orderId}`,
        html: this.generateOrderEmailHtml(orderDetails),
      });

      if (error) {
        this.logger.error(`Failed to send confirmation email: ${error.message}`);
        throw error;
      }

      this.logger.log(`Successfully sent order confirmation email for order ${orderDetails.orderId}`);
      return data;
    } catch (error) {
      this.logger.error(
        `Error sending confirmation email for order ${orderDetails.orderId}: ${error.message}`,
        error.stack
      );
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
      this.logger.log(`Sending status update email for order ${data.orderId} to ${to}`);
      
      const { data: responseData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Order ${data.orderId} Update: ${data.newStatus}`,
        html: this.generateStatusEmailHtml(data),
      });

      if (error) {
        this.logger.error(`Failed to send status update email: ${error.message}`);
        throw error;
      }

      this.logger.log(`Successfully sent status update email for order ${data.orderId}`);
      return responseData;
    } catch (error) {
      this.logger.error(
        `Error sending status update email for order ${data.orderId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Sends a confirmation email to the admin including extra details such as
   * the customer's name and address.
   */
  async sendOrderConfirmationAdminEmail(
    to: string,
    orderDetails: {
      orderId: string;
      customerName: string;
      customerAddress: string;
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
      this.logger.log(`Sending admin order confirmation email for order ${orderDetails.orderId} to ${to}`);
      
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `New Order Received #${orderDetails.orderId} from ${orderDetails.customerName}`,
        html: this.generateAdminOrderEmailHtml(orderDetails),
      });

      if (error) {
        this.logger.error(`Failed to send admin confirmation email: ${error.message}`);
        throw error;
      }

      this.logger.log(`Successfully sent admin order confirmation email for order ${orderDetails.orderId}`);
      return data;
    } catch (error) {
      this.logger.error(
        `Error sending admin confirmation email for order ${orderDetails.orderId}: ${error.message}`,
        error.stack
      );
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
            </li>
          `).join('')}
        </ul>
        
        <div style="margin-top: 24px; text-align: right;">
          <h3 style="color: #1a365d;">
            Total Amount: $${orderDetails.totalAmount.toFixed(2)}
          </h3>
        </div>
        
        <p style="margin-top: 32px; color: #718096; line-height: 1.5;">
          We'll notify you once your order ships. For any questions, please reply to this email.
        </p>
      </div>
    `;
  }

  /**
   * Generates an HTML email for the admin that includes extra details about the customer.
   */
  private generateAdminOrderEmailHtml(orderDetails: {
    orderId: string;
    customerName: string;
    customerAddress: string;
    products: Array<{
      name: string;
      quantity: number;
      price: number;
      size: string;
    }>;
    totalAmount: number;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h1 style="color: #1a365d;">New Order Received</h1>
        <p style="font-size: 16px;">Order ID: #${orderDetails.orderId}</p>
        
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #1a365d; margin-top: 0;">Customer Details</h2>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${orderDetails.customerName}</p>
          <p style="margin: 4px 0;"><strong>Address:</strong> ${orderDetails.customerAddress}</p>
        </div>
        
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
            </li>
          `).join('')}
        </ul>
        
        <div style="margin-top: 24px; text-align: right;">
          <h3 style="color: #1a365d;">
            Total Amount: $${orderDetails.totalAmount.toFixed(2)}
          </h3>
        </div>
      </div>
    `;
  }

  private generateStatusEmailHtml(data: {
    orderId: string;
    newStatus: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
  }): string {
    const statusMessages = {
      shipped: 'Your order is on its way!',
      delivered: 'Your order has been delivered!',
      processing: 'Your order is being processed.',
      cancelled: 'Your order has been cancelled.',
    };

    const statusMessage = statusMessages[data.newStatus.toLowerCase()] ||
      `Your order status has been updated to: ${data.newStatus}`;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d;">Order Status Update</h1>
        <p style="font-size: 16px;">Order ID: #${data.orderId}</p>
        
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1a365d; margin-top: 0;">${statusMessage}</h2>
          <p style="margin-bottom: 0;">Current Status: <strong>${data.newStatus}</strong></p>
          ${data.trackingNumber ? `
            <p style="margin-top: 16px;">
              Tracking Number: <strong>${data.trackingNumber}</strong>
            </p>
          ` : ''}
          ${data.estimatedDelivery ? `
            <p style="margin-top: 16px;">
              Estimated Delivery: <strong>${data.estimatedDelivery}</strong>
            </p>
          ` : ''}
        </div>
        
        <p style="margin-top: 32px; color: #718096; line-height: 1.5;">
          If you have any questions about your order, please don't hesitate to reach out.
        </p>
      </div>
    `;
  }
}
