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

const keiAPiGoogle = 'AIzaSyBkF2eLJeDHk3H15Za2d1WUnl9tU7g0Zp0';


import React, { useState, useMemo } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { SupersetPluginChartVilleProps, SupersetPluginChartVilleStylesProps } from './types';
import { styled, SupersetTheme } from '@superset-ui/core';
import { StyleMap } from './utils/StyleMap';

interface RawDataPoint {
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
}

interface DataPoint {
  LAT: number;
  LON: number;
  count: number;
  set_image: string;
  device_image: string;
  alt: number;
  device_id: string;
}

const Styles = styled.div<SupersetPluginChartVilleStylesProps>`
  background-color: ${({ theme }: { theme: SupersetTheme }) => theme.colors.secondary.light2};
  padding: ${({ theme }: { theme: SupersetTheme }) => theme.gridUnit * 2}px;
  border-radius: ${({ theme }: { theme: SupersetTheme }) => theme.gridUnit * 2}px;
  height: ${({ height }: { height: number }) => height}px;
  width: ${({ width }: { width: number }) => width}px;

  h3 {
    margin-top: 0;
    margin-bottom: ${({ theme }: { theme: SupersetTheme }) => theme.gridUnit * 3}px;
    font-size: ${({ theme, headerFontSize }: { theme: SupersetTheme, headerFontSize: string }) => theme.typography.sizes[headerFontSize]}px;
    font-weight: ${({ theme, boldText }: { theme: SupersetTheme, boldText: boolean }) => theme.typography.weights[boldText ? 'bold' : 'normal']};
  }

  pre {
    height: ${({ theme, headerFontSize, height }: { theme: SupersetTheme, headerFontSize: string, height: number }) => (
    height - theme.gridUnit * 12 - theme.typography.sizes[headerFontSize]
  )}px;
  }
`;

const standardizePoint = (point: RawDataPoint): DataPoint => {
  const lat = point.LAT || point.lat || point.Lat;
  const lon = point.LON || point.lon || point.Lon || point.LONG || point.long || point.Long || point.LNG || point.Lng || point.lng;
  return {
    LAT: lat !== undefined ? Number(lat) : 0, // Default to 0 if undefined
    LON: lon !== undefined ? Number(lon) : 0, // Default to 0 if undefined
    count: point.count || 0,
    set_image: point.set_image || 'none',
    device_image: point.device_image || 'none',
    alt: point.alt || 0,
    device_id: point.device_id || 'none',
  };
};

const calculateCenter = (data: DataPoint[]) => {
  if (!data || data.length === 0) {
    return { lat: -3.745, lng: -38.523 }; // Default center
  }
  const latitudes = data.map(point => point.LAT);
  const longitudes = data.map(point => point.LON);
  const averageLat = latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length;
  const averageLng = longitudes.reduce((sum, lng) => sum + lng, 0) / longitudes.length;
  return { lat: averageLat, lng: averageLng };
};

export default function SupersetPluginMapGoogle(props: SupersetPluginChartVilleProps) {
  const { height, width, boldText, headerFontSize, data } = props;
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

  const standardizedData = useMemo(() => data.map(standardizePoint).filter(point => point.LAT !== null && point.LON !== null), [data]);
  const center = useMemo(() => calculateCenter(standardizedData), [standardizedData]);

  return (
    <Styles
      boldText={boldText}
      headerFontSize={headerFontSize}
      height={height}
      width={width}
    >
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || keiAPiGoogle}>
        <GoogleMap
          mapContainerStyle={{ width: width - 15, height: height - 15 }}
          center={center}
          zoom={12}
          options={{styles: StyleMap}}
        >
          {standardizedData.map((point, index) => (
            <Marker
              key={index}
              position={{ lat: point.LAT, lng: point.LON }}
              onClick={() => setSelectedPoint(point)}
            />
          ))}
          {selectedPoint && (
            <InfoWindow
              position={{ lat: selectedPoint.LAT, lng: selectedPoint.LON }}
              onCloseClick={() => setSelectedPoint(null)}
            >
              <div>
                <div style={{ textAlign: 'left', marginBottom: 10 }}>
                  <p><strong>Dispositivo:</strong> {selectedPoint.device_id}</p>
                  <p><strong>Altitude:</strong> {selectedPoint.alt} metros.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ textAlign: 'center' }}>
                    <a href={`https://4fluid-iot-comissionamento.s3.sa-east-1.amazonaws.com/${selectedPoint.set_image}`} target="_blank" rel="noopener noreferrer">
                      <img src={`https://4fluid-iot-comissionamento.s3.sa-east-1.amazonaws.com/${selectedPoint.set_image}`} alt="Foto do conjunto" style={{ width: '70px', height: '70px', borderRadius: 5 }} />
                    </a>
                    <div style={{marginTop: 10}}>Foto do conjunto</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <a href={`https://4fluid-iot-comissionamento.s3.sa-east-1.amazonaws.com/${selectedPoint.device_image}`} target="_blank" rel="noopener noreferrer">
                      <img src={`https://4fluid-iot-comissionamento.s3.sa-east-1.amazonaws.com/${selectedPoint.device_image}`} alt="Foto do dispositivo" style={{ width: '70px', height: '70px', borderRadius: 5 }} />
                    </a>
                    <div style={{marginTop: 10}}>Foto do dispositivo</div>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </Styles>
  );
}
