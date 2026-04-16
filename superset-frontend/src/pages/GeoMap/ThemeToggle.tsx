import { FC } from 'react';
import type { ThemeMode } from './types';
import { ThemeToggleWrapper, ControlBtn } from './styles';

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
}

const ThemeToggle: FC<ThemeToggleProps> = ({ theme, onToggle }) => (
  <ThemeToggleWrapper>
    <ControlBtn
      onClick={onToggle}
      type="button"
      aria-label={
        theme === 'dark'
          ? 'Переключить на светлую тему'
          : 'Переключить на тёмную тему'
      }
    >
      {theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}
    </ControlBtn>
  </ThemeToggleWrapper>
);

export default ThemeToggle;
