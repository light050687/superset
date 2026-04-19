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
 */
import { useRef } from 'react';
import { fireEvent, render, screen } from 'spec/helpers/testing-library';
import type {
  BootstrapUser,
  MenuData,
} from 'src/types/bootstrapTypes';
import { SettingsDropdown } from './SettingsDropdown';

const makeMenu = (): MenuData => ({
  menu: [],
  brand: {
    path: '/',
    icon: '',
    alt: '',
    tooltip: '',
    text: '',
  },
  navbar_right: {
    show_watermark: false,
    languages: {
      en: { flag: 'us', name: 'English', url: '/lang/en' },
      ru: { flag: 'ru', name: 'Русский', url: '/lang/ru' },
    },
    show_language_picker: true,
    user_is_anonymous: false,
    user_info_url: '/userinfoview/userinfo/',
    user_login_url: '/login/',
    user_logout_url: '/logout/',
    locale: 'ru',
  },
  settings: [
    {
      label: 'Безопасность',
      name: 'security',
      isHeader: true,
      childs: [
        { label: 'Пользователи', url: '/users/list/' },
        { label: 'Роли', url: '/roles/list/' },
      ],
    },
    {
      label: 'Данные',
      name: 'data',
      isHeader: true,
      childs: [
        { label: 'Датасеты', url: '/tablemodelview/list/' },
      ],
    },
  ],
  environment_tag: { text: '', color: '' },
});

const makeUser = (): BootstrapUser => ({
  username: 'alpha',
  firstName: 'Алексей',
  lastName: 'Петров',
  createdOn: '2016-11-11T12:34:17',
  userId: 5,
  email: 'alpha@samberi.com',
  isActive: true,
  isAnonymous: false,
  permissions: {},
  roles: {},
});

const Harness: React.FC<{ open: boolean; onClose?: () => void }> = ({
  open,
  onClose = () => {},
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={ref} type="button" data-test="anchor-btn">
        Settings
      </button>
      <SettingsDropdown
        anchor={ref.current}
        open={open}
        onClose={onClose}
        user={makeUser()}
        menu={makeMenu()}
      />
    </>
  );
};

describe('<SettingsDropdown>', () => {
  it('не рендерится когда open=false', () => {
    render(<Harness open={false} />, { useRouter: true, useTheme: true });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('рендерит секции и плитки из menu_data.settings', () => {
    render(<Harness open />, { useRouter: true, useTheme: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Безопасность')).toBeInTheDocument();
    expect(screen.getByText('Пользователи')).toBeInTheDocument();
    expect(screen.getByText('Роли')).toBeInTheDocument();
    expect(screen.getByText('Данные')).toBeInTheDocument();
    expect(screen.getByText('Датасеты')).toBeInTheDocument();
  });

  it('показывает карточку пользователя с именем и email', () => {
    render(<Harness open />, { useRouter: true, useTheme: true });
    expect(screen.getByText('Алексей Петров')).toBeInTheDocument();
    expect(screen.getByText('alpha@samberi.com')).toBeInTheDocument();
  });

  it('показывает селектор языка если show_language_picker=true и языков > 1', () => {
    render(<Harness open />, { useRouter: true, useTheme: true });
    expect(screen.getByLabelText('Язык интерфейса')).toBeInTheDocument();
  });

  it('показывает выход и ссылку на профиль', () => {
    render(<Harness open />, { useRouter: true, useTheme: true });
    expect(screen.getByText('Личные данные')).toBeInTheDocument();
    expect(screen.getByText('Выход')).toBeInTheDocument();
  });

  it('Escape закрывает dropdown через onClose', () => {
    const onClose = jest.fn();
    render(<Harness open onClose={onClose} />, {
      useRouter: true,
      useTheme: true,
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('показывает переключатель темы в секции Вид', () => {
    render(<Harness open />, { useRouter: true, useTheme: true });
    expect(screen.getByLabelText('Переключить тему')).toBeInTheDocument();
  });
});
