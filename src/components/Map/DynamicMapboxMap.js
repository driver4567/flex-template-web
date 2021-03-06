import React, { Component } from 'react';
import { string, shape, number, object } from 'prop-types';
import uniqueId from 'lodash/uniqueId';
import { circlePolyline } from '../../util/maps';
import config from '../../config';

const mapMarker = coordinatesConfig => {
  const { customMarker } = coordinatesConfig;
  if (customMarker) {
    const element = document.createElement('div');
    element.style.backgroundImage = `url(${customMarker.markerURI})`;
    element.style.width = `${customMarker.width}px`;
    element.style.height = `${customMarker.height}px`;
    return new window.mapboxgl.Marker({ element });
  } else {
    return new window.mapboxgl.Marker();
  }
};

const circleLayer = (center, coordinatesConfig, layerId) => {
  const { fillColor, fillOpacity } = coordinatesConfig.circleOptions;
  const path = circlePolyline(center, coordinatesConfig.coordinateOffset).map(([lat, lng]) => [
    lng,
    lat,
  ]);
  return {
    id: layerId,
    type: 'fill',
    source: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [path],
        },
      },
    },
    paint: {
      'fill-color': fillColor,
      'fill-opacity': fillOpacity,
    },
  };
};

const generateFuzzyLayerId = () => {
  return uniqueId('fuzzy_layer_');
};

class DynamicMapboxMap extends Component {
  constructor(props) {
    super(props);

    this.mapContainer = null;
    this.map = null;
    this.centerMarker = null;
    this.fuzzyLayerId = generateFuzzyLayerId();

    this.updateFuzzyCirclelayer = this.updateFuzzyCirclelayer.bind(this);
  }
  componentDidMount() {
    const { center, zoom, coordinatesConfig } = this.props;
    const position = [center.lng, center.lat];

    this.map = new window.mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v10',
      center: position,
      zoom,
      scrollZoom: false,
    });
    this.map.addControl(new window.mapboxgl.NavigationControl(), 'top-left');

    if (coordinatesConfig.fuzzy) {
      this.map.on('load', () => {
        this.map.addLayer(circleLayer(center, coordinatesConfig, this.fuzzyLayerId));
      });
    } else {
      this.centerMarker = mapMarker(coordinatesConfig);
      this.centerMarker.setLngLat(position).addTo(this.map);
    }
  }
  componentWillUnmount() {
    if (this.map) {
      this.centerMarker = null;
      this.map.remove();
      this.map = null;
    }
  }
  componentDidUpdate(prevProps) {
    if (!this.map) {
      return;
    }

    const { center, zoom, coordinatesConfig } = this.props;
    const { lat, lng } = center;
    const position = [lng, lat];

    // zoom change
    if (zoom !== prevProps.zoom) {
      this.map.setZoom(this.props.zoom);
    }

    const centerChanged = lat !== prevProps.center.lat || lng !== prevProps.center.lng;

    // center marker change
    if (this.centerMarker && centerChanged) {
      this.centerMarker.setLngLat(position);
      this.map.setCenter(position);
    }

    // fuzzy circle change
    if (coordinatesConfig.fuzzy && centerChanged) {
      if (this.map.loaded()) {
        this.updateFuzzyCirclelayer();
      } else {
        this.map.on('load', this.updateFuzzyCirclelayer);
      }
    }

    // NOTE: coordinatesConfig changes are not handled
  }
  updateFuzzyCirclelayer() {
    if (!this.map) {
      // map already removed
      return;
    }
    const { center, coordinatesConfig } = this.props;
    const { lat, lng } = center;
    const position = [lng, lat];

    this.map.removeLayer(this.fuzzyLayerId);

    // We have to use a different layer id to avoid Mapbox errors
    this.fuzzyLayerId = generateFuzzyLayerId();
    this.map.addLayer(circleLayer(center, coordinatesConfig, this.fuzzyLayerId));

    this.map.setCenter(position);
  }
  render() {
    const { containerClassName, mapClassName } = this.props;
    return (
      <div className={containerClassName}>
        <div className={mapClassName} ref={el => (this.mapContainer = el)} />
      </div>
    );
  }
}

DynamicMapboxMap.defaultProps = {
  address: '',
  center: null,
  zoom: config.coordinates.fuzzy ? config.coordinates.fuzzyDefaultZoomLevel : 11,
  coordinatesConfig: config.coordinates,
};

DynamicMapboxMap.propTypes = {
  address: string, // not used
  center: shape({
    lat: number.isRequired,
    lng: number.isRequired,
  }).isRequired,
  zoom: number,
  coordinatesConfig: object,
};

export default DynamicMapboxMap;
