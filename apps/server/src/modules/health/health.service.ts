import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      mongodb: true,
      redis: true,
      timestamp: new Date().toISOString(),
    };
  }
}
