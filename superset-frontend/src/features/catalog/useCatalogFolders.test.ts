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
import { buildCatalogTree } from './useCatalogFolders';
import type { CatalogFolderNode } from './types';

const node = (
  id: number,
  parent: number | null,
  name: string,
  position = 0,
): CatalogFolderNode => ({
  id,
  parent_id: parent,
  name,
  description: null,
  color: null,
  position,
  item_count: 0,
});

describe('buildCatalogTree', () => {
  it('возвращает пустой массив для пустого входа', () => {
    expect(buildCatalogTree([])).toEqual([]);
  });

  it('строит одноуровневое дерево', () => {
    const flat = [node(1, null, 'A'), node(2, null, 'B')];
    const tree = buildCatalogTree(flat);
    expect(tree).toHaveLength(2);
    expect(tree[0].children).toEqual([]);
    expect(tree[1].children).toEqual([]);
  });

  it('вкладывает детей в родителей', () => {
    const flat = [
      node(1, null, 'Коммерция'),
      node(2, 1, 'Маржа'),
      node(3, 1, 'Товарооборот'),
      node(4, 2, 'Мясо'),
    ];
    const [root] = buildCatalogTree(flat);
    expect(root.name).toBe('Коммерция');
    expect(root.children).toHaveLength(2);
    const [marja, turnover] = root.children;
    expect(marja.name).toBe('Маржа');
    expect(turnover.name).toBe('Товарооборот');
    expect(marja.children).toHaveLength(1);
    expect(marja.children[0].name).toBe('Мясо');
  });

  it('сортирует детей по position, затем по id', () => {
    const flat = [
      node(1, null, 'Root'),
      node(4, 1, 'D', 2),
      node(2, 1, 'B', 1),
      node(3, 1, 'C', 1),
      node(5, 1, 'E', 0),
    ];
    const [root] = buildCatalogTree(flat);
    expect(root.children.map(c => c.name)).toEqual(['E', 'B', 'C', 'D']);
  });

  it('сироты с несуществующим parent_id игнорируются (не в корне)', () => {
    const flat = [
      node(1, null, 'A'),
      node(99, 777, 'сирота'),
    ];
    const tree = buildCatalogTree(flat);
    // Только A в корне; сирота не попадает в корень.
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('A');
  });
});
