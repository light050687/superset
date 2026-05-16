/**
 * Интеграция кастомного плагина в Superset chart wrapper.
 *
 * По паттерну из patterns_superset_viz_plugin.md §4 и kpiCard:
 *   - скрывает SliceHeader (title / filter-counts), оставляя троеточие ⋮
 *   - делает chart-holder прозрачным без тени/padding
 *   - выводит ⋮-кнопку поверх карточки с hover-fade (через event listeners
 *     с обязательным cleanup во избежание memory leak).
 *
 * Использует `:has()`-CSS селектор для современных браузеров + fallback
 * через прямую DOM-манипуляцию.
 */
import { RefObject } from 'react';
/**
 * Монтирует wrapper-hack на корневой div компонента.
 * Вызывать один раз на mount с ref на корневой элемент.
 */
export declare function useSupersetWrapper(rootRef: RefObject<HTMLElement>): void;
//# sourceMappingURL=useSupersetWrapper.d.ts.map