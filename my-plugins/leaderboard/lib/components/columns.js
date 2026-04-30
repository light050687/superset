"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRID_COLS = exports.COLUMNS = void 0;
exports.COLUMNS = [
    { id: 'tree', label: '', type: 'tree', width: '56px', sortable: false },
    { id: 'rank', label: '#', type: 'rank', width: '32px', sortable: false },
    {
        id: 'store',
        label: 'Магазин',
        type: 'store',
        width: 'minmax(220px, 1.6fr)',
        sortKey: 'name',
        defaultSort: 'asc',
    },
    {
        id: 'lossRate',
        label: 'Уровень потерь',
        type: 'bullet-loss',
        width: 'minmax(140px, 1.1fr)',
        sortKey: 'lossCombined',
        defaultSort: 'desc',
        align: 'right',
    },
    {
        id: 'dual',
        label: 'Спис. / Нед.',
        type: 'dual-bullet',
        width: 'minmax(150px, 1.1fr)',
        sortable: false,
    },
    {
        id: 'avgWo',
        label: 'Ср. сумма спис.',
        type: 'number',
        width: '110px',
        sortKey: 'avgWriteoff',
        defaultSort: 'desc',
        align: 'right',
        numberField: 'avgWriteoff',
    },
    {
        id: 'avgSk',
        label: 'Ср. чек недост.',
        type: 'number',
        width: '110px',
        sortKey: 'avgShrinkageCheck',
        defaultSort: 'desc',
        align: 'right',
        numberField: 'avgShrinkageCheck',
    },
    {
        id: 'drivers',
        label: 'Основные драйверы',
        type: 'drivers',
        width: 'minmax(260px, 1.8fr)',
        sortable: false,
    },
    {
        id: 'status',
        label: 'Статус',
        type: 'status',
        width: 'minmax(130px, 140px)',
        sortKey: 'statusRank',
        defaultSort: 'desc',
        align: 'right',
    },
];
exports.GRID_COLS = exports.COLUMNS.map(c => c.width).join(' ');
//# sourceMappingURL=columns.js.map