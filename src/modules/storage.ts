import { createLogger } from '@common/logger';
import { MessageTypes } from './constants';
import * as Settings from '@api/settings';

const Logger = createLogger('Message Logger', 'Storage');

class Storage {
   public store: ReturnType<typeof Settings.makeStore>;
   public static id: string = 'ML_STORAGE';

   constructor() {
      try {
         this.store = Settings.makeStore('message-logger-data');
      } catch {
         Logger.error('[CRITICAL] Failed to initialize data store.');
      }
   }

   getMessage(channelId: string, id: string): any {
      const saved = this.store.get(MessageTypes.SAVED, {});
      if (saved[channelId]?.[id]) {
         return saved[channelId][id];
      }

      const cached = this.store.get(MessageTypes.CACHED, {});
      if (cached[channelId]?.[id]) {
         return cached[channelId][id];
      }
   }

   getDeleted(channelId: string, id: string) {
      const payload = this.store.get(MessageTypes.DELETED, {});

      return payload[channelId]?.[id];
   }

   getSavedMessage(channelId: string, id: string) {
      const payload = this.store.get(MessageTypes.SAVED, {});

      return payload[channelId]?.[id];
   }

   add(type: MessageTypes, msg: any) {
      const payload = this.store.get(type, {});

      if (payload[msg.channel_id]?.[msg.id]) {
         return;
      }

      switch (type) {
         case MessageTypes.CACHED:
         case MessageTypes.SAVED:
            payload[msg.channel_id] ??= {};
            payload[msg.channel_id][msg.id] = msg;
            break;
         default:
            payload[msg.channel_id] ??= {};
            payload[msg.channel_id][msg.id] = {
               time: Date.now(),
            };
            break;
      }

      this.store.set(type, payload);
   }

   remove(type: MessageTypes | '*', msg?: any) {
      if (type === '*') {
         const payload = this.store.settings;

         if (msg) {
            for (const type of Object.values(MessageTypes)) {
               delete (payload[type] ?? {})[msg.channel_id]?.[msg.id];
               this.store.set(type, payload[type]);
            }
         } else {
            for (const type of Object.values(MessageTypes)) {
               this.store.set(type, {});
            }
         }
      } else {
         const payload = this.store.get(type, {});

         if (!payload[msg.channel_id]?.[msg.id]) {
            return;
         }

         delete payload[msg.channel_id][msg.id];
      }
   }
};

export default new Storage();