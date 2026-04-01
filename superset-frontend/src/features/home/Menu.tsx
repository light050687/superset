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
import { useState, useEffect, useCallback } from 'react';
import { styled, css, useTheme } from '@superset-ui/core';
import { getUrlParam } from 'src/utils/urlUtils';
import { MainNav, MenuItem } from '@superset-ui/core/components/Menu';
import { Menu as AntdMenu } from 'antd';
import {
  Tooltip,
  Grid,
  Row,
  Col,
  Image,
  Drawer,
} from '@superset-ui/core/components';
import { GenericLink } from 'src/components';
import { NavLink, useLocation } from 'react-router-dom';
import { Icons } from '@superset-ui/core/components/Icons';
import { Typography } from '@superset-ui/core/components/Typography';
import { useUiConfig } from 'src/components/UiConfigContext';
import { URL_PARAMS } from 'src/constants';
import {
  MenuObjectChildProps,
  MenuObjectProps,
  MenuData,
} from 'src/types/bootstrapTypes';
import RightMenu from './RightMenu';
import { NAVBAR_MENU_POPUP_OFFSET } from './commonMenuData';

interface MenuProps {
  data: MenuData;
  isFrontendRoute?: (path?: string) => boolean;
}

const StyledHeader = styled.header`
  ${({ theme }) => css`
    background-color: ${theme.colorBgContainer};
    border-bottom: 1px solid ${theme.colorBorderSecondary};
    padding: 0 ${theme.sizeUnit * 2}px;
    z-index: 10;

    &:nth-last-of-type(2) nav {
      margin-bottom: 2px;
    }

    .caret {
      display: none;
    }

    @media (max-width: 768px) {
      padding: 0 ${theme.sizeUnit * 2}px;

      /* Hide Settings submenu on mobile (available in drawer) */
      .submenu-with-caret:last-child {
        display: none;
      }

      /* Hide Development tag on mobile */
      .ant-tag {
        display: none;
      }

      /* Compact right menu */
      .ant-menu-horizontal {
        line-height: normal;
        border-bottom: none;
      }
    }
  `}
`;

const StyledBrandName = styled.span`
  ${({ theme }) => css`
    font-size: 20px;
    font-weight: 700;
    color: ${theme.colorText};
    letter-spacing: 0.5px;
    white-space: nowrap;
  `}
`;

const StyledMainNav = styled(MainNav)`
  ${({ theme }) => css`
    .ant-menu-item .ant-menu-item-icon + span,
    .ant-menu-submenu-title .ant-menu-item-icon + span,
    .ant-menu-item .anticon + span,
    .ant-menu-submenu-title .anticon + span {
      margin-inline-start: 0;
    }

    .ant-menu-submenu.ant-menu-submenu-horizontal {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0;

      .ant-menu-submenu-title {
        display: flex;
        gap: ${theme.sizeUnit * 2}px;
        flex-direction: row-reverse;
        align-items: center;
        height: 100%;
        padding: 0 ${theme.sizeUnit * 4}px;
      }

      &:hover,
      &.ant-menu-submenu-active {
        .ant-menu-title-content {
          color: ${theme.colorPrimary};
        }
      }

      &::after {
        content: '';
        position: absolute;
        width: 98%;
        height: 2px;
        background-color: ${theme.colorPrimaryBorderHover};
        bottom: ${theme.sizeUnit / 8}px;
        left: 1%;
        right: auto;
        inset-inline-start: 1%;
        inset-inline-end: auto;
        transform: scale(0);
        transition: 0.2s all ease-out;
      }

      &:hover::after,
      &.ant-menu-submenu-open::after {
        transform: scale(1);
      }
    }

    .ant-menu-submenu-selected.ant-menu-submenu-horizontal::after {
      transform: scale(1);
    }
  `}
`;

const StyledBrandWrapper = styled.div<{ margin?: string }>`
  ${({ margin }) => css`
    height: ${margin ? 'auto' : '100%'};
    margin: ${margin ?? 0};
  `}
`;

const StyledBrandLink = styled(Typography.Link)`
  ${({ theme }) => css`
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;

    &:focus {
      border-color: transparent;
    }

    &:focus-visible {
      border-color: ${theme.colorPrimaryText};
    }
  `}
`;

const StyledRow = styled(Row)`
  height: 100%;

  @media (max-width: 768px) {
    flex-wrap: nowrap !important;
    align-items: center;
  }
`;

const StyledCol = styled(Col)`
  ${({ theme }) => css`
    display: flex;
    gap: ${theme.sizeUnit * 2}px;

    @media (max-width: 768px) {
      flex: 0 0 auto !important;
      max-width: none !important;
      width: auto !important;
    }
  `}
`;

