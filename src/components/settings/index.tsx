import { Switch, ColorPicker } from '@components/settings';
import { Category } from '@components';
import React from 'react';

export default function Settings({ settings }) {
   const [messagesOpen, setMessagesOpen] = React.useState(false);

   return <>
      <Category
         title='Message Display Options'
         onChange={() => setMessagesOpen(!messagesOpen)}
         opened={messagesOpen}
         description='Customize the way manipulated messages are displayed.'
         icon='ChatBubble'
      >
         <ColorPicker
            title='Deleted Message Colour'
            onChange={v => settings.set('deletedColour', v)}
            default={16730955}
            value={settings.get('deletedColour', 16730955)}
         />
         <Switch
            title='Use Minimal Style'
            description='Uses a more minimal style for displaying deleted messages.'
            checked={settings.get('useMinimalStyle', false)}
            onChange={v => settings.set('useMinimalStyle', v)}
            endDivider={false}
         />
      </Category>
   </>;
}