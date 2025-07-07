import type { Meta, StoryObj } from '@storybook/angular';
import { MyComponent } from './my-component.component';

const meta: Meta<MyComponent> = {
  title: 'Bug Reproduction/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Storybook Static Build Bug Reproduction

This component demonstrates a bug where EventEmitters in complex mixin inheritance patterns fail in static Storybook builds.

## How to reproduce:
1. Run \`npm run storybook\` - everything works fine
2. Run \`npm run build-storybook\` to create static build
3. Serve with \`npx http-server storybook-static\`
4. Click "Open (Triggers Bug)" button - you'll see: \`this.positionSet.emit is not a function\`

The same component works perfectly in development mode but fails in static builds.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: {
        type: 'select',
      },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Position property from mixinPositionable',
    },
    hasBackdrop: {
      control: {
        type: 'boolean',
      },
      description: 'Backdrop property from mixinBackdrop',
    },
  },
};

export default meta;
type Story = StoryObj<MyComponent>;

// Primary story - demonstrates the bug when "Open (Triggers Bug)" is clicked
export const BugDemo: Story = {
  args: {
    position: 'top',
    hasBackdrop: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Click "Open (Triggers Bug)" to reproduce the issue.**

In static builds, this will throw: \`TypeError: this.positionSet.emit is not a function\`

The EventEmitter from the mixin becomes undefined in static builds but works fine in dev mode.
        `,
      },
    },
  },
};

// Additional variations for testing
export const WithoutBackdrop: Story = {
  args: {
    position: 'bottom',
    hasBackdrop: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Same bug occurs regardless of backdrop setting.',
      },
    },
  },
};

export const LeftPosition: Story = {
  args: {
    position: 'left',
    hasBackdrop: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Bug occurs with any position value.',
      },
    },
  },
};

// Legacy Primary story (kept for compatibility)
export const Primary: Story = {
  args: {
    position: 'top',
    hasBackdrop: true,
  },
};
