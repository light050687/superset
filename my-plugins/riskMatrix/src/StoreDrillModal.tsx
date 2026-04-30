import React, { useEffect, useMemo, useState } from 'react';
import { StorePoint, QuadrantDef, QuadrantKey, DetailQueryParams, FormatValueFn } from './types';
import { getQuadrant, storeBadness } from './utils/quadrants';
import { Thresholds } from './utils/quadrants';
import { seededRandom, randNormal } from './utils/scales';
import {
  fetchStoreTrend,
  fetchStoreCauses,
  fetchStoreSkus,
  TrendPoint,
  CauseRow,
  SkuRow,
} from './utils/detailApi';
import { ModalBg, Modal, BulletRow, Skeleton, EmptyBlock } from './styles';
import { formatRussianDeltaAbsEx } from './utils/formatRussian';
import { useFocusTrap } from './utils/useFocusTrap';

interface Props {
  storeId: string;
  stores: StorePoint[];
  quadrants: Record<QuadrantKey, QuadrantDef>;
  thresholds: Thresholds;
  formatColorMap: Map<string, string>;
  formatX: FormatValueFn;
  formatY: FormatValueFn;
  formatSize: FormatValueFn;
  formatLoss: FormatValueFn;
  xShort: string;
  yShort: string;
  sizeUnit: string;
  detailQueryParams: DetailQueryParams;
  onClose: () => void;
}

interface AsyncData<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

const initialAsync = <T,>(): AsyncData<T> => ({ loading: true, error: null, data: null });

