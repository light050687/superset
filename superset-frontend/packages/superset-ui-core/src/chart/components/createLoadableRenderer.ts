/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  type FC,
  type ReactElement,
  type ReactNode,
  useEffect,
  useState,
} from 'react';

export type LoadableRendererProps = {
  onRenderFailure?: Function;
  onRenderSuccess?: Function;
};

type LoaderMap<Exports> = {
  [K in keyof Exports]: () => Promise<Exports[K]>;
};

export interface OptionsWithMap<Props, Exports> {
  loader: LoaderMap<Exports>;
  loading: (args: {
    error?: unknown;
    isLoading: boolean;
    pastDelay?: boolean;
    timedOut?: boolean;
    retry?: () => void;
  }) => ReactNode;
  render: (loaded: Exports, props: Props) => ReactNode;
}

export interface LoadableRenderer<Props, Exports>
  extends FC<Props & LoadableRendererProps> {
  preload: () => Promise<Exports>;
}

type LoadState<Exports> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'loaded'; loaded: Exports };

/**
 * Drop-in replacement for `react-loadable`'s `Loadable.Map`, rewritten as a
 * function component so it does not trip React 18's legacy-API warnings
 * (`componentWillMount`, `contextTypes`).
 *
 * Preserves the `.preload()` static method and the `onRenderSuccess` /
 * `onRenderFailure` callbacks SuperChartCore depends on. Each call to
 * `createLoadableRenderer` owns its own closure-scoped load cache so
 * different chart plugins don't collide.
 */
export default function createLoadableRenderer<
  Props,
  Exports extends Record<string, unknown>,
>(options: OptionsWithMap<Props, Exports>): LoadableRenderer<Props, Exports> {
  const { loader, loading, render } = options;

  let loadPromise: Promise<Exports> | null = null;
  let cached: Exports | null = null;
  let cachedError: unknown = null;

  const startLoad = (): Promise<Exports> => {
    if (loadPromise) return loadPromise;
    const keys = Object.keys(loader) as (keyof Exports)[];
    if (keys.length === 0) {
      cached = {} as Exports;
      loadPromise = Promise.resolve(cached);
      return loadPromise;
    }
    loadPromise = Promise.all(keys.map(k => loader[k]()))
      .then(values => {
        const modules = keys.reduce((acc, key, i) => {
          acc[key] = values[i] as Exports[typeof key];
          return acc;
        }, {} as Exports);
        cached = modules;
        return modules;
      })
      .catch(err => {
        cachedError = err;
        // Reset so a remount can retry.
        loadPromise = null;
        throw err;
      });
    return loadPromise;
  };

  const Renderer: LoadableRenderer<Props, Exports> = (
    props: Props & LoadableRendererProps,
  ) => {
    const { onRenderSuccess, onRenderFailure, ...rest } = props;

    const [state, setState] = useState<LoadState<Exports>>(() => {
      if (cached) return { status: 'loaded', loaded: cached };
      if (cachedError) return { status: 'error', error: cachedError };
      return { status: 'loading' };
    });

    useEffect(() => {
      if (state.status !== 'loading') return undefined;
      let cancelled = false;
      startLoad()
        .then(modules => {
          if (!cancelled) setState({ status: 'loaded', loaded: modules });
        })
        .catch(error => {
          if (!cancelled) setState({ status: 'error', error });
        });
      return () => {
        cancelled = true;
      };
    }, [state.status]);

    // Match react-loadable's `afterRender` behavior: fire on every mount +
    // update (no deps). SuperChartCore relies on this to flip its spinner.
    useEffect(() => {
      if (state.status === 'loaded') {
        onRenderSuccess?.();
      } else if (state.status === 'error') {
        onRenderFailure?.(state.error);
      }
    });

    if (state.status === 'error') {
      return loading({ error: state.error, isLoading: false }) as ReactElement;
    }
    if (state.status === 'loading') {
      return loading({ isLoading: true }) as ReactElement;
    }
    return render(state.loaded, rest as unknown as Props) as ReactElement;
  };

  Renderer.preload = startLoad;
  Renderer.displayName = 'LoadableRenderer';

  return Renderer;
}
