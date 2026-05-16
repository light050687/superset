import { deriveStatus, STATUSES } from '../utils/statusRules';
import { hashString, randNormal, seededRandom } from './seededRandom';
import { CAUSE_TYPES, FORMATS_META, SEGMENTS, WRITEOFF_TYPES, } from './rankedStoresMock';
/**
 * Дополняет «реальный» магазин мок-полями:
 *   - spark: тренд 12 недель
 *   - causeDist / woTypeDist: распределения по причинам и видам списаний
 *   - segmentsDist: сегменты для tree-accordion
 *   - main* поля для driversCell
 *   - status, statusRank
 *
 * Всё детерминировано от store_id, что гарантирует стабильность значений
 * при повторных рендерах.
 *
 * TODO (следующая итерация): заменить моки на SupersetClient-запросы при
 * открытии модали и раскрытии tree.
 */
export function enrichStoreWithMocks(base) {
    const seed = hashString(base.id);
    const rng = seededRandom(seed);
    const status = deriveStatus({
        writeoff: base.writeoff,
        shrinkage: base.shrinkage,
        planWriteoff: base.planWriteoff,
        planShrinkage: base.planShrinkage,
    });
    /* Spark — 12 недель с нарастанием к финальному значению */
    const spark = [];
    for (let w = 0; w < 12; w += 1) {
        const progress = w / 11;
        spark.push(+(base.writeoff * (0.8 + progress * 0.2) +
            randNormal(rng, 0, base.writeoff * 0.08)).toFixed(2));
    }
    spark[11] = +base.writeoff.toFixed(2);
    /* Main driver (cause) */
    const mainCause = CAUSE_TYPES[Math.floor(rng() * CAUSE_TYPES.length)];
    const mainCausePct = Math.round((50 + rng() * 45) * 100) / 100;
    const mainCauseDelta = +(rng() * 20 - 8).toFixed(2);
    /* Main writeoff type */
    const mainWoType = WRITEOFF_TYPES[Math.floor(rng() * WRITEOFF_TYPES.length)];
    const mainWoTypePct = +(base.writeoff * (0.6 + rng() * 0.3)).toFixed(2);
    const mainWoTypeDelta = +(rng() * 0.6 - 0.2).toFixed(2);
    /* Main segment */
    const mainSegment = SEGMENTS[Math.floor(rng() * SEGMENTS.length)];
    const mainSegmentPct = Math.round(10 + rng() * 40);
    const mainSegmentDelta = +(rng() * 12 - 5).toFixed(1);
    /* Causes distribution (sums to 100%) */
    const causeDist = (() => {
        const list = [];
        let remaining = 100;
        const shuffled = [...CAUSE_TYPES].sort(() => rng() - 0.5);
        shuffled.forEach((type, j) => {
            const isLast = j === shuffled.length - 1;
            const pct = isLast
                ? Math.max(0, remaining)
                : Math.round(remaining * (0.2 + rng() * 0.4) * 100) / 100;
            list.push({ type, pct, delta: +(rng() * 10 - 4).toFixed(2) });
            remaining -= pct;
            if (remaining < 0)
                remaining = 0;
        });
        list.sort((a, b) => b.pct - a.pct);
        return list;
    })();
    /* Writeoff types distribution */
    const woTypeDist = (() => {
        const list = [];
        let rem = base.writeoff;
        const shuffled = [...WRITEOFF_TYPES].sort(() => rng() - 0.5);
        shuffled.forEach((name, j) => {
            const isLast = j === shuffled.length - 1;
            const pct = isLast
                ? Math.max(0, rem)
                : +(rem * (0.3 + rng() * 0.4)).toFixed(2);
            list.push({ name, pct, delta: +(rng() * 0.6 - 0.2).toFixed(2) });
            rem -= pct;
            if (rem < 0)
                rem = 0;
        });
        list.sort((a, b) => b.pct - a.pct);
        return list;
    })();
    /* Segments distribution (5-8 сегментов) */
    const segmentsDist = buildSegments(base, rng);
    const lossCombined = base.writeoff + Math.max(0, base.shrinkage);
    const statusMeta = STATUSES[status];
    const fmtMeta = FORMATS_META[base.format];
    return {
        ...base,
        isSegment: false,
        writeoff: +base.writeoff.toFixed(2),
        shrinkage: +base.shrinkage.toFixed(2),
        planWriteoff: fmtMeta?.planWriteoff ?? base.planWriteoff,
        planShrinkage: fmtMeta?.planShrinkage ?? base.planShrinkage,
        lossCombined: +lossCombined.toFixed(2),
        mainCause,
        mainCausePct,
        mainCauseDelta,
        mainWoType,
        mainWoTypePct,
        mainWoTypeDelta,
        mainSegment,
        mainSegmentPct,
        mainSegmentDelta,
        status,
        statusRank: statusMeta.rank,
        spark,
        causeDist,
        woTypeDist,
        segmentsDist,
    };
}
function buildSegments(base, rng) {
    const segCount = 5 + Math.floor(rng() * 4);
    const shuffled = [...SEGMENTS].sort(() => rng() - 0.5).slice(0, segCount);
    /* Веса по heavy-tail распределению */
    const weights = [];
    let weightSum = 0;
    for (let j = 0; j < segCount; j += 1) {
        const w = Math.pow(rng(), 1.8) * 100 + 5;
        weights.push(w);
        weightSum += w;
    }
    const segments = shuffled.map((segName, j) => {
        const segCode = segName.split(' ')[0];
        const segShortName = segName.replace(`${segCode} `, '');
        const share = weights[j] / weightSum;
        const segWriteoff = +(base.writeoff * share * segCount * 0.7 +
            randNormal(rng, 0, base.writeoff * 0.08)).toFixed(2);
        const segShrinkage = +(base.shrinkage * share * segCount * 0.7 +
            randNormal(rng, 0, Math.max(0.05, Math.abs(base.shrinkage)) * 0.15)).toFixed(2);
        const segPlanW = +(base.planWriteoff * share * segCount * 0.7).toFixed(2);
        const segPlanS = +(base.planShrinkage * share * segCount * 0.7).toFixed(2);
        const segRevenue = +(base.revenue * share * segCount * 0.7).toFixed(1);
        const segLossCombined = +(segWriteoff + Math.max(0, segShrinkage)).toFixed(2);
        /* Распределения внутри сегмента */
        const segCauses = (() => {
            const list = [];
            let rem = 100;
            const shuf = [...CAUSE_TYPES].sort(() => rng() - 0.5);
            shuf.forEach((type, k) => {
                const isLast = k === shuf.length - 1;
                const pct = isLast
                    ? Math.max(0, rem)
                    : Math.round(rem * (0.2 + rng() * 0.45) * 100) / 100;
                list.push({ type, pct, delta: +(rng() * 10 - 4).toFixed(2) });
                rem -= pct;
                if (rem < 0)
                    rem = 0;
            });
            list.sort((a, b) => b.pct - a.pct);
            return list;
        })();
        const segWoTypes = (() => {
            const list = [];
            let rem = segWriteoff;
            const shuf = [...WRITEOFF_TYPES].sort(() => rng() - 0.5);
            shuf.forEach((name, k) => {
                const isLast = k === shuf.length - 1;
                const pct = isLast
                    ? Math.max(0, rem)
                    : +(rem * (0.3 + rng() * 0.4)).toFixed(2);
                list.push({ name, pct, delta: +(rng() * 0.5 - 0.15).toFixed(2) });
                rem -= pct;
                if (rem < 0)
                    rem = 0;
            });
            list.sort((a, b) => b.pct - a.pct);
            return list;
        })();
        const segStatus = deriveStatus({
            writeoff: segWriteoff,
            shrinkage: segShrinkage,
            planWriteoff: segPlanW,
            planShrinkage: segPlanS,
        });
        const segAvgWo = Math.round(30 + rng() * 300);
        const segAvgSk = Math.round(20 + rng() * 200);
        return {
            id: `${base.id}-seg${j}`,
            segmentId: segName,
            storeId: base.id,
            isSegment: true,
            code: segCode,
            name: segShortName,
            shortLabel: segShortName,
            city: base.city,
            format: base.format,
            formatName: 'Сегмент',
            toClass: Math.round(segRevenue),
            writeoff: segWriteoff,
            shrinkage: segShrinkage,
            planWriteoff: segPlanW,
            planShrinkage: segPlanS,
            lossCombined: segLossCombined,
            avgWriteoff: segAvgWo,
            avgShrinkageCheck: segAvgSk,
            mainCause: segCauses[0]?.type ?? CAUSE_TYPES[0],
            mainCausePct: segCauses[0]?.pct ?? 0,
            mainCauseDelta: segCauses[0]?.delta ?? 0,
            mainWoType: segWoTypes[0]?.name ?? WRITEOFF_TYPES[0],
            mainWoTypePct: segWoTypes[0]?.pct ?? 0,
            mainWoTypeDelta: segWoTypes[0]?.delta ?? 0,
            status: segStatus,
            statusRank: STATUSES[segStatus].rank,
            causeDist: segCauses,
            woTypeDist: segWoTypes,
        };
    });
    segments.sort((a, b) => b.lossCombined - a.lossCombined);
    return segments;
}
//# sourceMappingURL=storeEnrichment.js.map