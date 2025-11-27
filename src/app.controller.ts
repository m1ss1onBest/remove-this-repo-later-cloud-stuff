import { Controller, Get } from '@nestjs/common';

@Controller('storage')
export class AppController {
  @Get() isOkay(): string {
    return 'It is running, I can tell...';
  }
}
