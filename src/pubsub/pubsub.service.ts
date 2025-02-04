import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

@Injectable()
export class PubSubService extends PubSub {
    constructor() { super(); }

    publishEvent(trigger: string, payload: any) {
        this.publish(trigger, payload)
    }

    getAsyncIterator(trigger: string) {
        return this.getAsyncIterator(trigger);
    }
}
