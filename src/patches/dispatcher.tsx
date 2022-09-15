import { ActionTypes, MessageTypes } from '../modules/constants';
import { Dispatcher } from '@webpack/common';
import { Messages } from '@webpack/stores';
import { Patch } from '../structures';
import * as Toasts from '@api/toasts';
import { Storage } from '../modules';
import React from 'react';

import Message from '../components/partials/Message';
import Style from '../styles/notifications.css';

export default class extends Patch {
   public pending: Record<string, any>[];

   constructor(
      public main: any
   ) {
      super('Dispatcher');

      this.pending = [];
   }

   apply(): void {
      Style.append();

      this.patcher.instead(Dispatcher, 'dispatch', (self, [payload], orig) => {
         const { type, ml } = payload;

         if (type === 'MESSAGE_DELETE' && !ml) {
            this.pending.push(payload);
            this.processMessageDelete(payload);

            return Promise.resolve();
         }

         return orig.apply(self, [payload]);
      });
   }

   remove(): void {
      Style.remove();
      this.patcher.unpatchAll();

      for (const payload of this.pending) {
         // @ts-ignore
         Dispatcher.wait(() => Dispatcher.dispatch(payload));
      }
   };

   processMessageDelete(payload) {
      const { channelId, id } = payload;
      const deleting = this.main.deleting;
      if (deleting?.channelId === channelId && deleting?.id === id) {
         return;
      }

      const msg = Storage.getMessage(channelId, id) ?? Messages.getMessage(channelId, id);
      if (!msg) return;

      Toasts.open({
         title: `Message Deleted (<@${msg.author.id}> in <#${channelId}>)`,
         color: 'var(--info-danger-foreground',
         icon: 'CloseCircle',
         content: () => <Message id='ml-notification-message' message={msg} />
      });

      Dispatcher.wait(() => Dispatcher.dispatch({
         type: ActionTypes.ML_UPDATE_MESSAGE,
         id: msg.id
      }));

      Storage.add(MessageTypes.SAVED, msg);
      Storage.add(MessageTypes.DELETED, msg);
   }
}