/* Все колонки на fr-шкалу с минимумами — равномерное растяжение при
   широкой карточке (не было: avgWo/avgSk и status имели fixed px, оставляя
   пустоту посередине между bullet и числовыми; lossRate/dual получали
   избыток fr).
   Total fr ≈ 9.1 → каждая колонка масштабируется с шириной. */
export const COLUMNS = [
    { id: 'tree', label: '', type: 'tree', width: '32px', sortable: false },
    {
        id: 'store',
        label: 'Магазин',
        type: 'store',
        width: 'minmax(150px, 2fr)',
        sortKey: 'name',
        defaultSort: 'asc',
    },
    {
        id: 'lossRate',
        label: 'Уровень потерь',
        type: 'bullet-loss',
        width: 'minmax(140px, 1.5fr)',
        sortKey: 'lossCombined',
        defaultSort: 'desc',
        align: 'right',
    },
    {
        id: 'dual',
        label: 'Спис. / Нед.',
        type: 'dual-bullet',
        width: 'minmax(140px, 1.3fr)',
        sortable: false,
    },
    {
        id: 'avgWo',
        label: 'Ср. спис.',
        type: 'number',
        width: 'minmax(80px, 0.7fr)',
        sortKey: 'avgWriteoff',
        defaultSort: 'desc',
        align: 'right',
        numberField: 'avgWriteoff',
    },
    {
        id: 'avgSk',
        label: 'Ср. недост.',
        type: 'number',
        width: 'minmax(80px, 0.7fr)',
        sortKey: 'avgShrinkageCheck',
        defaultSort: 'desc',
        align: 'right',
        numberField: 'avgShrinkageCheck',
    },
    {
        id: 'drivers',
        label: 'Основные драйверы',
        type: 'drivers',
        width: 'minmax(180px, 2fr)',
        sortable: false,
    },
    {
        id: 'status',
        label: 'Статус',
        type: 'status',
        width: 'minmax(100px, 0.9fr)',
        sortable: false,
        align: 'right',
    },
];
export const GRID_COLS = COLUMNS.map(c => c.width).join(' ');
//# sourceMappingURL=columns.js.map