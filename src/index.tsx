import { ActionTypes } from './modules/constants';
import Settings from './components/settings';
import { Dispatcher } from '@webpack/common';
import Plugin from '@entities/plugin';
import Manager from './patches';
import Locale from '@api/i18n';
import i18n from './i18n';
import React from 'react';


export default class MessageLogger extends Plugin {
   public manager = new Manager(this);
   public strings = Locale.add(i18n);

   start() {
      this.manager.apply();
   };

   stop() {
      this.manager.remove();
      this.strings.remove();
   }

   getSettingsPanel() {
      return ({ settings }) => {
         settings.set = (orig => (...args) => {
            orig(...args);
            this.forceUpdateMessages();
         })(settings.set);

         return <Settings settings={settings} />;
      };
   }

   forceUpdateMessages() {
      Dispatcher.wait(() => Dispatcher.dispatch({ type: ActionTypes.ML_UPDATE_MESSAGE }));
   }
}