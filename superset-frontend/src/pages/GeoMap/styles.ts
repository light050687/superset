/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { styled } from '@superset-ui/core';

/*
 * Superset 6.0 uses Ant Design v5 flat tokens via SupersetTheme.
 * Key tokens: colorBgContainer, colorBgElevated, colorBorder, colorBorderSecondary,
 * colorText, colorTextSecondary, colorTextTertiary, colorPrimary, colorPrimaryBg,
 * colorPrimaryHover, colorFillAlter, fontFamily, borderRadius, borderRadiusSM,
 * borderRadiusLG, boxShadow, boxShadowSecondary
 */

// ─── Page container ─────────────────────────────────────────────────────────

export const MapPageContainer = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - 56px);
  overflow: hidden;
  font-family: ${({ theme }) => theme.fontFamily};
`;

export const MapCanvasDiv = styled.div`
  width: 100%;
  height: 100%;
`;

// ─── Control bar (language selector) ────────────────────────────────────────

export const ControlsWrapper = styled.div`
  position: absolute;
  top: 12px;
  right: 52px;
  z-index: 10;
  display: flex;
  gap: 8px;
`;

export const ControlBtn = styled.button<{ isActive?: boolean }>`
  background: ${({ theme, isActive }) =>
    isActive ? theme.colorText : theme.colorBgContainer};
  color: ${({ theme, isActive }) =>
    isActive ? theme.colorBgContainer : theme.colorText};
  border: 1px solid
    ${({ theme, isActive }) => (isActive ? theme.colorText : theme.colorBorder)};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  padding: 6px 14px;
  font-size: ${({ theme }) => theme.fontSizeSM}px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.boxShadow};
  transition: all 0.15s;
  user-select: none;
  font-family: ${({ theme }) => theme.fontFamily};

  &:hover {
    border-color: ${({ theme }) => theme.colorTextSecondary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colorPrimary};
    outline-offset: 2px;
  }
`;

// ─── Theme toggle ───────────────────────────────────────────────────────────

export const ThemeToggleWrapper = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
`;

// ─── Layer panel ────────────────────────────────────────────────────────────

export const PanelWrapper = styled.div`
  position: absolute;
  top: 56px;
  left: 12px;
  z-index: 10;
  background: ${({ theme }) => theme.colorBgContainer};
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  box-shadow: ${({ theme }) => theme.boxShadowSecondary};
  width: 240px;
  overflow-y: auto;
  max-height: calc(100vh - 136px);
  transition: all 0.2s;
  color: ${({ theme }) => theme.colorText};
`;

export const PanelHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: ${({ theme }) => theme.fontSizeSM}px;
  font-weight: 600;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  cursor: pointer;
  user-select: none;
  width: 100%;
  background: transparent;
  color: ${({ theme }) => theme.colorText};
  font-family: ${({ theme }) => theme.fontFamily};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colorPrimary};
    outline-offset: -2px;
  }
`;

export const ToggleIcon = styled.span<{ collapsed?: boolean }>`
  font-size: 10px;
  transition: transform 0.2s;
  transform: ${({ collapsed }) => (collapsed ? 'rotate(-90deg)' : 'none')};
`;

export const PanelBody = styled.div<{ hidden?: boolean }>`
  padding: 6px 0;
  display: ${({ hidden }) => (hidden ? 'none' : 'block')};
`;

// ─── Layer groups ───────────────────────────────────────────────────────────

export const GroupWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colorBorderSecondary};

  &:last-child {
    border-bottom: none;
  }
`;

export const GroupRow = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
  border: none;
  background: none;
  width: 100%;
  font-family: ${({ theme }) => theme.fontFamily};
  color: ${({ theme }) => theme.colorText};

  &:hover {
    background: ${({ theme }) => theme.colorFillAlter};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colorPrimary};
    outline-offset: -2px;
  }
`;

export const GroupIcon = styled.span`
  font-size: 15px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
