import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kiểm duyệt dữ liệu đầu vào tự động dựa trên DTO
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // ─── CẤU HÌNH SWAGGER UI ─────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('DA TMDT - Bán Voucher API')
    .setDescription('Tài liệu API cho hệ thống Thương mại Điện tử Bán Voucher (HCMUS)')
    .setVersion('1.0')
    // Thêm nút "Authorize" để nhập Bearer Token khi test các API cần đăng nhập
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Auth', 'Đăng ký, Đăng nhập, Quên mật khẩu')
    .addTag('Customers', 'Quản lý hồ sơ khách hàng')
    .addTag('Vouchers', 'Trang chủ, Tìm kiếm, Chi tiết Voucher')
    .addTag('Orders', 'Giỏ hàng, Đặt hàng, Ví Voucher, Đánh giá')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI sẽ chạy tại: http://localhost:3001/api/docs
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Giữ token sau khi reload trang
    },
  });
  // ──────────────────────────────────────────────────────────────────────────

  app.enableCors();
  await app.listen(3001);

  console.log('🚀 Server đang chạy tại: http://localhost:3001');
  console.log('📖 Swagger UI tại:       http://localhost:3001/api/docs');
}
bootstrap();
