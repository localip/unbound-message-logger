import { classnames, getOwnerInstance } from '@utilities';
import { HeaderBarIcon } from '../components/icons';
import { Locale, Modals } from '@webpack/common';
import { Tooltip } from '@components/discord';
import { Logs } from '../components/modals';
import { bulk, filters } from '@webpack';
import { Patch } from '../structures';
import React from 'react';

import Style from '../styles/modal.css';

const [
   Classes,
   HeaderBar,
   HeaderClasses
] = bulk(
   filters.byProps('iconWrapper', 'clickable'),
   filters.byDisplayName('HeaderBar', false),
   filters.byProps('title', 'chatContent')
);

export default class extends Patch {
   constructor(
      public main: any
   ) {
      super('Header Bar Icon');
   }

   apply(): void {
      Style.append();

      this.patcher.before(HeaderBar, 'default', (_, [props]: [any]) => {
         if (!props?.toolbar) return;

         props.toolbar.props.children?.unshift(
            <div className={classnames(Classes.iconWrapper, Classes.clickable)}>
               <Tooltip text={Locale.Messages.ML_NAME}>
                  <HeaderBarIcon
                     className={Classes.icon}
                     onClick={() => Modals.openModal(e => <Logs {...e} />)}
                  />
               </Tooltip>
            </div>
         );
      });

      this.forceUpdateToolbar();
   }

   forceUpdateToolbar() {
      const toolbar = document.querySelector(`.${HeaderClasses.title}`);
      if (toolbar) getOwnerInstance(toolbar)?.forceUpdate?.();
   }

   remove(): void {
      Style.remove();
      this.patcher.unpatchAll();
      this.forceUpdateToolbar();
   };
}