`;

export const GroupLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizeSM}px;
  flex: 1;
  text-align: left;
`;

export const ToggleSwitch = styled.span<{ on?: boolean }>`
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: ${({ on, theme }) =>
    on ? theme.colorPrimary : theme.colorBorder};
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ on }) => (on ? '16px' : '2px')};
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colorWhite};
    transition: left 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
`;

// ─── Choropleth section ─────────────────────────────────────────────────────

export const SectionDivider = styled.div`
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colorTextTertiary};
`;

export const DataSection = styled.div`
  padding: 8px 12px;
`;

export const UploadBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  border: 2px dashed ${({ theme }) => theme.colorPrimary};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  background: ${({ theme }) => theme.colorPrimaryBg};
  color: ${({ theme }) => theme.colorPrimary};
  font-size: ${({ theme }) => theme.fontSizeSM}px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: ${({ theme }) => theme.fontFamily};

  &:hover {
    background: ${({ theme }) => theme.colorPrimaryBgHover};
    border-color: ${({ theme }) => theme.colorPrimaryHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colorPrimary};
    outline-offset: 2px;
  }
`;

export const DataFilename = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colorPrimary};
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ConfigRow = styled.div`
  margin-bottom: 8px;
`;

export const ConfigLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colorTextSecondary};
  margin-bottom: 3px;
`;

export const ConfigSelect = styled.select`
  width: 100%;
  padding: 5px 8px;
  border: 1px solid ${({ theme }) => theme.colorBorder};
  border-radius: ${({ theme }) => theme.borderRadiusSM}px;
  font-size: 12px;
  background: ${({ theme }) => theme.colorBgContainer};
  color: ${({ theme }) => theme.colorText};
`;

export const PaletteRow = styled.div`
  display: flex;
  gap: 4px;
`;

export const PaletteSwatch = styled.button<{
  isActive?: boolean;
  gradient: string;
}>`
  flex: 1;
  height: 22px;
  border-radius: ${({ theme }) => theme.borderRadiusSM}px;
  cursor: pointer;
  border: 2px solid
    ${({ isActive, theme }) => (isActive ? theme.colorText : 'transparent')};
  background: ${({ gradient }) => gradient};
  transition: border-color 0.15s;
  padding: 0;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colorPrimary};
    outline-offset: 2px;
  }
`;

export const ClearBtn = styled.button`
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 5px;
  background: none;
  border: 1px solid ${({ theme }) => theme.colorBorder};
  border-radius: ${({ theme }) => theme.borderRadiusSM}px;
  font-size: 12px;
  color: ${({ theme }) => theme.colorTextSecondary};
  cursor: pointer;
  font-family: ${({ theme }) => theme.fontFamily};

  &:hover {
    background: ${({ theme }) => theme.colorFillAlter};
    border-color: ${({ theme }) => theme.colorTextSecondary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colorPrimary};
    outline-offset: 2px;
  }
`;

// ─── Legend ──────────────────────────────────────────────────────────────────

export const LegendWrapper = styled.div`
  margin-top: 8px;
`;

export const LegendItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 11px;
`;

export const LegendColor = styled.div<{ color: string }>`
  width: 16px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
  background: ${({ color }) => color};
`;

// ─── Tooltip ────────────────────────────────────────────────────────────────

export const TooltipWrapper = styled.div<{ x: number; y: number }>`
  position: absolute;
  z-index: 20;
  pointer-events: none;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y}px;
  background: ${({ theme }) => theme.colorBgElevated};
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  padding: 8px 12px;
  font-size: ${({ theme }) => theme.fontSizeSM}px;
  box-shadow: ${({ theme }) => theme.boxShadowSecondary};
  max-width: 220px;
  font-family: ${({ theme }) => theme.fontFamily};
  color: ${({ theme }) => theme.colorText};
`;

export const TooltipName = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`;

export const TooltipValue = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colorTextSecondary};
`;
