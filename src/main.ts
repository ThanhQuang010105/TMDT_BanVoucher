import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt tính năng kiểm duyệt tự động dựa trên DTO
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Tự động loại bỏ các trường thừa không được định nghĩa trong DTO
    transform: true, // Tự động chuyển đổi kiểu dữ liệu của request phù hợp với kiểu khai báo trong DTO
  }));

  app.enableCors(); // Mở khóa CORS kết nối với Frontend
  await app.listen(3001); // Server chạy ở cổng 3001
}
bootstrap();
