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
import { QueryFormData, supersetTheme, TimeseriesDataRecord } from '@superset-ui/core';

export interface SupersetPluginMapGoogleVoronoiStylesProps {
  height: number;
  width: number;
  headerFontSize: keyof typeof supersetTheme.typography.sizes;
  boldText: boolean;
}

interface SupersetPluginMapGoogleVoronoiCustomizeProps {
  headerText: string;
}

export type SupersetPluginMapGoogleVoronoiQueryFormData = QueryFormData &
  SupersetPluginMapGoogleVoronoiStylesProps &
  SupersetPluginMapGoogleVoronoiCustomizeProps;

export type SupersetPluginMapGoogleVoronoiProps = SupersetPluginMapGoogleVoronoiStylesProps &
  SupersetPluginMapGoogleVoronoiCustomizeProps & {
    data: TimeseriesDataRecord[];
    // add typing here for the props you pass in from transformProps.ts!
  };

export interface RawDataPoint {
  LAT?: number;
  lat?: number;
  Lat?: number;
  LON?: number;
  lon?: number;
  Lon?: number;
  LONG?: number;
  long?: number;
  Long?: number;
  LNG?: number;
  Lng?: number;
  lng?: number;
  count?: number;
  set_image?: string;
  device_id?: string;
  device_image?: string;
  alt?: number;
  name_sector?: string;
  sectorGeoDelimitation?: any;
}

export interface DataPoint {
  LAT: number;
  LON: number;
  count: number;
  set_image: string;
  device_image: string;
  alt: number;
  device_id: string;
  name_sector: string;
  sectorGeoDelimitation: any;
}

