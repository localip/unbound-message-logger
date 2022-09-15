import { create } from '@patcher';

export default class Patch {
   public patcher: ReturnType<typeof create>;
   public promises = {
      cancelled: false,
      cancel: () => this.promises.cancelled = true
   };

   constructor(
      public name?: string
   ) {
      this.patcher = create(`message-logger-${name ?? 'Unnamed'}`);
   }

   apply(): void {

   }

   remove(): void {

   }

   _apply(): void {
      this.apply();
   }

   _remove(): void {
      this.promises.cancel();
      this.remove();
   }
}