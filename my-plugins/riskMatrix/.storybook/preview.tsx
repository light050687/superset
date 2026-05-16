const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f1114' },
        { name: 'light', value: '#f3f3f3' },
      ],
    },
  },
};

export default preview;
