import { Dispatcher, Moment, Colors, ContextMenu } from '@webpack/common';
import { findInReactTree, getOwnerInstance, uuid } from '@utilities';
import { Menu, Tooltip } from '@components/discord';
import { ActionTypes } from '../modules/constants';
import Storage from '../modules/storage';
import { bulk, filters } from '@webpack';
import { Patch } from '../structures';
import React from 'react';

import Style from '../styles/messages.css';

const [
   Message,
   Classes
] = bulk(
   m => m.type && !!~m.type.toString().indexOf('useContextMenu'),
   filters.byProps('ephemeral', 'message')
);

export default class extends Patch {
   constructor(
      public main: any
   ) {
      super('Messages');
   }

   apply(): void {
      Style.append();

      const { settings } = this.main;
      this.patcher.after(Message, 'type', (_, [props]: [any], res) => {
         const { message } = props;
         const forceUpdate = React.useReducer((x) => x + 1, 0)[1];

         React.useEffect(() => {
            function handler({ id }) {
               if (!id || message.id === id) {
                  forceUpdate();
               }
            }

            Dispatcher.subscribe(ActionTypes.ML_UPDATE_MESSAGE, handler);
            return () => Dispatcher.unsubscribe(ActionTypes.ML_UPDATE_MESSAGE, handler);
         }, []);

         if (message?.channel_id) {
            const deleted = Storage.getDeleted(message.channel_id, message.id);
            if (!deleted) return;

            const content = findInReactTree(res, r => r.className && !!~r.className.indexOf(Classes.message));
            if (!content) return;


            if (!props.messageLogger) {
               const useMinimal = settings.get('useMinimalStyle', false);
               const colour = settings.get('deletedColour', 16730955);

               const tint = Colors.int2rgba(colour, 1);
               content.style = Object.assign(content.style ?? {}, {
                  '--deleted-colour': tint.match(/\d+/g).slice(0, -1).join(', ')
               });

               content.className += ' ml-deleted';
               if (!useMinimal) {
                  content.className += ' ml-deleted ' + Classes.ephemeral;
               }
            }

            const msgProps = findInReactTree(res, r => r.childrenMessageContent);
            if (!msgProps) return;

            delete msgProps.childrenButtons;

            msgProps.onContextMenu = (e) => {
               ContextMenu.openContextMenu(e, () => <Menu.default onClose={ContextMenu.closeContextMenu}>
                  <Menu.MenuItem
                     id='ml-remove-message'
                     label='Remove from logs'
                     color='colorDanger'
                     action={() => {
                        Storage.remove('*', message);

                        Dispatcher.dispatch({
                           type: 'MESSAGE_DELETE',
                           channelId: message.channel_id,
                           id: message.id,
                           ml: true
                        });
                     }}
                  />
               </Menu.default>);
            };

            return <Tooltip text={Moment(deleted.time).format('llll')}>
               {res}
            </Tooltip>;
         }
      });

      this.forceUpdateChat();
   }

   remove(): void {
      Style.remove();
      this.patcher.unpatchAll();

      this.forceUpdateChat();
   };

   forceUpdateChat() {
      const element = document.querySelector('div[class^="chat"] > div[class^="content"]');
      if (!element) return;

      const instance: any = getOwnerInstance(element);
      if (!instance) return;

      const unpatch = this.patcher.after(instance, 'render', (self, __, res) => {
         unpatch();

         res.key = uuid();
         res.ref = () => self.forceUpdate();
      });

      instance.forceUpdate();
   }
}