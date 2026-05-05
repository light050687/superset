"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EASE = exports.PARETO_KEYFRAMES_CSS = void 0;
exports.PARETO_KEYFRAMES_CSS = `
@keyframes pareto-overlay-in{
  from{opacity:0}
  to{opacity:1}
}
@keyframes pareto-modal-in{
  from{opacity:0;transform:translateY(10px) scale(.98)}
  to{opacity:1;transform:none}
}
@keyframes pareto-skeleton-pulse{
  0%{opacity:.12}
  50%{opacity:.22}
  100%{opacity:.12}
}
@keyframes pareto-tooltip-in{
  from{opacity:0;transform:translateY(-4px)}
  to{opacity:1;transform:translateY(0)}
}

/* DS 2.0 §08 — отключаем все анимации для пользователей с чувствительностью к движению. */
@media (prefers-reduced-motion: never-match){
  .pareto-card,
  .pareto-card *{
    animation-duration:0.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:0.01ms !important;
    scroll-behavior:auto !important;
  }
}
`;
exports.EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
//# sourceMappingURL=keyframes.js.map