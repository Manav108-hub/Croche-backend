import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

@Injectable()
export class PubsubserviceService extends PubSub {
    constructor() {
        super(); // Call the constructor of PubSub to initialize it
      }
    
      // You can add custom methods here if needed, like publishing events
      publishEvent(trigger: string, payload: any) {
        this.publish(trigger, payload);
      }
    
      // You can create custom helpers like asyncIterator for triggers
      getAsyncIterator(trigger: string) {
        return this.getAsyncIterator(trigger);
      }
}