const StoreDrillModal: React.FC<Props> = ({
  storeId,
  stores,
  quadrants,
  thresholds,
  formatColorMap,
  formatX,
  formatY,
  formatSize,
  formatLoss,
  xShort,
  yShort,
  sizeUnit,
  detailQueryParams,
  onClose,
}) => {
  const store = useMemo(() => stores.find((s) => s.id === storeId), [stores, storeId]);

  // Rank in format — вычисляем ДО early return, чтобы не нарушить Rules of Hooks.
  // Если store не найден — возвращаем {rank:0,total:0}.
  const rank = useMemo(() => {
    if (!store) return { rank: 0, total: 0 };
    const sameFmt = stores.filter((s) => s.format === store.format);
    const sorted = [...sameFmt].sort((a, b) => storeBadness(b) - storeBadness(a));
    const index = sorted.findIndex((s) => s.id === store.id);
    return { rank: index + 1, total: sameFmt.length };
  }, [stores, store]);

  const [trend, setTrend] = useState<AsyncData<TrendPoint[]>>(initialAsync());
  const [causes, setCauses] = useState<AsyncData<CauseRow[]>>(initialAsync());
  const [skus, setSkus] = useState<AsyncData<SkuRow[]>>(initialAsync());

  // Lazy-load detail API
  useEffect(() => {
    let cancelled = false;

    const loadTrend = async () => {
      if (!detailQueryParams.datasetId || !detailQueryParams.trendTimeColumn || !detailQueryParams.trendMetric) {
        // Fallback: синтетический trend из текущего значения
        const rng = seededRandom(hashId(storeId) + 13);
        const end = store?.x ?? 0;
        const noise = end * 0.12;
        const out: TrendPoint[] = [];
        const weeks = detailQueryParams.trendWeeks || 12;
        for (let i = 0; i < weeks; i++) {
          const progress = i / (weeks - 1);
          const val = end * (0.75 + progress * 0.25) + randNormal(rng, 0, noise);
          out.push({ t: `w-${weeks - 1 - i}`, value: +val.toFixed(3) });
        }
        out[weeks - 1] = { t: 'now', value: end };
        if (!cancelled) setTrend({ loading: false, error: null, data: out });
        return;
      }
      try {
        const data = await fetchStoreTrend(detailQueryParams, storeId);
        if (!cancelled) setTrend({ loading: false, error: null, data });
      } catch (e) {
        if (!cancelled)
          setTrend({
            loading: false,
            error: e instanceof Error ? e.message : 'Ошибка загрузки trend',
            data: null,
          });
      }
    };

    const loadCauses = async () => {
      if (!detailQueryParams.datasetId || !detailQueryParams.causesDimension || !detailQueryParams.causesMetric) {
        if (!cancelled) setCauses({ loading: false, error: null, data: [] });
        return;
      }
      try {
        const data = await fetchStoreCauses(detailQueryParams, storeId);
        if (!cancelled) setCauses({ loading: false, error: null, data });
      } catch (e) {
        if (!cancelled)
          setCauses({
            loading: false,
            error: e instanceof Error ? e.message : 'Ошибка загрузки причин',
            data: null,
          });
      }
    };

    const loadSkus = async () => {
      if (!detailQueryParams.datasetId || !detailQueryParams.skusDimension || !detailQueryParams.skusMetric) {
        if (!cancelled) setSkus({ loading: false, error: null, data: [] });
        return;
      }
      try {
        const data = await fetchStoreSkus(detailQueryParams, storeId);
        if (!cancelled) setSkus({ loading: false, error: null, data });
      } catch (e) {
        if (!cancelled)
          setSkus({
            loading: false,
            error: e instanceof Error ? e.message : 'Ошибка загрузки SKU',
            data: null,
          });
      }
    };

    setTrend(initialAsync());
    setCauses(initialAsync());
    setSkus(initialAsync());
    loadTrend();
    loadCauses();
    loadSkus();

    return () => {
      cancelled = true;
    };
  }, [storeId, detailQueryParams, store]);

  if (!store) return null;

  const q = getQuadrant(store, thresholds);
  const qDef = quadrants[q];
  const qColor = qDef.color;
  // Абсолютная разница в единицах метрики (для отображения в п.п., если метрика — %).
  // Класс подсвечивает статус на основе относительной разницы от плана (threshold 3%).
  const dxAbs = store.planX != null ? store.x - store.planX : null;
  const dyAbs = store.planY != null ? store.y - store.planY : null;
  const dxRatio =
    store.planX != null && store.planX !== 0 ? (store.x - store.planX) / store.planX : null;
  const dyRatio =
    store.planY != null && store.planY !== 0 ? (store.y - store.planY) / store.planY : null;
  const dxCls = dxRatio != null ? (dxRatio > 0.03 ? 'dn' : dxRatio < -0.03 ? 'up' : 'wn') : 'wn';
  const dyCls = dyRatio != null ? (dyRatio > 0.03 ? 'dn' : dyRatio < -0.03 ? 'up' : 'wn') : 'wn';

  const rankPct = rank.total > 0 ? (rank.rank / rank.total) * 100 : 0;

  const onBgClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const trapRef = useFocusTrap<HTMLDivElement>(true);

  return (
    <ModalBg data-open="true" onClick={onBgClick} style={{ zIndex: 1100 }}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="sr-store-title" ref={trapRef}>
        <div className="m-head">
          <div className="m-status" style={{ background: qColor }} />
          <div className="m-titles">
            <div className="m-title" id="sr-store-title">
              {store.name}
            </div>
            <div className="m-sub">
              {store.formatName}
              {store.city ? ` · ${store.city}` : ''}
            </div>
          </div>
          <button type="button" className="m-close" onClick={onClose} aria-label="Закрыть">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>

        <div className="m-summary">
          <div className="m-stat">
            <div className="m-stat-l">{xShort}</div>
            <div className="m-stat-v">{formatX(store.x)}</div>
            {dxAbs != null && (
              <div className={`m-stat-d ${dxCls}`}>
                {formatRussianDeltaAbsEx(dxAbs, 2, 'п.п.')} к плану
              </div>
            )}
          </div>
          <div className="m-stat">
            <div className="m-stat-l">{yShort}</div>
            <div className="m-stat-v">{formatY(store.y)}</div>
            {dyAbs != null && (
              <div className={`m-stat-d ${dyCls}`}>
                {formatRussianDeltaAbsEx(dyAbs, 2, 'п.п.')} к плану
              </div>
            )}
          </div>
          <div className="m-stat">
            <div className="m-stat-l">{sizeUnit || 'Размер'}</div>
            <div className="m-stat-v">{formatSize(store.size)}</div>
          </div>
          {store.sumLoss != null && (
            <div className="m-stat">
              <div className="m-stat-l">Сумма потерь</div>
              <div className="m-stat-v" style={{ color: 'var(--dn)' }}>
                {formatLoss(store.sumLoss)}
              </div>
            </div>
          )}
        </div>

        {(store.planX != null || store.planY != null) && (
          <div className="m-section">
            <div className="m-section-l">
              <span>Bullet chart · Факт vs план</span>
            </div>
            {store.planX != null && (
              <ModalBullet
                label={xShort}
                val={store.x}
                plan={store.planX}
                color="var(--c-tangerine)"
                formatter={formatX}
              />
            )}
            {store.planY != null && (
              <ModalBullet
                label={yShort}
                val={Math.max(0, store.y)}
                plan={store.planY}
                color="var(--c-sky)"
                formatter={formatY}
              />
            )}
          </div>
        )}

        <div className="m-grid-2col">
          <div className="m-section">
            <div className="m-section-l">
              <span>Тренд</span>
              {trend.data && trend.data.length > 0 && (
                <span className="count">
                  {formatX(trend.data[trend.data.length - 1].value)}
                </span>
              )}
            </div>
            <div
              style={{
                background: 'var(--g50)',
                border: '1px solid var(--g200)',
                borderRadius: 10,
                padding: '12px 14px',
                minHeight: 120,
              }}
            >
              {trend.loading && <Skeleton style={{ height: 90 }} />}
              {!trend.loading && trend.error && (
                <EmptyBlock style={{ color: 'var(--dn)' }}>Ошибка: {trend.error}</EmptyBlock>
              )}
              {!trend.loading && !trend.error && trend.data && trend.data.length > 0 && (
                <TrendSpark data={trend.data} color="var(--c-tangerine)" />
              )}
              {!trend.loading && !trend.error && trend.data && trend.data.length === 0 && (
                <EmptyBlock>Нет данных за период</EmptyBlock>
              )}
            </div>
          </div>

          <div className="m-section">
            <div className="m-section-l">
              <span>Позиция среди формата</span>
            </div>
            <div
              style={{
                background: 'var(--g50)',
                border: '1px solid var(--g200)',
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--f)',
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--ink)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                #{rank.rank}
                <span
                  style={{ fontSize: 11, fontWeight: 600, color: 'var(--g500)', marginLeft: 4 }}
                >
                  из {rank.total}
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--m)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--g500)',
                  marginTop: 6,
                }}
              >
                Место в формате «{store.formatName}»
              </div>
              <div
                style={{
                  height: 6,
                  background: 'var(--g200)',
                  borderRadius: 2,
                  marginTop: 10,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: '100%',
                    background:
                      'linear-gradient(90deg, var(--dn) 0%, var(--wn) 50%, var(--up) 100%)',
                    opacity: 0.3,
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: -3,
                    width: 2.5,
                    height: 12,
                    background: 'var(--ink)',
                    borderRadius: 1,
                    left: `calc(${100 - rankPct}% - 1.25px)`,
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  fontFamily: 'var(--m)',
                  fontSize: 8.5,
                  color: 'var(--g500)',
                }}
              >
                <span>Худшие</span>
                <span>Лучшие</span>
              </div>
            </div>
          </div>
        </div>

        {detailQueryParams.causesDimension && (
          <div className="m-section">
            <div className="m-section-l">
              <span>Топ причины</span>
            </div>
            {causes.loading && <Skeleton style={{ height: 80 }} />}
            {!causes.loading && causes.error && (
              <EmptyBlock style={{ color: 'var(--dn)' }}>Ошибка: {causes.error}</EmptyBlock>
            )}
            {!causes.loading && !causes.error && causes.data && causes.data.length === 0 && (
              <EmptyBlock>Нет данных о причинах</EmptyBlock>
            )}
            {!causes.loading && !causes.error && causes.data && causes.data.length > 0 && (
              <CauseList rows={causes.data} formatter={formatLoss} />
            )}
          </div>
        )}

        {detailQueryParams.skusDimension && (
          <div className="m-section">
            <div className="m-section-l">
              <span>Топ SKU</span>
            </div>
            {skus.loading && <Skeleton style={{ height: 80 }} />}
            {!skus.loading && skus.error && (
              <EmptyBlock style={{ color: 'var(--dn)' }}>Ошибка: {skus.error}</EmptyBlock>
            )}
            {!skus.loading && !skus.error && skus.data && skus.data.length === 0 && (
              <EmptyBlock>Нет данных о SKU</EmptyBlock>
            )}
            {!skus.loading && !skus.error && skus.data && skus.data.length > 0 && (
              <SkuList rows={skus.data} formatter={formatLoss} />
            )}
          </div>
        )}
      </Modal>
    </ModalBg>
  );
};

