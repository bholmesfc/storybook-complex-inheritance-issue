# Storybook Static Build Bug Reproduction

This is a minimal reproduction of a bug where Angular components using complex mixin inheritance with EventEmitter properties fail in static Storybook builds.

## Bug Description

Components work perfectly in development mode (`npm run storybook`) but fail in static builds (`npm run build-storybook`) with errors like:
```
TypeError: this.positionSet.emit is not a function
```

## Project Structure

```
src/
├── app/
│   ├── mixins/
│   │   └── mixins.ts              # Mixin functions with EventEmitters
│   ├── my-component/
│   │   ├── my-component.component.ts     # Component using mixins
│   │   ├── my-component.component.html   # Template
│   │   ├── my-component.component.scss   # Styles
│   │   ├── my-component.stories.ts       # Storybook stories
│   │   └── my-component.component.spec.ts # Tests
│   └── app.module.ts
└── environments/
```

## How to Reproduce

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Test in development mode (works fine):**
   ```bash
   npm run storybook
   ```
   - Navigate to "Bug Reproduction/MyComponent"
   - Click "Open (Triggers Bug)" - everything works

3. **Test in static build (fails):**
   ```bash
   npm run build-storybook
   npx http-server storybook-static
   ```
   - Navigate to "Bug Reproduction/MyComponent"
   - Click "Open (Triggers Bug)" - throws error in console

## The Problem

The `MyComponent` extends a complex mixin chain:
```typescript
const MixedComponent = mixinPositionable(mixinBackdrop(BaseComponent));
```

Each mixin adds EventEmitter properties, but in static builds these become undefined during webpack optimization.

## Key Files

- **`src/app/mixins/mixins.ts`**: Contains the mixin functions with EventEmitters
- **`src/app/my-component/my-component.component.ts`**: The failing component
- **`src/app/my-component/my-component.stories.ts`**: Storybook stories to reproduce the issue

## Environment

- **Storybook**: 8.6.12
- **Angular**: 19.2.10
- **TypeScript**: 5.8.0

## Expected vs Actual

**Expected**: Static builds should work the same as development mode
**Actual**: EventEmitter methods become undefined in static builds

This appears to be a webpack optimization issue specific to complex inheritance patterns in Angular components.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run Storybook in development mode (works fine):
```bash
npm run storybook
```

3. Build static Storybook (reproduces the bug):
```bash
npm run build-storybook
```

4. Serve the static build:
```bash
npx http-server storybook-static
```

## Bug Reproduction

1. Open the static Storybook in your browser
2. Navigate to the MyComponent story
3. Click the "Open (Triggers Bug)" button
4. See the error in the console: `this.positionSet.emit is not a function`

## Environment

- Angular: 19.2.10
- Storybook: 8.6.12
- TypeScript: 5.8.0

## Files

- `src/app/mixins/mixins.ts` - Contains the mixin definitions
- `src/app/my-component/` - The component using the mixins
- `src/app/my-component/my-component.stories.ts` - Storybook stories

## Expected Behavior

The EventEmitter should work the same way in both development and static builds.

## Actual Behavior

In static builds, the EventEmitter becomes `undefined`, causing the error when trying to call `.emit()`.
