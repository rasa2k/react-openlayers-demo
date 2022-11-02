import { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import { OSM } from "ol/source";
import { ImageWMS } from "ol/source";
import "ol/ol.css";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { dymmydata } from "./dummydata";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import { Circle, Point } from "ol/geom";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Text from "ol/style/Text";
import Fill from "ol/style/Fill";
import Icon from "ol/style/Icon";

proj4.defs(
  "EPSG:102067",
  "+proj=krovak +lat_0=49.5 +lon_0=24.8333333333333 +alpha=30.2881397527778 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +units=m +no_defs +type=crs"
);
register(proj4);

function App() {
  const [olMap, setOlMap] = useState<Map | any>(null);
  const mapElement = useRef<any>();
  const mapRef = useRef<any>();
  mapRef.current = olMap;

  useEffect(() => {
    const dymmyLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({
          color: "#00ffff",
          width: 5,
        }),
        fill: new Fill({
          color: "RGBA(0,164,236,0.2)",
        }),
      }),
    });

    const map: Map = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new ImageLayer({
          source: new ImageWMS({
            url: "https://development.waternet.dhigroup.com/cso_webapi/api/geoserver/wms?",
            imageLoadFunction: async function (tile: any, src: string) {
              const requestHeaders = {
                headers: {
                  "muwa-authtoken":
                    "1rITZuynODsnAV3YhcleLaivqTAmJgI7evUkJFcsVbGJCXcxpRcWxOFcqn1Z5XIPWI2QNyi35lCyEIell7sOVcn3zaoxFwlprxojb8jp/vvQLTfc5otKHZ9XCDNKlWpNJHRFu6oU4Y+ud0suWfK/ci7vryNRCt6465vh1s9arfI=",
                },
              };
              const response = await fetch(src, requestHeaders);
              const imageData = await response.blob();

              const imageElement = tile.getImage() as HTMLImageElement;
              imageElement.src = window.URL.createObjectURL(imageData);
            },
            ratio: 1,
            serverType: "geoserver",
            params: {
              VERSION: "1.1.0",
              viewparams: "u_id:4d635607f7634ec4a3b8675bceb47a1a",
              LAYERS:
                "cso:locality,cso:raingauge,cso:catchment,cso:catchcon,cso:link,cso:link_hidden,cso:manhole,cso:basin,cso:csov,cso:cov,cso:outlet,cso:weir,cso:resultstatus_n_ok",
            },
          }),
        }),
        dymmyLayer,
      ],
      view: new View({
        center: [-677772.4995307041, -1102466.6952598672],
        zoom: 8,
        projection: "EPSG:102067",
      }),
    });

    setOlMap(map);

    // Memic's an API call and add's the reprojected GeoJSON data from EPSG:4326 -> EPSG:102067 to the dymmyLayer source.
    // Styles are inherited from the dymmyLayer ->VectorLayer prop "style".
    (async () => {
      const data = await dymmydata();
      var featuresTOPOJson = new GeoJSON().readFeatures(data, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:102067",
      });
      dymmyLayer?.getSource()?.addFeatures(featuresTOPOJson);
    })();

    // Add's a single "feautre/cicle" to the map's center with a radius of 50000x.
    // Styles are inherited from the dymmyLayer ->VectorLayer prop "style", but is in this case overwritten.
    const dummyFeatureCircle = new Feature(new Circle(map?.getView()?.getCenter()!, 50000));
    dummyFeatureCircle.setStyle(
      new Style({
        stroke: new Stroke({
          color: "green",
          width: 5,
        }),
        text: new Text({
          text: "Hello",
          font: "italic 10px verdana",
          scale: 2,
        }),
      })
    );
    dymmyLayer?.getSource()?.addFeature(dummyFeatureCircle);

    // Add's a single feature/point to the map's center with multiple styles and can show svg/png/jpeg
    const dummyFeaturePoint = new Feature(new Point(map?.getView()?.getCenter()!));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 40 40" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 16.4c0-4.6 3.6-8.4 8-8.4s8 3.8 8 8.4c0 6.3-8 15.6-8 15.6s-8-9.3-8-15.6zm9-3.4v2h-2v-2h2zm0 4v6h-2v-6h2z" fill="%23ff6405"></path></svg>`;
    dummyFeaturePoint.setStyle([
      new Style({
        image: new Icon({
          src: "data:image/svg+xml;utf8," + svg,
          scale: 4.5,
          anchorXUnits: "fraction",
          anchor: [0.5, 0.8],
        }),
      }),
      new Style({
        image: new Icon({
          anchor: [0.5, 46],
          anchorXUnits: "fraction",
          anchorYUnits: "pixels",
          src: "https://openlayers.org/en/latest/examples/data/icon.png",
        }),
      }),
    ]);
    dymmyLayer?.getSource()?.addFeature(dummyFeaturePoint);

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  return <div id="map" ref={mapElement}></div>;
}

export default App;
