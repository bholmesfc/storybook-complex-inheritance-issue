# Storybook Static Build Issue: EventEmitter Methods Undefined in Complex Angular Mixin Inheritance

## Bug Description

When building Storybook statically (`npm run build-storybook`), Angular components that use complex mixin inheritance patterns with `EventEmitter` properties fail at runtime with `TypeError: this.positionSet.emit is not a function` and similar errors. The same components work perfectly in development mode (`npm run storybook`).

## Environment

- **Storybook Version**: 8.6.12
- **Angular Version**: 19.2.10
- **TypeScript Version**: 5.8.0
- **Node Version**: [Your Node version]
- **OS**: Windows
- **Build Tool**: @angular-devkit/build-angular 19.2.11

## Reproduction Steps

1. Create an Angular component that uses multiple mixins with abstract `EventEmitter` properties
2. Set up Storybook stories for the component
3. Run `npm run storybook` - component works correctly
4. Run `npm run build-storybook` to create static build
5. Serve the static build with any HTTP server
6. Navigate to the component story - runtime errors occur

## Expected Behavior

Static Storybook builds should work the same as development mode for components with complex inheritance patterns.

## Actual Behavior

Runtime errors occur:

```
TypeError: this.positionSet.emit is not a function
TypeError: this.openStateChange.emit is not a function
TypeError: this.openStateChange.pipe is not a function
```

## Code Structure

The component uses Angular's mixin pattern:

```typescript
export type AbstractConstructor<T = object> = abstract new (...args: any[]) => T;

// Mixin definition with abstract EventEmitters
export function mixinBackdrop<T>(base: T, backdropVisible: boolean | FcBgVisibility) {
  @Directive()
  abstract class Mixin extends base implements AfterViewInit {
    private _viewStabilized: ReplaySubject<void>;
    /** Emits when content has been rendered.  */
    public viewStabilized$: Observable<void>;

    constructor(...args: any[]) {
      super(...args);
      this._viewStabilized = new ReplaySubject<void>(1);
      this.viewStabilized$ = this._viewStabilized.asObservable();
    }

    ngAfterViewInit(): void {
      this._renderContent();
    }

    private _renderContent(): void {
      // ... other rendering logic
      this._viewStabilized.next();
      this._viewStabilized.complete();
    }
    // ... other mixin logic
  }
  return Mixin;
}

// Mixin definition with abstract EventEmitters
export function mixinPositionable<T>(base: T, defaultPosition?: Position2D) {
  @Directive()
  abstract class Mixin extends base implements OnInit {
    readonly positionChange: EventEmitter<PositionChangeEvent>;
    readonly positionSet: EventEmitter<PositionSetEvent>;
    // ... other mixin logic
  }
  return Mixin;
}

const ComposedContextBase = class {
  constructor(
    public _elementRef: ElementRef<HTMLElement>,
    public _changeDetectorRef: ChangeDetectorRef,
    public _viewContainerRef: ViewContainerRef,
    public _document: Document
  ) {}
};

// Complex mixin chain
const _MixinBase = mixinBackdrop(
  mixinPositionable(
    ComposedContextBase,
    ['right', 'below']
  ),
  false,
  0
);

export class MenuPositionSetEvent implements PositionSetEvent {
  constructor(public source: FcMenu) {}
}
export class MenuPositionChangedEvent implements PositionChangeEvent {
  constructor(
    /** Source FcMenu emitting the event */
    public source: FcMenu,
    /** new [x,y] position of the FcMenu */
    public newPosition: Position2D
  ) {}
}

// Component implementation
@Component({
  selector: 'my-component',
  template: `<div>Component content</div>`,
  standalone: false
})
export class MyComponent extends _MixinBase {
  @Output() readonly positionChange = new EventEmitter<MenuPositionChangedEvent>(true);
  @Output() readonly positionSet = new EventEmitter<MenuPositionSetEvent>(true);
  @Output() readonly openStateChange = new EventEmitter<boolean>(true);

  // Properties referenced in constructor
  private readonly _destroyRef = inject(DestroyRef);
  private _opened = false;
  private _animationEnd = new Subject<AnimationEvent>();

  constructor(
    _elementRef: ElementRef<HTMLElement>,
    _changeDetectorRef: ChangeDetectorRef,
    _viewContainerRef: ViewContainerRef,
    @Inject(DOCUMENT) _document: Document
  ) {
    super(_elementRef, _changeDetectorRef, _viewContainerRef, _document);

    // Tasks to do once backdrop template rendering is complete
    this.viewStabilized$.pipe(take(1)).subscribe(() => {
      this._animationEnd
        .pipe(
          distinctUntilChanged((x, y) => {
            return x.fromState === y.fromState && x.toState === y.toState;
          })
        )
        .subscribe(() => {
          // This line fails in static builds: openStateChange.emit is not a function
          this.openStateChange.emit(this._opened);
        });
      
      // Setting desired behavior on backdrop click
      this.backdropClicked
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe((event: any) => {
          this.handleBackdropClick(event);
          this._changeDetectorRef.markForCheck();
        });
    });
  }

  handleBackdropClick(event: any) {
    // Handle backdrop click
  }
}
```

## Analysis

The issue appears to be related to how Storybook's webpack configuration handles property initialization in complex inheritance chains during static builds. Key observations:

1. **Works in dev mode**: `npm run storybook` works perfectly
2. **Fails in static builds**: `npm run build-storybook` + HTTP server fails
3. **EventEmitter methods missing**: Properties exist but `.emit()` and `.pipe()` methods are undefined
4. **Only affects complex mixins**: Simple components work fine

This suggests webpack optimizations (minification, property mangling, or module bundling) in static builds are interfering with Angular's property initialization for inherited `EventEmitter` instances.

## Attempted Solutions

1. **Webpack optimization disabling**: Tried disabling minification, property mangling, and tree shaking
2. **Defensive initialization**: Added runtime checks and re-initialization of EventEmitters
3. **Property definition approaches**: Used `Object.defineProperty` and various initialization patterns (This worked, but is not an acceptable solution)
4. **Build mode forcing**: Attempted to force development mode for static builds

None of these approaches resolved the issue completely.

## Workaround

Currently using development server only for Storybook demos, avoiding static builds for affected components.

## Additional Context

This appears to be a specific interaction between:

- Angular 19's Ivy renderer
- Complex TypeScript mixin inheritance patterns
- Storybook's webpack build optimizations

The same pattern works in regular Angular applications, suggesting this is specific to Storybook's build process.

## Related Issues

This may be related to broader issues with Angular's Ivy compiler and complex inheritance patterns in optimized webpack builds.
