import * as turf from "@turf/turf";

interface Coordinates {
    long: number;
    lat: number;
}

interface DataItem {
    long: number;
    lat: number;
    alt: number;
    device_id: string;
    name_sector: string;
    sectorGeoDelimitation: Coordinates[];
    count: number;
}


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
    name_sector?: string;
    sectorGeoDelimitation?: any;
  }
  
  interface DataPoint {
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

//   const colorsIsolines = [
//     'rgb(124, 0, 152)',
//     'rgb(170, 0, 0)',
//     'rgb(234, 47, 58)',
//     'rgb(196, 87, 23)',
//     'rgb(255, 140, 0)',
//     'rgb(255, 189, 14)',
//     'rgb(255, 255, 0)',
//     'rgb(155, 165, 0)',
//     'rgba(25, 150, 100, 194)',
//     'rgb(0, 255, 0)'
//   ];  

export function organizeData(data: DataItem[]) {
    let positionsBySector: { [key: string]: number[][] } = {};
    let delimitationsBySector: { [key: string]: number[][] } = {};
    data.forEach((item) => {
        let nameSector = item.name_sector;
        let position = [item.long, item.lat];
        let delimitationStr = item.sectorGeoDelimitation;

        let delimitation = JSON.parse(delimitationStr) as Coordinates[];
        let coordinates = delimitation.map((coord) => [coord.long, coord.lat]);

        if (!positionsBySector[nameSector]) {
            positionsBySector[nameSector] = [];
        }
        if (!delimitationsBySector[nameSector]) {
            delimitationsBySector[nameSector] = coordinates;
        }

        positionsBySector[nameSector].push(position);
    });

    return { positionsBySector, delimitationsBySector };
}


export const standardizePoint = (point: RawDataPoint): DataPoint => {
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
      name_sector: point.name_sector || 'none',
      sectorGeoDelimitation: point.sectorGeoDelimitation || {},
    };
  };
  
  export const calculateCenter = (data: DataPoint[]) => {
    if (!data || data.length === 0) {
      return { lat: -3.745, lng: -38.523 }; // Default center
    }
    const latitudes = data.map(point => point.LAT);
    const longitudes = data.map(point => point.LON);
    const averageLat = latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length;
    const averageLng = longitudes.reduce((sum, lng) => sum + lng, 0) / longitudes.length;
    return { lat: averageLat, lng: averageLng };
  };
  
  export function formatToGeoJSON(coordinates: any) {
    const features = coordinates.map((coords: any) => {
      const points = coords.map((coord: any) => turf.point(coord));
      return turf.featureCollection(points);
    });
    return features;
  }
  
  export function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return [r, g, b, 180]; // 180 é a opacidade (0-255)
  }
  
  // const options = {
  //   fillColor: 'transparent',
  //   strokeColor: 'blue',
  //   strokeOpacity: 0.8,
  //   strokeWeight: 2,
  //   clickable: true,
  //   draggable: false,
  //   editable: false,
  //   visible: true,
  //   zIndex: 1
  // };