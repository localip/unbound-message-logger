import type { Message } from 'discord-types/general';
import { Channels } from '@webpack/stores';
import { filters, bulk } from '@webpack';
import { Moment } from '@webpack/common';
import { classnames } from '@utilities';
import React from 'react';

const [
   ChannelMessage,
   MessageClass,
   User,
   Classes
] = bulk(
   m => m.type && !!~m.type.toString().indexOf('useContextMenu'),
   filters.byPrototypes('getReaction', 'isSystemDM'),
   filters.byPrototypes('tag'),
   filters.byProps('cozyMessage')
);

interface MessageProps {
   message: Message;
   className?: string;
   [key: string]: any;
}

export default function (props: MessageProps): JSX.Element {
   return <ChannelMessage
      groupId={props.message.id}
      {...props}
      style={{
         marginBottom: '5px',
         marginTop: '5px',
         paddingTop: '5px',
         paddingBottom: '5px'
      }}
      className={classnames(
         Classes.message,
         Classes.cozyMessage,
         props.groupStart && Classes.groupStart,
         props.className
      )}
      channel={Channels.getChannel(props.message.channel_id)}
      messageLogger={true}
      message={
         new MessageClass(
            Object.assign({ ...props.message }, {
               author: new User({ ...props.message.author }),
               timestamp: Moment(props.message.timestamp),
               channel: Channels.getChannel(props.message.channel_id),
               embeds: props.message.embeds.map(embed => embed.timestamp ? Object.assign(embed, {
                  timestamp: Moment(embed.timestamp)
               }) : embed)
            })
         )
      }
   />;
}