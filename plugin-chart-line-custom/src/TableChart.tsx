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

import {
  TableChartTransformedProps, DataType, CustomStylesProps, DataRecord
} from './types';



import React, { useEffect, useState, useRef } from 'react';
import { styled, SupersetTheme } from '@superset-ui/core';


import * as echarts from 'echarts';

const Styles = styled.div<CustomStylesProps>`
  padding: ${({ theme }: { theme: SupersetTheme }) => theme.gridUnit * 2}px;
  border-radius: ${({ theme }: { theme: SupersetTheme }) => theme.gridUnit * 2}px;
  height: ${({ height }: { height: number }) => height}px;
  width: ${({ width }: { width: number }) => width}px;

  h3 {
    margin-top: 0;
    margin-bottom: ${({ theme }: { theme: SupersetTheme }) => theme.gridUnit * 3}px;
    font-weight: ${({ theme, boldText }: { theme: SupersetTheme, boldText: boolean }) => theme.typography.weights[boldText ? 'bold' : 'normal']};
  }
  }
`;


export default function TableChart(props: TableChartTransformedProps) {
  const { data, height, width } = props;

  const chartRef = useRef<HTMLDivElement | null>(null);
  const [sortedData, setSortedData] = useState<DataRecord[]>([]);

  useEffect(() => {
    const sorted = [...data].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setSortedData(sorted);
  }, [data]);

  useEffect(() => {
    if (sortedData.length === 0 || !chartRef.current) return;

    const chartInstance = echarts.init(chartRef.current);

    const groupedData = sortedData.reduce((acc: any, item: DataType) => {
      if (!acc[item.device_id]) {
        acc[item.device_id] = [];
      }
      acc[item.device_id].push(item);
      return acc;
    }, {});

    const deviceTimestamps = Object.entries(groupedData).map(([device_id, records]) => ({
      device_id,
      count: records.length
    }));

    deviceTimestamps.sort((a, b) => b.count - a.count);

    const deviceIds = deviceTimestamps.slice(0, 5).map(device => device.device_id);

    const series = deviceIds.map(device_id => ({
      name: device_id,
      type: 'line',
      data: groupedData[device_id].map((item: DataType) => ({
        value: item.single_value,
        date: item.timestamp
      })),
    }));


    const options = {
      tooltip: {
        trigger: 'item',
        formatter: function (params: any) {
          const date = new Date(params.data.date);
          const formattedDate = date.toLocaleDateString('pt-BR');
          const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return `${params.marker}Dispositivo: ${params.seriesName}<br/>Data: ${formattedDate}<br/>Horário: ${formattedTime}<br/>Valor: ${params.data.value}`;
        }
      },
      legend: {
        data: deviceIds,
      },
      xAxis: {
        type: 'category',
        data: groupedData[deviceIds[0]].map((i: any) => i.timestamp.toLocaleDateString('pt-BR'))
      },
      yAxis: {
        type: 'value',
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 100
        }
      ],
      series: series,
    };

    chartInstance.setOption(options);

    return () => {
      chartInstance.dispose();
    };
  }, [sortedData, height, width]);

  return (
    <Styles
      ref={chartRef}
      height={height}
      width={width}
      boldText={true}
      headerFontSize={"m"}
    >
      <div ref={chartRef} style={{ height: height, width: width }}></div>
    </Styles>
  );
}