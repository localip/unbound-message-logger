import { Text, FormTitle, Modal, TabBar } from '@components/discord';
import type { Message as MessageJSON } from 'discord-types/general';
import { Locale, Moment } from '@webpack/common';
import { connectComponent } from '@api/settings';
import Storage from '../../modules/storage';
import { Channels, Guilds } from '@webpack/stores';
import Message from '../partials/Message';
import { bulk, filters } from '@webpack';
import { classnames } from '@utilities';
import React from 'react';

const Lodash = window._;

const [
   Classes,
   ChannelItem
] = bulk(
   filters.byProps('tabBar'),
   filters.byDisplayName('ChannelItem')
);

const ChannelStrings = {
   1: Locale.Messages.DIRECT_MESSAGES
};

function Logs(props: any) {
   const { settings } = props;
   const [handler, setHandler] = React.useState({ filter: (msg): boolean => true });
   const [tab, setTab] = React.useState('cached');

   const data = settings.get(tab, {});

   const all = [];
   const payload = Object.entries(data);
   const messages = payload.map(([channel, messages]) => {
      const res = [];

      for (const [id, message] of Object.entries(messages)) {
         if (message.id) {
            res.push(message);
            continue;
         }

         const msg = Storage.getMessage(channel, id);
         if (msg) {
            all.push(msg);

            if (handler.filter(msg)) {
               res.push(msg);
            }
         }
      }

      return res;
   }).flat(Infinity).sort((a: MessageJSON, b: MessageJSON) => Moment(a.timestamp).diff(b.timestamp));

   const state = {
      last: null,
      isStart: null
   };

   const unique = Lodash.uniqBy(all, 'channel_id');
   const filtered = {};

   for (const payload of unique) {
      const channel = Channels.getChannel(payload.channel_id);

      if (channel.guild_id) {
         const guild = Guilds.getGuild(channel.guild_id);

         filtered[guild.id] ??= [];
         filtered[guild.id].push(Object.assign(payload, { guild }));
      } else {
         filtered[channel.type] ??= [];
         filtered[channel.type].push(payload);
      }
   }

   return <Modal.ModalRoot {...props} size={Modal.ModalSize.DYNAMIC} id='ml-logs-modal'>
      <Modal.ModalHeader className='ml-logs-header'>
         <div className='ml-logs-title'>
            <FormTitle className='ml-logs-form-title' tag='h1'>
               {Locale.Messages.ML_NAME}
            </FormTitle>
            <Modal.ModalCloseButton onClick={props.onClose} />
         </div>
         <div className='ml-logs-tab-bar-wrapper'>
            <TabBar
               selectedItem={tab}
               className='ml-logs-tab-bar'
               type={TabBar.Types.TOP}
               onItemSelect={setTab}
            >
               <TabBar.Item id='cached' className={classnames(Classes.tabBarItem, 'ml-logs-modal-tab')}>
                  {Locale.Messages.ML_CACHED}
               </TabBar.Item>
               <TabBar.Item id='deleted' className={classnames(Classes.tabBarItem, 'ml-logs-modal-tab')}>
                  {Locale.Messages.ML_DELETED}
               </TabBar.Item>
               <TabBar.Item id='edited' className={classnames(Classes.tabBarItem, 'ml-logs-modal-tab')}>
                  {Locale.Messages.ML_EDITED}
               </TabBar.Item>
               <TabBar.Item id='saved' className={classnames(Classes.tabBarItem, 'ml-logs-modal-tab')}>
                  {Locale.Messages.ML_SAVED}
               </TabBar.Item>
            </TabBar>
         </div>
      </Modal.ModalHeader>
      <Modal.ModalContent className='ml-logs-modal-wrapper'>
         <div className='ml-logs-modal-sidebar'>
            {(Object.entries(filtered) as any).map(([type, messages]: [number, MessageJSON[]]) => {
               const guild = (messages as any)[0]?.guild;

               return <>
                  <FormTitle className='ml-logs-modal-category' tag='h5'>
                     {guild && <img
                        className='ml-logs-modal-guild'
                        src={guild.getIconURL({ size: 32 }).replace('.webp', '.png')}
                     />}
                     {guild ? guild.name : ChannelStrings[type]}
                  </FormTitle>
                  {messages.map((msg: MessageJSON) => {
                     const channel = Channels.getChannel(msg.channel_id);

                     return <ChannelItem
                        canHaveDot={true}
                        relevant={true}
                        mentionCount={5}
                        channel={channel}
                        guild={channel.guild_id ? Guilds.getGuild(channel.guild_id) : '@me'}
                        onMouseDown={() => setHandler({ filter: msg => msg.channel_id === msg.channel_id })}
                        onMouseUp={() => { }}
                     />;
                  })}
               </>;
            })}
            {/* {Lodash.uniqBy(all, 'channel_id').map((msg: MessageJSON) => {
               const channel = Channels.getChannel(msg.channel_id);

               return <ChannelItem
                  canHaveDot={true}
                  relevant={true}
                  mentionCount={5}
                  channel={channel}
                  guild={channel.guild_id ? Guilds.getGuild(channel.guild_id) : '@me'}
                  onMouseDown={() => setHandler({ filter: msg => msg.channel_id === msg.channel_id })}
                  onMouseUp={() => { }}
               />;
            })} */}
         </div>
         {messages.length ? <ul className='ml-logs-message-list'>
            {messages.map(m => <Message
               groupId={(() => {
                  const last = state.last;

                  if (
                     last?.author?.id === m.author.id &&
                     last?.channel_id === m.channel_id
                  ) {
                     state.isStart = false;

                     return last.groupId;
                  }

                  state.isStart = true;
                  state.last = m;

                  return m.id;
               })()}
               groupStart={state.isStart}
               message={m}
               className='ml-logs-message'
            />)}
         </ul> :
            <div className='ml-logs-modal-not-found'>
               <div className='unbound-manager-empty-state' />
               <Text color={Text.Colors.MUTED}>{Locale.Messages.GIFT_CONFIRMATION_HEADER_FAIL}</Text>
               <Text color={Text.Colors.MUTED}>{Locale.Messages.SEARCH_NO_RESULTS}</Text>
            </div>
         }
      </Modal.ModalContent>
   </Modal.ModalRoot>;
}

export default connectComponent(Logs, 'message-logger-data');