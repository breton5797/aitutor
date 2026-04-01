import { Controller, Get, Post, Body, UseGuards, Request, Headers, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import { SubscribeDto } from './dto/billing.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  getStatus(@Request() req: any) {
    return this.billingService.getStatus(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('subscribe')
  subscribe(@Request() req: any, @Body() dto: SubscribeDto) {
    return this.billingService.subscribe(req.user.id, dto.planType);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cancel')
  cancel(@Request() req: any) {
    return this.billingService.cancel(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('checkout/session')
  createCheckoutSession(@Request() req: any, @Body() dto: SubscribeDto) {
    return this.billingService.createStripeCheckoutSession(req.user.id, dto.planType);
  }

  // --- Stripe Webhook ---
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any
  ) {
    // Note: requires app.useBodyParser('json', { rawBody: true }) in main.ts
    // For MVP, if req.rawBody isn't available, we fallback to req.body buffer interpretation.
    const payload = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.billingService.handleStripeWebhook(signature, payload as Buffer);
  }
}

