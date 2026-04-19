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
import { nanoid } from 'nanoid';
import { t } from '@superset-ui/core';
import { PAGE_TYPE } from './componentTypes';

interface LayoutItem {
  type: string;
  id: string;
  children: string[];
  parents: string[];
  meta: Record<string, unknown>;
}

type Layout = Record<string, LayoutItem>;

interface CloneResult {
  rootId: string;
  entities: Record<string, LayoutItem>;
}

/**
 * Recursively clones a component tree starting from sourceId.
 * Generates new IDs for all components, remaps children/parents.
 * For CHART components: keeps the same chartId (shallow copy).
 */
export default function cloneComponentTree(
  sourceId: string,
  layout: Layout,
): CloneResult {
  const oldToNewId: Record<string, string> = {};
  const entities: Record<string, LayoutItem> = {};

  // BFS pass 1: collect all IDs and generate new ones
  const queue = [sourceId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const component = layout[currentId];
    if (!component) continue;

    const newId = `${component.type}-${nanoid()}`;
    oldToNewId[currentId] = newId;
    (component.children || []).forEach(childId => queue.push(childId));
  }

  // Pass 2: clone components with remapped IDs
  for (const [oldId, newId] of Object.entries(oldToNewId)) {
    const original = layout[oldId];
    if (!original) continue;

    const clonedMeta = { ...original.meta };

    if (original.type === PAGE_TYPE && typeof clonedMeta.text === 'string') {
      clonedMeta.text = clonedMeta.text
        ? `${clonedMeta.text} ${t('(копия)')}`
        : t('(копия)');
    }

    entities[newId] = {
      type: original.type,
      id: newId,
      children: (original.children || []).map(
        childId => oldToNewId[childId] || childId,
      ),
      parents: (original.parents || []).map(
        parentId => oldToNewId[parentId] || parentId,
      ),
      meta: clonedMeta,
    };
  }

  return { rootId: oldToNewId[sourceId], entities };
}
