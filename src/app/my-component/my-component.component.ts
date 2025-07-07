import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
import { mixinBackdrop, mixinPositionable } from '../mixins/mixins';

// Base component class
class BaseComponent {
  // Empty base class for mixin composition
}

// Apply mixins to create the mixed component class
const MixedComponent = mixinPositionable(mixinBackdrop(BaseComponent));

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.scss']
})
export class MyComponent extends MixedComponent implements OnInit {
  title = 'My Component';
  
  @Output() readonly openStateChange = new EventEmitter<boolean>(true);
  
  // These derived properties are created BEFORE the constructor runs
  // If openStateChange becomes undefined in static builds, these will fail too
  @Output('opened') readonly _opened$: Observable<void> = this.openStateChange.pipe(
    filter((o) => o),
    map(() => {})
  );
  
  @Output('closed') readonly _closed$: Observable<void> = this.openStateChange.pipe(
    filter((o) => !o),
    map(() => {})
  );
  
  override ngOnInit() {
    console.log('MyComponent ngOnInit called');
    // Call the mixin's ngOnInit method
    super.ngOnInit();
  }
  
  onOpenStateChange(isOpen: boolean) {
    console.log('Open state changed:', isOpen);
    
    // This demonstrates the cascading failure:
    // 1. First, the mixin's positionSet.emit fails
    // 2. Then, our own openStateChange.emit fails
    // 3. Finally, derived observables like _opened$ are broken from the start
    
    try {
      console.log('Emitting position:', this.position);
      this.positionSet.emit(this.position);
    } catch (error) {
      console.error('positionSet.emit failed:', error);
    }
    
    try {
      console.log('Emitting open state change:', isOpen);
      this.openStateChange.emit(isOpen);
    } catch (error) {
      console.error('openStateChange.emit failed:', error);
    }
    
    // These derived observables are also broken in static builds
    try {
      console.log('Testing derived observables...');
      console.log('_opened$ type:', typeof this._opened$);
      console.log('_closed$ type:', typeof this._closed$);
      
      if (this._opened$ && typeof this._opened$.subscribe === 'function') {
        console.log('_opened$ is working');
      } else {
        console.error('_opened$ is broken - derived from broken openStateChange');
      }
    } catch (error) {
      console.error('Derived observable test failed:', error);
    }
  }
}
