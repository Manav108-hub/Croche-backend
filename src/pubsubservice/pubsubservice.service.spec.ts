import { Test, TestingModule } from '@nestjs/testing';
import { PubsubserviceService } from './pubsubservice.service';

describe('PubsubserviceService', () => {
  let service: PubsubserviceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PubsubserviceService],
    }).compile();

    service = module.get<PubsubserviceService>(PubsubserviceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
