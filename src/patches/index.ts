import { createLogger } from '@common/logger';
import * as Registry from './registry';
import { Patch } from '../structures';

const Logger = createLogger('Message Logger');
const patches: typeof Patch[] = Object.values(Registry);

export default class PatchManager {
   public instances = [];

   constructor(public main: any) { }

   apply(): void {
      for (const patch in patches) {
         const Patch = patches[patch];
         const instance = new Patch(this.main);

         this.instances.push(instance);

         try {
            instance._apply();
         } catch (e) {
            Logger.error(`Failed to apply patch "${instance.name}"`, e);
         }
      }
   }

   remove(): void {
      for (const item in this.instances) {
         const instance = this.instances[item];

         try {
            instance._remove();
            delete this.instances[item];
         } catch (e) {
            Logger.error(`Failed to remove patch "${instance.name}"`, e);
         }
      }
   }
};