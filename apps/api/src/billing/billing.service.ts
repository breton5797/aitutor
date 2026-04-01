import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanType, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2025-01-27.acacia' as any,
    });
  }

  async getStatus(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    
    return {
      planType: sub?.planType || 'FREE',
      status: sub?.status || 'EXPIRED',
      endDate: sub?.endDate || null,
    };
  }

  async subscribe(userId: string, planType: PlanType) {
    // In a real app, this would integrate with Stripe/Toss Payments
    
    // Deactivate previous active subscriptions
    await this.prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'CANCELED', endDate: new Date() },
    });

    // Create new subscription for 30 days
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const newSub = await this.prisma.subscription.create({
      data: {
        userId,
        planType,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate,
      },
    });

    return newSub;
  }

  async cancel(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!sub) throw new BadRequestException('활성 상태의 구독이 없습니다.');

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELED', endDate: new Date() },
    });

    return { message: '구독이 해지되었습니다.' };
  }

  // --- Stripe 연동 로직 ---
  
  async createStripeCheckoutSession(userId: string, planType: PlanType) {
    const prices = {
      BASIC: process.env.STRIPE_PRICE_BASIC || 'price_1xxx',
      PREMIUM: process.env.STRIPE_PRICE_PREMIUM || 'price_2xxx',
      PARENT: process.env.STRIPE_PRICE_PARENT || 'price_3xxx',
    };

    const priceId = prices[planType];
    if (!priceId) throw new BadRequestException('잘못된 플랜입니다.');

    // 클라이언트의 호스트 설정 (개발환경 대응)
    const domainURL = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${domainURL}/dashboard?payment=success`,
      cancel_url: `${domainURL}/reports?payment=cancel`,
      metadata: { userId, planType },
    });

    return { sessionId: session.id, url: session.url };
  }

  async handleStripeWebhook(signature: string, payload: Buffer) {
    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType;

      if (userId && planType) {
        // 기존 활성 구독 해지
        await this.prisma.subscription.updateMany({
          where: { userId, status: 'ACTIVE' },
          data: { status: 'CANCELED', endDate: new Date() },
        });

        // 새 활성 구독 부여
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        await this.prisma.subscription.create({
          data: {
            userId,
            planType: planType as PlanType,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate,
            // (옵션) stripeSubscriptionId 같은 결제 ID 저장
          },
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      // 구독 해지 로직
      const subscription = event.data.object as Stripe.Subscription;
      // 추가 로직 구현
    }

    return { received: true };
  }
}

