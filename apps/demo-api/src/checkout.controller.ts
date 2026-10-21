import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DemoPrismaService } from './prisma.service';

@Controller('checkout')
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(private readonly prisma: DemoPrismaService) {}

  @Post('success')
  async checkoutSuccess(@Body() body: { email?: string; sku?: string; quantity?: number }) {
    const customerEmail = body.email || 'customer@example.com';
    const sku = body.sku || 'PROD-SUCCESS-1';
    const quantity = body.quantity || 1;

    this.logger.log(`Processing successful checkout for ${customerEmail}, SKU: ${sku}`);

    // 1. Prisma database query: find product
    const product = await this.prisma.demoProduct.findUnique({
      where: { sku },
    });

    if (!product) {
      throw new HttpException(`Product with SKU ${sku} not found`, HttpStatus.NOT_FOUND);
    }

    // 2. Simulate payment calculation
    const totalAmount = product.price * quantity;
    await new Promise((resolve) => setTimeout(resolve, 60)); // Simulate payment gateway latency

    // 3. Prisma database write: create order
    const order = await this.prisma.demoOrder.create({
      data: {
        customerEmail,
        productSku: sku,
        quantity,
        totalAmount,
        status: 'COMPLETED',
      },
    });

    // 4. Simulate background notification job
    setTimeout(() => {
      this.logger.log(`[Background Job] Dispatched confirmation email for Order #${order.id}`);
    }, 50);

    return {
      status: 'success',
      orderId: order.id,
      product: product.name,
      totalAmount,
      customerEmail,
      message: 'Order placed successfully and background notification scheduled.',
    };
  }

  @Post('failure')
  async checkoutFailure(@Body() body: { email?: string; sku?: string }) {
    const customerEmail = body.email || 'fail-user@example.com';
    const sku = body.sku || 'PROD-FAIL-OUTOFSTOCK';

    this.logger.warn(`Processing failing checkout attempt for ${customerEmail}, SKU: ${sku}`);

    // 1. Prisma database query
    const product = await this.prisma.demoProduct.findUnique({
      where: { sku },
    });

    if (!product || product.stock <= 0) {
      // Record failed order in database for evidence
      await this.prisma.demoOrder.create({
        data: {
          customerEmail,
          productSku: sku,
          quantity: 1,
          totalAmount: product ? product.price : 0,
          status: 'FAILED',
          failureReason: 'INVENTORY_DEPLETED: Insufficient stock for transaction',
        },
      });

      // Deliberately throw error to capture stack trace and span exception
      const error = new Error(`InventoryDepletionError: Cannot reserve item ${sku}. Available stock is 0 units.`);
      error.name = 'InventoryDepletionError';
      (error as any).code = 'ERR_INVENTORY_DEPLETED';
      (error as any).sku = sku;

      this.logger.error(`Checkout failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          error: error.name,
          message: error.message,
          sku,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.CONFLICT,
      );
    }

    return { status: 'unexpected_success' };
  }

  @Post('slow')
  async checkoutSlow(@Body() body: { email?: string; sku?: string }) {
    const customerEmail = body.email || 'performance-tester@ghosttrace.io';
    const sku = body.sku || 'PROD-SUCCESS-1';

    this.logger.log(`Executing slow database transaction for ${customerEmail}`);

    // Execute raw SQL query with pg_sleep to simulate unindexed / slow database query
    await this.prisma.$queryRawUnsafe(
      `SELECT id, sku, price, pg_sleep(0.12) FROM "DemoProduct" WHERE sku = '${sku}' LIMIT 1`
    );

    const product = await this.prisma.demoProduct.findUnique({
      where: { sku },
    });

    return {
      status: 'completed_slow_query',
      productSku: sku,
      productName: product?.name || 'Demo Product',
      message: 'Simulated 120ms database bottleneck recorded for Slow Query Analyzer verification.',
    };
  }
}
