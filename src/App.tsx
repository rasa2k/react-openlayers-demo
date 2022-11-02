import { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { OSM, TileWMS } from "ol/source";
import "ol/ol.css";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";

proj4.defs("EPSG:5514", "+proj=krovak +lat_0=49.5 +lon_0=24.8333333333333 +alpha=30.2881397527778 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=589,76,480,0,0,0,0 +units=m +no_defs +type=crs");
proj4.defs("EPSG:102067", "+proj=krovak +lat_0=49.5 +lon_0=24.8333333333333 +alpha=30.2881397527778 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +units=m +no_defs +type=crs");
register(proj4);

function App() {
  const [olMap, setOlMap] = useState<Map | any>(null);
  const mapElement = useRef<any>();
  const mapRef = useRef<any>();
  mapRef.current = olMap;

  useEffect(() => {
    const map: Map = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new TileLayer({
          source: new TileWMS({
            url: "https://development.waternet.dhigroup.com/cso_webapi/api/geoserver/wms?",
            tileLoadFunction: async function (tile: any, src: string) {
              const settings = {
                headers: {
                  "muwa-authtoken": "o/7G2oo5c4kTby7/mkewsRPf6TNoGm7kSF6n3j+TM7WfDg1rfmZttlZCxyPgSJaXUOBhEZpuKkQYyp1M2kBfRKK/gqPoMOJwqh0Rx3K0lSEwScHmYgjie2/rhdQp+yZYPJlDAhIDpnrdbgp2qFjQevTqghRYaxfoUj4GsPMg+eI=",
                },
              };
              const response = await fetch(src, settings);
              const imageData = await response.blob();

              const imageElement = tile.getImage() as HTMLImageElement;
              imageElement.src = window.URL.createObjectURL(imageData);
            },
            params: {
              VERSION: "1.1.0",
              viewparams: "u_id:4d635607f7634ec4a3b8675bceb47a1a",
              LAYERS: "cso:locality,cso:raingauge,cso:catchment,cso:catchcon,cso:link,cso:link_hidden,cso:manhole,cso:basin,cso:csov,cso:cov,cso:outlet,cso:weir,cso:resultstatus_n_ok",
            },
          }),
        }),
      ],
      view: new View({
        center: [-544004.74, -1144001.89],
        zoom: 8,
        projection: "EPSG:102067",
      }),
    });

    setOlMap(map);

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  return <div id="map" ref={mapElement}></div>;
}

export default App;
