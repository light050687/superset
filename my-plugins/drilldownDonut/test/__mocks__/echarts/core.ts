/**
 * Mock `echarts/core` для jest.
 *
 * Реальный пакет — ESM (`export * from './lib/...'`); node-окружение jest
 * (CommonJS) его не парсит. buildOption из рантайма использует только
 * `format.encodeHTML`, поэтому мокаем именно его.
 *
 * Реализация `encodeHTML` повторяет echarts 1:1
 * (zrender/echarts `lib/util/format.encodeHTML`: `&` экранируется ПЕРВЫМ,
 * затем `< > " '`), чтобы тест экранирования проверял ту же семантику, что
 * и прод-код.
 */
export const format = {
  encodeHTML(source: unknown): string {
    return source == null
      ? ''
      : String(source)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
  },
};