const StyledRightCol = styled(Col)`
  ${({ theme }) => css`
    @media (max-width: 768px) {
      flex: 1 1 auto !important;
      max-width: none !important;
      width: auto !important;
      display: flex !important;
      align-items: center;
      justify-content: flex-end;
      gap: ${theme.sizeUnit}px;
    }
  `}
`;

const HamburgerButton = styled.button`
  ${({ theme }) => css`
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: ${theme.sizeUnit}px;
    margin-left: auto;
    color: ${theme.colorText};
    font-size: 20px;
    line-height: 1;
    align-items: center;
    justify-content: center;

    @media (max-width: 768px) {
      display: flex;
    }

    &:hover {
      color: ${theme.colorPrimary};
    }
  `}
`;

const drawerMenuStyles = css`
  &.ant-menu {
    border-inline-end: none !important;
  }

  .ant-menu-item {
    height: 48px;
    line-height: 48px;
    font-size: 15px;
  }

  .ant-menu-submenu-title {
    height: 48px;
    line-height: 48px;
    font-size: 15px;
  }
`;

const StyledImage = styled(Image)`
  object-fit: contain;
`;

const { useBreakpoint } = Grid;

export function Menu({
  data: {
    menu,
    brand,
    navbar_right: navbarRight,
    settings,
    environment_tag: environmentTag,
  },
  isFrontendRoute = () => false,
}: MenuProps) {
  const screens = useBreakpoint();
  const uiConfig = useUiConfig();
  const theme = useTheme();

  enum Paths {
    Explore = '/explore',
    Dashboard = '/dashboard',
    Chart = '/chart',
    Datasets = '/tablemodelview',
    SqlLab = '/sqllab',
    SavedQueries = '/savedqueryview',
  }

  const defaultTabSelection: string[] = [];
  const [activeTabs, setActiveTabs] = useState(defaultTabSelection);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const isMobile = !screens.md;

  // Close drawer on navigation
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  useEffect(() => {
    const path = location.pathname;
    switch (true) {
      case path.startsWith(Paths.Dashboard):
        setActiveTabs(['Dashboards']);
        break;
      case path.startsWith(Paths.Chart) || path.startsWith(Paths.Explore):
        setActiveTabs(['Charts']);
        break;
      case path.startsWith(Paths.Datasets):
        setActiveTabs(['Datasets']);
        break;
      case path.startsWith(Paths.SqlLab) || path.startsWith(Paths.SavedQueries):
        setActiveTabs(['SQL']);
        break;
      default:
        setActiveTabs(defaultTabSelection);
    }
  }, [location.pathname]);

  const standalone = getUrlParam(URL_PARAMS.standalone);
  if (standalone || uiConfig.hideNav) return <></>;

  const buildMenuItem = ({
    label,
    childs,
    url,
    isFrontendRoute,
  }: MenuObjectProps): MenuItem => {
    if (url && isFrontendRoute) {
      return {
        key: label,
        label: (
          <NavLink role="button" to={url} activeClassName="is-active">
            {label}
          </NavLink>
        ),
      };
    }

    if (url) {
      return {
        key: label,
        label: <Typography.Link href={url}>{label}</Typography.Link>,
      };
    }

    const childItems: MenuItem[] = [];
    childs?.forEach((child: MenuObjectChildProps | string, index1: number) => {
      if (typeof child === 'string' && child === '-' && label !== 'Data') {
        childItems.push({ type: 'divider', key: `divider-${index1}` });
      } else if (typeof child !== 'string') {
        childItems.push({
          key: `${child.label}`,
          label: child.isFrontendRoute ? (
            <NavLink to={child.url || ''} exact activeClassName="is-active">
              {child.label}
            </NavLink>
          ) : (
            <Typography.Link href={child.url}>{child.label}</Typography.Link>
          ),
        });
      }
    });

    return {
      key: label,
      label,
      icon: <Icons.DownOutlined iconSize="xs" />,
      popupOffset: NAVBAR_MENU_POPUP_OFFSET,
      children: childItems,
    };
  };
  const renderBrand = () => {
    const brandLabel = brand.text || brand.alt || 'МРТС';
    // If brand.text is set via LOGO_RIGHT_TEXT config, show text instead of logo image
    if (brand.text) {
      const brandContent = <StyledBrandName>{brandLabel}</StyledBrandName>;
      return (
        <>
          {isFrontendRoute(window.location.pathname) ? (
            <GenericLink className="navbar-brand" to={brand.path}>
              {brandContent}
            </GenericLink>
          ) : (
            <Typography.Link
              className="navbar-brand"
              href={brand.path}
              tabIndex={-1}
            >
              {brandContent}
            </Typography.Link>
          )}
        </>
      );
    }

    // Default: render logo image
    let link;
    if (theme.brandLogoUrl) {
      link = (
        <StyledBrandWrapper margin={theme.brandLogoMargin}>
          <StyledBrandLink href={theme.brandLogoHref}>
            <StyledImage
              preview={false}
              src={theme.brandLogoUrl}
              alt={theme.brandLogoAlt || 'Apache Superset'}
              height={theme.brandLogoHeight}
            />
          </StyledBrandLink>
        </StyledBrandWrapper>
      );
    } else if (isFrontendRoute(window.location.pathname)) {
      link = (
        <GenericLink className="navbar-brand" to={brand.path}>
          <StyledImage preview={false} src={brand.icon} alt={brand.alt} />
        </GenericLink>
      );
    } else {
      link = (
        <Typography.Link
          className="navbar-brand"
          href={brand.path}
          tabIndex={-1}
        >
          <StyledImage preview={false} src={brand.icon} alt={brand.alt} />
        </Typography.Link>
      );
    }
    return <>{link}</>;
  };
  const menuItems = menu.map(item => {
    const props = {
      ...item,
      isFrontendRoute: isFrontendRoute(item.url),
      childs: item.childs?.map(c => {
        if (typeof c === 'string') {
          return c;
        }
        return {
          ...c,
          isFrontendRoute: isFrontendRoute(c.url),
        };
      }),
    };
    return buildMenuItem(props);
  });

  // Build drawer items: main menu + settings (vertical)
  const drawerMenuItems = [
    ...menuItems,
    ...(settings || []).map(item => {
      const props = {
        ...item,
        isFrontendRoute: isFrontendRoute(item.url),
        childs: item.childs?.map(c => {
          if (typeof c === 'string') {
            return c;
          }
          return {
            ...c,
            isFrontendRoute: isFrontendRoute(c.url),
          };
        }),
      };
      return buildMenuItem(props);
    }),
  ];

  return (
    <StyledHeader className="top" id="main-menu" role="navigation">
      <StyledRow>
        <StyledCol md={16} xs={24}>
          <Tooltip
            id="brand-tooltip"
            placement="bottomLeft"
            title={brand.tooltip}
            arrow={{ pointAtCenter: true }}
          >
            {renderBrand()}
          </Tooltip>
          {/* brand.text is now rendered inside renderBrand() as StyledBrandName */}
          {!isMobile && (
            <StyledMainNav
              mode="horizontal"
              data-test="navbar-top"
              className="main-nav"
              selectedKeys={activeTabs}
              disabledOverflow
              items={menuItems}
            />
          )}
        </StyledCol>
        <StyledRightCol md={8} xs={24}>
          <RightMenu
            align={screens.md ? 'flex-end' : 'flex-start'}
            settings={settings}
            navbarRight={navbarRight}
            isFrontendRoute={isFrontendRoute}
            environmentTag={environmentTag}
          />
          {isMobile && (
            <HamburgerButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Icons.MenuOutlined />
            </HamburgerButton>
          )}
        </StyledRightCol>
      </StyledRow>
      {isMobile && (
        <Drawer
          title={brand.alt || 'Menu'}
          placement="top"
          onClose={closeDrawer}
          open={drawerOpen}
          height="100%"
          styles={{ body: { padding: 0 } }}
        >
          <AntdMenu
            css={drawerMenuStyles}
            mode="inline"
            selectedKeys={activeTabs}
            onClick={closeDrawer}
            items={drawerMenuItems}
          />
        </Drawer>
      )}
    </StyledHeader>
  );
}

// transform the menu data to reorganize components
export default function MenuWrapper({ data, ...rest }: MenuProps) {
  const newMenuData = {
    ...data,
  };
  // Menu items that should go into settings dropdown
  const settingsMenus = {
    Data: true,
    Security: true,
    Manage: true,
  };

  // Cycle through menu.menu to build out cleanedMenu and settings
  const cleanedMenu: MenuObjectProps[] = [];
  const settings: MenuObjectProps[] = [];
  newMenuData.menu.forEach((item: any) => {
    if (!item) {
      return;
    }

    const children: (MenuObjectProps | string)[] = [];
    const newItem = {
      ...item,
    };

    // Filter childs
    if (item.childs) {
      item.childs.forEach((child: MenuObjectChildProps | string) => {
        if (typeof child === 'string') {
          children.push(child);
        } else if ((child as MenuObjectChildProps).label) {
          children.push(child);
        }
      });

      newItem.childs = children;
    }

    if (!settingsMenus.hasOwnProperty(item.name)) {
      cleanedMenu.push(newItem);
    } else {
      settings.push(newItem);
    }
  });

  newMenuData.menu = cleanedMenu;
  newMenuData.settings = settings;

  return <Menu data={newMenuData} {...rest} />;
}
