/**
 * Jest-mock для `@superset-ui/chart-controls`. Минимальная заглушка
 * для smoke-тестов на controlPanel и плагин-layer.
 */

export const sharedControls = new Proxy(
  {},
  {
    get: () => ({ type: 'Stub', label: '', validators: [] }),
  },
);

export const sections = {
  legacyTimeseriesTime: {
    label: 'Time',
    expanded: true,
    controlSetRows: [],
  },
};

export interface ControlPanelConfig {
  controlPanelSections: unknown[];
}

export const D3_FORMAT_OPTIONS: [string, string][] = [];
