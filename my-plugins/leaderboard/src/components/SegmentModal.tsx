import { memo, useEffect, useMemo, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  MClose,
  MContextBc,
  MHead,
  MProfile,
  MSectionL,
  MStat,
  MStatusBar,
  MSub,
  MSummary,
  MTitle,
  MTitles,
  MTrendLast,
  MTrendWrap,
  M3Col,
  Modal,
  ModalBg,
} from '../styles';
import type { Segment, Store } from '../types';
import { STATUSES } from '../utils/statusRules';
import { colorFromKey } from '../utils/colorFromKey';
import { deltaClass, fmtDelta, nf1, nf2 } from '../utils/formatRussian';
import type { DsTokens } from '../themeTokens';
import RankedBarList from './RankedBarList';
import TrendChart from './TrendChart';

interface Props {
  open: boolean;
  parentStore: Store | null;
  segment: Segment | null;
  allStores: Store[];
  tokens: DsTokens;
  onClose: () => void;
  periodLabel?: string;
}

function SegmentModalInner({
  open,
  parentStore,
  segment,
  allStores,
  tokens,
  onClose,
  periodLabel,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(open, modalRef);
  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  /* Среднее по сети для этого сегмента */
  const networkAvg = useMemo(() => {
    if (!segment) return { value: 0, count: 0 };
    let sum = 0;
    let count = 0;
    allStores.forEach(store => {
      store.segmentsDist.forEach(sg => {
        if (sg.segmentId === segment.segmentId) {
          sum += sg.writeoff;
          count += 1;
        }
      });
    });
    return { value: count > 0 ? sum / count : 0, count };
  }, [segment, allStores]);

  /* Rank сегмента в магазине + доля в общих потерях */
  const rankInStore = useMemo(() => {
    if (!parentStore || !segment) return { rank: 0, total: 0, share: 0 };
    const sorted = [...parentStore.segmentsDist].sort(
      (a, b) => b.lossCombined - a.lossCombined,
    );
    const total =
      parentStore.segmentsDist.reduce((acc, x) => acc + x.lossCombined, 0) || 1;
    return {
      rank: sorted.findIndex(x => x.id === segment.id) + 1,
      total: sorted.length,
      share: (segment.lossCombined / total) * 100,
    };
  }, [parentStore, segment]);

  /* Синтетический тренд сегмента = spark магазина × scale. */
  const segTrend = useMemo(() => {
    if (!parentStore || !segment) return [];
    const storeEnd = parentStore.spark[11];
    const scale = storeEnd > 0 ? segment.writeoff / storeEnd : 1;
    return parentStore.spark.map(v => +(v * scale).toFixed(2));
  }, [parentStore, segment]);

  if (!open || !segment || !parentStore) return null;

  const seg = segment;
  const st = STATUSES[seg.status];
  const stColor = colorFromKey(st.colorKey, tokens);
  const dW = seg.writeoff - seg.planWriteoff;
  const dS = seg.shrinkage - seg.planShrinkage;
  const dWcls = deltaClass(dW, true);
  const dScls = deltaClass(dS, true);

  const trendDir =
    segTrend[11] > segTrend[0]
      ? '↗ растёт'
      : segTrend[11] < segTrend[0]
        ? '↘ снижается'
        : '→ стабильно';

  const isAboveAvg = seg.writeoff > networkAvg.value;

  return (
    <ModalBg
      $open={open}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Modal
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rs-seg-modal-title"
        tabIndex={-1}
      >
        <MHead>
          <MStatusBar $color={stColor} />
          <MTitles>
            <MTitle id="rs-seg-modal-title">{seg.segmentId}</MTitle>
            <MSub>
              <span className="code">{seg.code}</span>
              <span>Товарный сегмент</span>
              <span className="dot" />
              <span>
                {parentStore.code} · {parentStore.name}
              </span>
              <span className="dot" />
              <span>{parentStore.city}</span>
              {periodLabel && (
                <>
                  <span className="dot" />
                  <span>{periodLabel}</span>
                </>
              )}
            </MSub>
          </MTitles>
          <MClose type="button" aria-label="Закрыть" onClick={onClose}>
            <svg
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </MClose>
        </MHead>

        <MContextBc>
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 11, height: 11, color: tokens.g500 }}
          >
            <rect x="2" y="2" width="8" height="8" rx="1" />
            <line x1="2" y1="5" x2="10" y2="5" />
          </svg>
          <span className="bc-item">{parentStore.name}</span>
          <span className="bc-sep">›</span>
          <span className="bc-current">{seg.segmentId}</span>
        </MContextBc>

        <MSummary>
          <MStat>
            <div className="m-stat-l">% Списаний сегмента</div>
            <div className="m-stat-v" style={{ color: tokens.tangerine }}>
              {nf2(seg.writeoff)}
              <span className="u">%</span>
            </div>
            <div className={`m-stat-d ${dWcls}`}>{fmtDelta(dW)} к плану</div>
          </MStat>
          <MStat>
            <div className="m-stat-l">% Недостач сегмента</div>
            <div className="m-stat-v" style={{ color: tokens.sky }}>
              {nf2(seg.shrinkage)}
              <span className="u">%</span>
            </div>
            <div className={`m-stat-d ${dScls}`}>{fmtDelta(dS)} к плану</div>
          </MStat>
          <MStat>
            <div className="m-stat-l">Доля в потерях магазина</div>
            <div className="m-stat-v">
              {nf1(rankInStore.share)}
              <span className="u">%</span>
            </div>
            <div className="m-stat-d wn">
              #{rankInStore.rank} из {rankInStore.total}
            </div>
          </MStat>
          <MStat>
            <div className="m-stat-l">Среднее по сети</div>
            <div className="m-stat-v">
              {nf2(networkAvg.value)}
              <span className="u">%</span>
            </div>
            <div className={`m-stat-d ${isAboveAvg ? 'dn' : 'up'}`}>
              {isAboveAvg ? 'выше' : 'ниже'} среднего
            </div>
          </MStat>
        </MSummary>

        <MTrendWrap>
          <MSectionL
            as="div"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Тренд списаний сегмента · 12 недель</span>
            <MTrendLast>
              {nf2(seg.writeoff)}% · {trendDir}
            </MTrendLast>
          </MSectionL>
          <TrendChart data={segTrend} tokens={tokens} />
        </MTrendWrap>

        <M3Col>
          <div>
            <MSectionL>Причины списаний</MSectionL>
            <RankedBarList
              items={seg.causeDist.map(c => ({
                name: c.type.name,
                pct: c.pct,
                delta: c.delta,
                color: colorFromKey(c.type.colorKey, tokens),
              }))}
            />
          </div>
          <div>
            <MSectionL>Виды списаний</MSectionL>
            <RankedBarList
              items={seg.woTypeDist.map(w => ({
                name: w.name,
                pct: w.pct,
                delta: w.delta,
                color: tokens.sky,
              }))}
            />
          </div>
          <div>
            <MSectionL>Профиль</MSectionL>
            <MProfile>
              <div className="m-pr-row">
                <span className="m-pr-l">Сегмент</span>
                <span className="m-pr-v">{seg.code}</span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Магазин</span>
                <span className="m-pr-v">{parentStore.code}</span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Город</span>
                <span className="m-pr-v">{parentStore.city}</span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Формат</span>
                <span className="m-pr-v">{parentStore.formatName}</span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Дивизион</span>
                <span className="m-pr-v">{parentStore.division}</span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Списания / План</span>
                <span
                  className="m-pr-v big mono"
                  style={{ color: tokens.tangerine }}
                >
                  {nf2(seg.writeoff)}% / {nf2(seg.planWriteoff)}%
                </span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Недостачи / План</span>
                <span
                  className="m-pr-v big mono"
                  style={{ color: tokens.sky }}
                >
                  {nf2(seg.shrinkage)}% / {nf2(seg.planShrinkage)}%
                </span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Доля в потерях</span>
                <span className="m-pr-v mono">
                  {nf1(rankInStore.share)}%
                </span>
              </div>
            </MProfile>
          </div>
        </M3Col>
      </Modal>
    </ModalBg>
  );
}

export default memo(SegmentModalInner);