/* =========================================================
 * Sub-components
 * ========================================================= */

interface ModalBulletProps {
  label: string;
  val: number;
  plan: number;
  color: string;
  formatter: FormatValueFn;
}

const ModalBullet: React.FC<ModalBulletProps> = ({ label, val, plan, color, formatter }) => {
  const maxScale = Math.max(val, plan, plan * 1.5) * 1.1 || 1;
  const barPct = (val / maxScale) * 100;
  const targetPct = (plan / maxScale) * 100;
  const ratio = plan !== 0 ? val / plan : 1;
  const status = ratio <= 0.95 ? 'up' : ratio >= 1.05 ? 'dn' : 'wn';
  const valColor = status === 'up' ? 'var(--up)' : status === 'dn' ? 'var(--dn)' : 'var(--wn)';
  return (
    <BulletRow>
      <div className="m-br-label">{label}</div>
      <div className="m-br-chart">
        <div className="m-br-band m-br-band-1" style={{ width: '100%' }} />
        <div className="m-br-band m-br-band-2" style={{ width: `${targetPct}%` }} />
        <div className="m-br-band m-br-band-3" style={{ width: `${targetPct * 0.8}%` }} />
        <div className="m-br-bar" style={{ width: `${barPct}%`, background: color }} />
        <div className="m-br-target" style={{ left: `calc(${targetPct}% - 1.25px)` }} />
      </div>
      <div className="m-br-val" style={{ color: valColor }}>
        {formatter(val)}
        <span className="plan-note">цель: {formatter(plan)}</span>
      </div>
    </BulletRow>
  );
};

