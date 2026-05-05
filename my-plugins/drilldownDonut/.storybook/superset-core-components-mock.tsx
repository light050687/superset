/**
 * Mock для @superset-ui/core/components (standalone Storybook).
 *
 * Эти компоненты в production — обёртки над Ant Design v5 из Superset.
 * В Storybook плагина они замокованы нативными HTML-элементами,
 * чтобы не тянуть antd в дев-зависимости.
 */

import React from 'react';

interface InputProps {
  size?: 'small' | 'middle' | 'large';
  placeholder?: string;
  value?: string;
  status?: 'warning' | 'error';
  onChange?: (e: { target: { value: string } }) => void;
  'aria-label'?: string;
}

export function Input(props: InputProps): JSX.Element {
  return (
    <input
      type="text"
      placeholder={props.placeholder}
      value={props.value ?? ''}
      onChange={(e) => props.onChange?.({ target: { value: e.target.value } })}
      aria-label={props['aria-label']}
      style={{
        padding: '4px 8px',
        fontSize: 12,
        border: `1px solid ${props.status === 'warning' ? '#ccb604' : '#dcdcdc'}`,
        borderRadius: 4,
        width: '100%',
      }}
    />
  );
}

interface SelectOption {
  value: string;
  label: React.ReactNode;
}

interface SelectProps {
  size?: 'small' | 'middle' | 'large';
  value?: string;
  options?: SelectOption[];
  onChange?: (value: string) => void;
  'aria-label'?: string;
  popupMatchSelectWidth?: boolean;
}

export function Select(props: SelectProps): JSX.Element {
  return (
    <select
      value={props.value ?? ''}
      onChange={(e) => props.onChange?.(e.target.value)}
      aria-label={props['aria-label']}
      style={{
        padding: '4px 8px',
        fontSize: 12,
        border: '1px solid #dcdcdc',
        borderRadius: 4,
        width: '100%',
      }}
    >
      {(props.options ?? []).map((o) => (
        <option key={o.value} value={o.value}>
          {typeof o.label === 'string' ? o.label : o.value}
        </option>
      ))}
    </select>
  );
}

interface ButtonProps {
  size?: 'small' | 'middle' | 'large';
  type?: 'text' | 'dashed' | 'primary' | 'default' | 'link';
  danger?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  'aria-label'?: string;
  title?: string;
}

export function Button(props: ButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={props['aria-label']}
      title={props.title}
      style={{
        padding: '4px 10px',
        fontSize: 12,
        border: props.type === 'dashed' ? '1px dashed #c0c0c0' : '1px solid #dcdcdc',
        borderRadius: 4,
        background: 'transparent',
        color: props.danger ? '#dc2626' : 'inherit',
        cursor: 'pointer',
      }}
    >
      {props.children}
    </button>
  );
}

interface InputNumberProps {
  value?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
}

export function InputNumber(props: InputNumberProps): JSX.Element {
  return (
    <input
      type="number"
      value={props.value ?? ''}
      min={props.min}
      max={props.max}
      onChange={(e) => {
        const v = e.target.value === '' ? null : Number(e.target.value);
        props.onChange?.(v);
      }}
    />
  );
}
