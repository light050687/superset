import { CategoryColorOverride } from '../types';
/**
 * Кастомный Superset-control: редактор списка «категория → accent».
 *
 * Superset отдаёт `value: CategoryColorOverride[]` и `onChange(next)`
 * через props. Используем Ant Design v5 компоненты из
 * `@superset-ui/core/components` (они бренд-согласованы с Superset) плюс
 * useTheme() — значения светлой/тёмной темы берутся из DS 2.0 токенов.
 */
export interface CategoryColorMapControlProps {
    value?: CategoryColorOverride[];
    onChange?: (value: CategoryColorOverride[]) => void;
    label?: string;
    description?: string;
}
declare function CategoryColorMapControl(props: CategoryColorMapControlProps): JSX.Element;
export default CategoryColorMapControl;
//# sourceMappingURL=CategoryColorMapControl.d.ts.map