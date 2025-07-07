import { EventEmitter, Input, Output } from '@angular/core';
import { OnInit } from '@angular/core';

export function mixinBackdrop<T extends Constructor<{}>>(base: T) {
  abstract class MixinBackdrop extends base {
    @Input() hasBackdrop = true;
    @Output() backdropClick = new EventEmitter<void>();
    
    onBackdropClick() {
      this.backdropClick.emit();
    }
  }
  return MixinBackdrop;
}

export function mixinPositionable<T extends Constructor<{}>>(base: T) {
  abstract class MixinPositionable extends base implements OnInit {
    @Input() position = 'top';
    @Output() positionSet = new EventEmitter<string>();
    
    ngOnInit() {
      // This is where the error occurs in static builds
      // The positionSet EventEmitter becomes undefined during static build
      this.positionSet.emit(this.position);
    }
  }
  return MixinPositionable;
}

export type Constructor<T = {}> = new (...args: any[]) => T;
