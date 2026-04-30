import { memo, useEffect, useMemo, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  MClose,
  MHead,
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
  MProfile,
} from '../styles';
import type { Store } from '../types';
import { STATUSES } from '../utils/statusRules';
import { colorFromKey } from '../utils/colorFromKey';
import { deltaClass, fmtDelta, nf0, nf2 } from '../utils/formatRussian';
import type { DsTokens } from '../themeTokens';
import RankedBarList from './RankedBarList';
import TrendChart from './TrendChart';

interface Props {
  open: boolean;
  store: Store | null;
  allStores: Store[];
  tokens: DsTokens;
  onClose: () => void;
  periodLabel?: string;
}

function StoreModalInner({
  open,
  store,
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

  const rankInFmt = useMemo(() => {
    if (!store) return { rank: 0, total: 0 };
    const fmtStores = allStores
      .filter(x => x.format === store.format)
      .sort((a, b) => b.lossCombined - a.lossCombined);
    return {
      rank: fmtStores.findIndex(x => x.id === store.id) + 1,
      total: fmtStores.length,
    };
  }, [store, allStores]);

  if (!open || !store) return null;

  const s = store;
  const st = STATUSES[s.status];
  const stColor = colorFromKey(st.colorKey, tokens);
  const dW = s.writeoff - s.planWriteoff;
  const dS = s.shrinkage - s.planShrinkage;
  const dWcls = deltaClass(dW, true);
  const dScls = deltaClass(dS, true);

  const trendDir =
    s.spark[11] > s.spark[0]
      ? '↗ растёт'
      : s.spark[11] < s.spark[0]
        ? '↘ снижается'
        : '→ стабильно';

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
        aria-labelledby="rs-modal-title"
        tabIndex={-1}
      >
        <MHead>
          <MStatusBar $color={stColor} />
          <MTitles>
            <MTitle id="rs-modal-title">{s.name}</MTitle>
            <MSub>
              <span className="code">{s.code}</span>
              <span>{s.city}</span>
              <span className="dot" />
              <span>{s.formatName}</span>
              <span className="dot" />
              <span>ТО {s.toClass} млн ₽</span>
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

        <MSummary>
          <MStat>
            <div className="m-stat-l">% Списаний</div>
            <div className="m-stat-v" style={{ color: tokens.tangerine }}>
              {nf2(s.writeoff)}
              <span className="u">%</span>
            </div>
            <div className={`m-stat-d ${dWcls}`}>
              {fmtDelta(dW)} к плану
            </div>
          </MStat>
          <MStat>
            <div className="m-stat-l">% Недостач</div>
            <div className="m-stat-v" style={{ color: tokens.sky }}>
              {nf2(s.shrinkage)}
              <span className="u">%</span>
            </div>
            <div className={`m-stat-d ${dScls}`}>
              {fmtDelta(dS)} к плану
            </div>
          </MStat>
          <MStat>
            <div className="m-stat-l">Ранг в формате</div>
            <div className="m-stat-v">
              #{rankInFmt.rank}
              <span className="u">из {rankInFmt.total}</span>
            </div>
            <div className="m-stat-d wn">{s.formatName}</div>
          </MStat>
          <MStat>
            <div className="m-stat-l">Статус</div>
            <div
              className="m-stat-v"
              style={{ color: stColor, fontSize: 17 }}
            >
              {st.label}
            </div>
            <div className="m-stat-d wn">{st.description}</div>
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
            <span>Тренд списаний · 12 недель</span>
            <MTrendLast>
              {nf2(s.writeoff)}% · {trendDir}
            </MTrendLast>
          </MSectionL>
          <TrendChart data={s.spark} tokens={tokens} />
        </MTrendWrap>

        <M3Col>
          <div>
            <MSectionL>Причины списаний</MSectionL>
            <RankedBarList
              items={s.causeDist.map(c => ({
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
              items={s.woTypeDist.map(w => ({
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
                <span className="m-pr-l">Формат</span>
                <span className="m-pr-v">{s.formatName}</span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Город</span>
                <span className="m-pr-v">{s.city}</span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Дивизион</span>
                <span className="m-pr-v">{s.division}</span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">ТО</span>
                <span className="m-pr-v mono">{s.toClass} млн ₽</span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Ср. сумма спис.</span>
                <span className="m-pr-v mono">{nf0(s.avgWriteoff)} ₽</span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Ср. чек недост.</span>
                <span className="m-pr-v mono">
                  {nf0(s.avgShrinkageCheck)} ₽
                </span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Уровень потерь / План</span>
                <span
                  className="m-pr-v big mono"
                  style={{ color: tokens.tangerine }}
                >
                  {nf2(s.writeoff)}% / {nf2(s.planWriteoff)}%
                </span>
              </div>
              <div className="m-pr-row">
                <span className="m-pr-l">Спис. / Нед.</span>
                <span className="m-pr-v big mono">
                  {nf2(s.writeoff)}% / {nf2(s.shrinkage)}%
                </span>
              </div>
            </MProfile>
          </div>
        </M3Col>

      </Modal>
    </ModalBg>
  );
}

export default memo(StoreModalInner);
