import { FC } from 'react';
import type { Language } from './types';
import { ControlsWrapper, ControlBtn } from './styles';

interface ControlBarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const LANGUAGES: { key: Language; label: string }[] = [
  { key: 'ru', label: 'Русский' },
  { key: 'en', label: 'English' },
  { key: 'local', label: 'Local' },
];

const ControlBar: FC<React.PropsWithChildren<ControlBarProps>> = ({
  language,
  onLanguageChange,
}) => (
  <ControlsWrapper role="group" aria-label="Выбор языка">
    {LANGUAGES.map(({ key, label }) => (
      <ControlBtn
        key={key}
        isActive={language === key}
        onClick={() => onLanguageChange(key)}
        aria-pressed={language === key}
        type="button"
      >
        {label}
      </ControlBtn>
    ))}
  </ControlsWrapper>
);

export default ControlBar;
