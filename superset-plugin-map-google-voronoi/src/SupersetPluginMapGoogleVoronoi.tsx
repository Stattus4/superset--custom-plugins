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

import React, { useState, useMemo, useCallback } from 'react';
import { DataPoint, SupersetPluginMapGoogleVoronoiProps, SupersetPluginMapGoogleVoronoiStylesProps } from './types';
import { GoogleMap, LoadScript, Marker, InfoWindow, Polygon, MarkerClusterer } from '@react-google-maps/api';
import { styled, SupersetTheme } from '@superset-ui/core';
import * as turf from "@turf/turf";
import { StyleMap } from './utils/StyleMap';
import { calculateCenter, formatToGeoJSON, getRandomColor, organizeData, standardizePoint } from './utils/extractPointsAndGeoFromBd';
import m1 from './images/m1_.png';
import m2 from './images/m2_.png';
import m3 from './images/m3_.png';

const Styles = styled.div<SupersetPluginMapGoogleVoronoiStylesProps>`
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

function createMarkerIconNew(id: string, text1: string, text2: string, color: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    console.error('Erro ao obter contexto 2D do canvas.');
    return '';
  }

  const size = 42;
  const idHeight = 15;
  const totalHeight = size + idHeight;

  canvas.width = size;
  canvas.height = totalHeight;


  context.fillStyle = '#000';
  context.font = 'bold 12px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(id, size / 2, idHeight / 2);

  context.beginPath();
  context.arc(size / 2, idHeight + size / 2, size / 2, 0, 2 * Math.PI, false);
  context.fillStyle = color;
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = '#000';
  context.stroke();

  context.fillStyle = '#ffffff';
  context.font = '9px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const textY = idHeight + size / 2;
  context.fillText(`CH: ${text1}`, size / 2, textY - 6);
  context.fillText(`P: ${text2}`, size / 2, textY + 6);

  return canvas.toDataURL('image/png');
}


export default function SupersetPluginMapGoogleVoronoi(props: SupersetPluginMapGoogleVoronoiProps) {
  const { height, width, boldText, headerFontSize, data } = props;
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

  const standardizedData = useMemo(() => data.map(standardizePoint).filter(point => point.LAT !== null && point.LON !== null), [data]);
  const center = useMemo(() => calculateCenter(standardizedData), [standardizedData]);

  const { positionsBySector, delimitationsBySector } = organizeData(data);
  const pointsSector = Object.values(positionsBySector);
  const coordinates = useMemo(() => [Object.keys(delimitationsBySector).map(key => {
    let coords = delimitationsBySector[key];
    return [...coords, coords[0]];
  })], [delimitationsBySector]);

  const showPolygon = useMemo(() => {
    return coordinates.map((coords, index) => {
      return coords.map((coordSet, indexCoord) => {
        const polygon = turf.polygon([coordSet]);
        const options = {
          bbox: turf.bbox(polygon),
        };

        const geoJSONData = formatToGeoJSON(pointsSector);
        const voronoiPolygons = turf.voronoi(geoJSONData[indexCoord], options);
        voronoiPolygons.features.push(polygon);
        voronoiPolygons.features.forEach(voronoiPolygon => {
          if (!voronoiPolygon.properties) {
            voronoiPolygon.properties = {};
          }
          voronoiPolygon.properties.color = getRandomColor();
        });

        const clippedVoronoi = voronoiPolygons.features
          .map(voronoiPolygon => {
            const intersection = turf.intersect(
              turf.featureCollection([voronoiPolygon, polygon])
            );

            if (intersection) {
              intersection.properties = intersection.properties || {};
              intersection.properties.color = voronoiPolygon.properties?.color;
            }
            return intersection;
          })
          .filter(polygon => polygon !== null);

        const clippedVoronoiaux = turf.featureCollection(clippedVoronoi);
        const clippedVoronoiParsed = turf.flatten(clippedVoronoiaux);

        return clippedVoronoiParsed.features.map((feature, index) => {
          // Ensure feature.properties is not null
          const properties = feature.properties || {};
          const paths = feature.geometry.coordinates[0].map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));

          return (
            <Polygon
              key={index}
              paths={paths}
              options={{
                fillColor: properties.color ? `rgba(${properties.color.join(',')})` : 'rgba(0,0,0,0.5)', // Default color if properties.color is undefined
                strokeColor: 'black',
                strokeOpacity: 0.5,
                strokeWeight: 1,
              }}
            />
          );
        });
      });
    }).flat();
  }, [coordinates, pointsSector]);

  const markerIcons = useMemo(() => {
    return standardizedData.map(point => ({
      point,
      icon: createMarkerIconNew(point.device_id.slice(-4), 'Test', `${point.alt}`, '#000')
    }));
  }, [standardizedData]);

  const handleMarkerClick = useCallback((point: DataPoint) => {
    setSelectedPoint(point);
  }, []);

  const infoWindowContent = useMemo(() => {
    if (!selectedPoint) return null;

    return (
      <InfoWindow
        position={{ lat: selectedPoint.LAT, lng: selectedPoint.LON }}
        onCloseClick={() => setSelectedPoint(null)}
      >
        <div>
          <div style={{ textAlign: 'left', marginBottom: 10 }}>
            <p><strong>Dispositivo:</strong> {selectedPoint.device_id}</p>
            <p><strong>Altitude:</strong> {selectedPoint.alt} metros.</p>
            <p><strong>Nome do setor:</strong> {selectedPoint.name_sector}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <a href={`https://4fluid-iot-comissionamento.s3.sa-east-1.amazonaws.com/${selectedPoint.set_image}`} target="_blank" rel="noopener noreferrer">
                <img src={`https://4fluid-iot-comissionamento.s3.sa-east-1.amazonaws.com/${selectedPoint.set_image}`} alt="Foto do conjunto" style={{ width: '70px', height: '70px', borderRadius: 5 }} />
              </a>
              <div style={{ marginTop: 10 }}>Foto do conjunto</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <a href={`https://4fluid-iot-comissionamento.s3.sa-east-1.amazonaws.com/${selectedPoint.device_image}`} target="_blank" rel="noopener noreferrer">
                <img src={`https://4fluid-iot-comissionamento.s3.sa-east-1.amazonaws.com/${selectedPoint.device_image}`} alt="Foto do dispositivo" style={{ width: '70px', height: '70px', borderRadius: 5 }} />
              </a>
              <div style={{ marginTop: 10 }}>Foto do dispositivo</div>
            </div>
          </div>
        </div>
      </InfoWindow>
    );
  }, [selectedPoint]);

  return (
    <Styles
      boldText={boldText}
      headerFontSize={headerFontSize}
      height={height}
      width={width}
    >
      <LoadScript googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY || ''}>
        <GoogleMap
          mapContainerStyle={{ width: width - 15, height: height - 15 }}
          center={center}
          zoom={12}
          options={{ styles: StyleMap }}
        >
          <MarkerClusterer
            gridSize={60}
            options={{
              imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
              styles: [{
                textColor: 'black',
                url: m1,
                height: 53,
                width: 53
              }, {
                textColor: 'black',
                url: m2,
                height: 56,
                width: 56
              }, {
                textColor: 'white',
                url: m3,
                height: 66,
                width: 66
              }]
            }}
          >
            {(clusterer) =>
              markerIcons.map(({ point, icon }, index) => (
                <Marker
                  key={index}
                  position={{ lat: point.LAT, lng: point.LON }}
                  icon={icon}
                  onClick={() => handleMarkerClick(point)}
                  clusterer={clusterer}
                />
              ))
            }
          </MarkerClusterer>
          {showPolygon}
          {infoWindowContent}
        </GoogleMap>
      </LoadScript>
    </Styles>
  );
}
