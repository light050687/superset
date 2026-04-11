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
import { FC } from 'react';
import { styled } from '@superset-ui/core';

const GeoMapContainer = styled.div`
  width: 100%;
  height: calc(100vh - 56px);
  overflow: hidden;
`;

const GeoMapIframe = styled.iframe`
  border: none;
  width: 100%;
  height: 100%;
`;

const GeoMap: FC = () => {
  // Proxy through Superset nginx to avoid cross-origin iframe blocking.
  // /geo-tiles/ proxies to the geo-tiles tileserver nginx on port 8082.
  const mapUrl = '/geo-tiles/map/';

  return (
    <GeoMapContainer>
      <GeoMapIframe
        src={mapUrl}
        title="Geo Map"
        allow="geolocation"
        loading="lazy"
      />
    </GeoMapContainer>
  );
};

export default GeoMap;
