import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ModalOverlay,
  ModalCard,
  ModalHead,
  ModalTitle,
  ModalClose,
  ModalBody,
  DrillSummaryGrid,
  DrillContext,
  DrillSectionTitle,
  DrillBars,
} from '../styles/styled';
import {
  ComputedParetoItem,
  ComputedPareto,
  ThemeTokens,
} from '../types';
import { zoneColor, zoneLabel } from '../utils/zoneColors';
import {
  formatMetricValue,
  formatPct1,
  formatPct2,
  formatSignedPct1,
} from '../utils/paretoFormat';
import { breakdownColor } from '../styles/tokens';
import { getBreakdown } from '../mocks/presets';

export interface DrillModalProps {
  item: ComputedParetoItem;
  computed: ComputedPareto;
  tokens: ThemeTokens;
  metricLabel: string;
  metricUnit: string;
  breakdownTitle: string;
  isDarkMode: boolean;
  onClose: () => void;
}

/**
 * Drill-модалка: summary grid + контекстный блок + «Разложение причин».
 * Через createPortal в document.body; обёртка ставит тот же data-theme,
 * чтобы CSS-переменные резолвились в корректной теме.
 */
export default function DrillModal({
  item,
  computed,
  tokens,
  metricLabel,
  metricUnit,
  breakdownTitle,
  isDarkMode,
  onClose,
}: DrillModalProps) {
  // Escape → close.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const zCol = zoneColor(item.zone, tokens);
  const zClass =
    item.zone === 'A' ? 'zone-a' : item.zone === 'B' ? 'zone-b' : 'zone-c';

  // Breakdown: берём из item.breakdown, иначе из mock-helpers.
  const breakdown =
    item.breakdown && item.breakdown.length > 0
      ? item.breakdown
      : getBreakdown(item.id, item.value);
  const maxRub = Math.max(...breakdown.map(b => b.rub), 0.0001);

  // «Потери от выручки %» mini-bar.
  const lossPct = item.lossPctOfRevenue;
  const allLossPct = computed.items
    .map(p => p.lossPctOfRevenue)
    .filter((v): v is number => v != null);
  const maxLossPct = allLossPct.length ? Math.max(...allLossPct) : 1;
  const lossBarW =
    lossPct != null ? Math.round((lossPct / maxLossPct) * 100) : 0;
  const avgLossPct = allLossPct.length
    ? allLossPct.reduce((s, v) => s + v, 0) / allLossPct.length
    : 0;
  const lossStatus =
    lossPct == null
      ? ''
      : lossPct > avgLossPct * 1.2
      ? 'bad'
      : lossPct < avgLossPct * 0.8
      ? 'good'
      : '';

  // Δ к прошлому периоду.
  const prev = item.valuePrev;
  const deltaPct =
    prev != null && prev !== 0 ? ((item.value - prev) / prev) * 100 : null;
  const deltaClass =
    deltaPct == null ? '' : deltaPct > 0.5 ? 'bad' : deltaPct < -0.5 ? 'good' : '';

  // Движение ранга — теперь 5-я hero-метрика в DrillSummaryGrid.
  // Stream «#11 → #12»: разбито на spans для vertical alignment стрелки.
  const rankDeltaNode =
    item.rankPrev == null ? (
      '—'
    ) : item.rankDelta === 0 ? (
      'без изм.'
    ) : (
      <>
        <span>#{item.rankPrev}</span>
        <span className="arr" aria-hidden="true">→</span>
        <span>#{item.rank}</span>
      </>
    );
  const rankDeltaClass =
    item.rankDelta == null || item.rankDelta === 0
      ? ''
      : item.rankDelta > 0
      ? 'bad'
      : 'good';
  const rankDeltaTip =
    item.rankPrev == null
      ? 'Нет данных за прошлый период'
      : item.rankDelta === 0
      ? `Ранг не изменился: #${item.rank}`
      : item.rankDelta > 0
      ? `Опустилась с #${item.rankPrev} на #${item.rank} (хуже)`
      : `Поднялась с #${item.rankPrev} на #${item.rank} (лучше)`;

  const content = (
    <ModalOverlay
      data-theme={isDarkMode ? 'dark' : 'light'}
      role="dialog"
      aria-modal="true"
      aria-label={`Детализация: ${item.name}`}
    >
      <div className="backdrop" onClick={onClose} />
      <ModalCard>
        <ModalHead>
          <ModalTitle>
            {/* Eyebrow — зона (+ маркер впервые в А). Слово «Разложение»
                убрано: оно дублировало назначение модалки (она и так drill).
                Зона ужe несёт сильный сигнал — A · КРИТИЧЕСКАЯ. */}
            <div className="m-eyebrow">
              {zoneLabel(item.zone)}
              {item.isNewInA ? ' · ★ впервые в A' : ''}
            </div>
            <div className="m-h">
              <span className="dot" style={{ background: zCol }} />
              <span>{item.name}</span>
            </div>
          </ModalTitle>
          <ModalClose aria-label="Закрыть" onClick={onClose} type="button">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M3 3 L13 13 M13 3 L3 13" />
            </svg>
          </ModalClose>
        </ModalHead>
        <ModalBody>
          <DrillSummaryGrid>
            <div title={`Позиция в Парето: ${item.rank} из ${computed.items.length}`}>
              <div className="s-l">Ранг</div>
              <div className={`s-v ${zClass}`}>#{item.rank}</div>
            </div>
            <div title={`${metricLabel} за период: абсолютная величина`}>
              <div className="s-l">{metricLabel}</div>
              <div className={`s-v ${zClass}`}>
                {formatMetricValue(item.value, metricUnit)}
              </div>
            </div>
            <div title="% этой категории от общей суммы">
              <div className="s-l">Доля</div>
              <div className="s-v">{formatPct2(item.share)}</div>
            </div>
            <div title="С нарастающим итогом — все категории до этой включительно">
              <div className="s-l">Кумулятивно</div>
              <div className="s-v">{formatPct1(item.cumPct)}</div>
            </div>
            <div title={rankDeltaTip}>
              <div className="s-l">Движение</div>
              <div className={`s-v rank-delta ${rankDeltaClass}`}>{rankDeltaNode}</div>
            </div>
          </DrillSummaryGrid>

          <DrillContext>
            <div className="ctx-row">
              <div className="ctx-l">
                <span className="ctx-label">Потери от выручки категории</span>
              </div>
              <div className="ctx-bar-wrap">
                <div className="ctx-bar">
                  <div
                    className={`ctx-bar-fill ${lossStatus}`}
                    style={{ width: `${lossBarW}%` }}
                  />
                </div>
                <div
                  className="ctx-bar-avg"
                  style={{
                    left: `${Math.round((avgLossPct / maxLossPct) * 100)}%`,
                  }}
                  title={`Среднее по категориям: ${formatPct2(avgLossPct)}`}
                />
                {/* Цифры под баром — было слева 3 строки (наезды), теперь
                    одной строкой по центру. */}
                <span className="ctx-hint ctx-hint-under">
                  {formatMetricValue(item.value, metricUnit)} из{' '}
                  {formatMetricValue(item.revenueRub ?? null, metricUnit)}
                </span>
              </div>
              <div className={`ctx-v ${lossStatus}`}>
                {formatPct2(lossPct)}
              </div>
            </div>
            <div className="ctx-row">
              <div className="ctx-l">
                <span className="ctx-label">Изменение к прошлому периоду</span>
              </div>
              <div className="ctx-bar-wrap">
                {/* Mini-bar для этой строки не нужен — центрируем «было/стало»
                    в этой колонке (один паттерн с «Потери от выручки»). */}
                <span className="ctx-hint ctx-hint-under">
                  было {formatMetricValue(prev ?? null, metricUnit)} → стало{' '}
                  {formatMetricValue(item.value, metricUnit)}
                </span>
              </div>
              <div className={`ctx-v ${deltaClass}`}>
                {formatSignedPct1(deltaPct)}
              </div>
            </div>
            {/* «Движение по рангу» убран — дублирует Ранг из summary grid. */}
          </DrillContext>

          <DrillSectionTitle>{breakdownTitle}</DrillSectionTitle>
          <DrillBars>
            {breakdown.map((b, idx) => {
              const w = Math.round((b.rub / maxRub) * 100);
              const pctOfTotal =
                item.value > 0 ? (b.rub / item.value) * 100 : 0;
              // Tooltip: полное название + сумма + % — hover показывает full
              // info, даже если name обрезан или столбик визуально маленький.
              const tip = `${b.name}: ${formatMetricValue(b.rub, metricUnit)} (${formatPct1(pctOfTotal)})`;
              return (
                <div className="dbf" key={b.name} title={tip}>
                  <div className="dbf-l">{b.name}</div>
                  <div className="dbf-bar">
                    <div
                      className="dbf-bar-fill"
                      style={{
                        width: `${w}%`,
                        background: breakdownColor(idx, tokens),
                      }}
                    />
                  </div>
                  <div className="dbf-v">
                    {formatMetricValue(b.rub, metricUnit)}
                    <span className="pct">{formatPct1(pctOfTotal)}</span>
                  </div>
                </div>
              );
            })}
          </DrillBars>
        </ModalBody>
      </ModalCard>
    </ModalOverlay>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
