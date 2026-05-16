const NULL_SUBCATEGORY_NAME = 'Без подкатегории';
const NULL_SUBCATEGORY_SUFFIX = '__null';
function toNumberOrZero(v) {
    if (v == null)
        return 0;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
}
function isNullish(v) {
    if (v == null)
        return true;
    if (typeof v === 'string') {
        const trimmed = v.trim().toLowerCase();
        return trimmed === '' || trimmed === 'null' || trimmed === 'none';
    }
    return false;
}
export function groupRows(rows, catCol, subCol, valueLabel, countLabel) {
    const map = new Map();
    let insertionCounter = 0;
    const hasCount = !!countLabel;
    for (const row of rows) {
        const rawCat = row[catCol];
        if (isNullish(rawCat))
            continue; // строки без категории пропускаем
        const catName = String(rawCat);
        const catId = catName;
        const rub = toNumberOrZero(row[valueLabel]);
        const cnt = hasCount ? toNumberOrZero(row[countLabel]) : 0;
        let parent = map.get(catId);
        if (!parent) {
            parent = {
                name: catName,
                rub: 0,
                count: 0,
                insertionOrder: insertionCounter++,
                children: new Map(),
            };
            map.set(catId, parent);
        }
        parent.rub += rub;
        parent.count += cnt;
        if (subCol) {
            const rawSub = row[subCol];
            const hasSub = !isNullish(rawSub);
            const subName = hasSub ? String(rawSub) : NULL_SUBCATEGORY_NAME;
            const subId = hasSub
                ? `${catId}/${subName}`
                : `${catId}/${NULL_SUBCATEGORY_SUFFIX}`;
            let child = parent.children.get(subId);
            if (!child) {
                child = {
                    id: subId,
                    name: subName,
                    rub: 0,
                    count: hasCount ? 0 : null,
                    color: '', // заполнит transformProps
                    isSynthetic: hasSub ? undefined : true,
                };
                parent.children.set(subId, child);
            }
            child.rub += rub;
            if (hasCount) {
                child.count = (child.count ?? 0) + cnt;
            }
        }
    }
    // Сортировка: категории по rub desc; дети сохраняют порядок появления (Map insertion order).
    // Синтетический «Без подкатегории» принудительно отправляется в конец списка детей —
    // это UX-подсказка, что узел технический.
    const categories = Array.from(map.values())
        .sort((a, b) => b.rub - a.rub)
        .map((v) => {
        const kids = Array.from(v.children.values());
        kids.sort((a, b) => {
            const aSyn = a.isSynthetic ? 1 : 0;
            const bSyn = b.isSynthetic ? 1 : 0;
            return aSyn - bSyn; // стабильная сортировка — только синтетики в конец
        });
        return {
            id: v.name,
            name: v.name,
            rub: v.rub,
            count: hasCount ? v.count : null,
            color: '', // заполнит transformProps
            accent: 'cSky', // заполнит transformProps
            children: kids,
        };
    });
    return { categories };
}
//# sourceMappingURL=groupRows.js.map