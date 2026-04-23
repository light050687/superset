/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * DrawerFooterActionsPortal — перемещает Apply/Reset-блок FilterBar'а
 * из scrollable drawer-body в sticky footer-slot drawer'а (id
 * DRAWER_FOOTER_SLOT_ID). Это решает сразу два UX-бага в kanban-
 * режиме:
 *   • кнопки не ездят со scroll'ом и не перекрывают scrollbar — они
 *     в отдельной области drawer'а снизу;
 *   • никакое обрезание низа контента: scroll-область заканчивается
 *     выше footer'а естественным образом (flex:1 vs flex-shrink:0).
 */
import { type FC, type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DRAWER_FOOTER_SLOT_ID } from 'src/views/components/Shell/Drawer';

interface Props {
  children: ReactNode;
}

export const DrawerFooterActionsPortal: FC<Props> = ({ children }) => {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setMount(document.getElementById(DRAWER_FOOTER_SLOT_ID));
  }, []);
  if (!mount) return null;
  return createPortal(children, mount);
};

export default DrawerFooterActionsPortal;
