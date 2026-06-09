"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('DA TMDT - Bán Voucher API')
        .setDescription('Tài liệu API cho hệ thống Thương mại Điện tử Bán Voucher (HCMUS)')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .addTag('Auth', 'Đăng ký, Đăng nhập, Quên mật khẩu')
        .addTag('Customers', 'Quản lý hồ sơ khách hàng')
        .addTag('Vouchers', 'Trang chủ, Tìm kiếm, Chi tiết Voucher')
        .addTag('Orders', 'Giỏ hàng, Đặt hàng, Ví Voucher, Đánh giá')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    app.enableCors();
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
    console.log(`📖 Swagger UI tại:       http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map