const TrendSpark: React.FC<{ data: { t: string; value: number }[]; color: string }> = ({
  data,
  color,
}) => {
  const w = 340;
  const h = 110;
  const padL = 8;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const min = Math.min(...data.map((p) => p.value)) * 0.9;
  const max = Math.max(...data.map((p) => p.value)) * 1.05;
  const range = max - min || 1;
  const sx = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * (w - padL - padR);
  const sy = (v: number) => h - padB - ((v - min) / range) * (h - padT - padB);

  const pts = data.map((p, i) => ({ x: sx(i), y: sy(p.value), val: p.value }));
  let path = pts.length > 0 ? `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}` : '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  const areaPath =
    pts.length > 0
      ? path +
        ` L${pts[pts.length - 1].x.toFixed(1)} ${(h - padB).toFixed(1)} L${pts[0].x.toFixed(1)} ${(h - padB).toFixed(1)} Z`
      : '';

  const gradId = `trend-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="var(--g200)" strokeWidth="1" />
      {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
      {path && <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      {pts.map((p, i) => {
        const isLast = i === pts.length - 1;
        return (
          <circle
            key={i}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r={isLast ? 3 : 1.8}
            fill={color}
            stroke="var(--g50)"
            strokeWidth={isLast ? 1.5 : 1}
          />
        );
      })}
    </svg>
  );
};

const CauseList: React.FC<{ rows: CauseRow[]; formatter: FormatValueFn }> = ({
  rows,
  formatter,
}) => {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map((r, i) => {
        const pct = (r.value / max) * 100;
        return (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) minmax(140px, 1fr) 80px',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              background: 'var(--g50)',
              border: '1px solid var(--g200)',
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {r.name}
            </div>
            <div style={{ height: 6, background: 'var(--g200)', borderRadius: 2, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${pct}%`,
                  background: 'var(--c-sky)',
                  borderRadius: 2,
                }}
              />
            </div>
            <div
              style={{
                fontFamily: 'var(--m)',
                fontSize: 11,
                fontWeight: 700,
                textAlign: 'right',
              }}
            >
              {formatter(r.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SkuList: React.FC<{ rows: SkuRow[]; formatter: FormatValueFn }> = ({ rows, formatter }) => {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {rows.map((r, i) => {
        const pct = (r.value / max) * 100;
        return (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '22px minmax(0,1fr) minmax(120px, 1fr) 80px',
              alignItems: 'center',
              gap: 12,
              padding: '7px 12px',
              background: 'var(--g50)',
              border: '1px solid var(--g200)',
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--m)',
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--g500)',
                textAlign: 'center',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {r.name}
            </div>
            <div style={{ height: 5, background: 'var(--g200)', borderRadius: 2, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${pct}%`,
                  background: 'var(--dn)',
                  borderRadius: 2,
                }}
              />
            </div>
            <div style={{ fontFamily: 'var(--m)', fontSize: 10.5, fontWeight: 700, textAlign: 'right' }}>
              {formatter(r.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default StoreDrillModal;
