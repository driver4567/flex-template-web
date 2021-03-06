import React, { Component } from 'react';
import { bool, number, object, string } from 'prop-types';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import config from '../../config';
import { StaticMap, DynamicMap, isMapsLibLoaded } from './GoogleMap';
// import { StaticMap, DynamicMap, isMapsLibLoaded } from './MapboxMap';

import css from './Map.css';

export class Map extends Component {
  render() {
    const {
      className,
      rootClassName,
      mapRootClassName,
      address,
      center,
      obfuscatedCenter,
      zoom,
      coordinatesConfig,
      useStaticMap,
    } = this.props;
    const classes = classNames(rootClassName || css.root, className);
    const mapClasses = mapRootClassName || css.mapRoot;

    if (coordinatesConfig.fuzzy && !obfuscatedCenter) {
      throw new Error(
        'Map: obfuscatedCenter prop is required when config.coordinates.fuzzy === true'
      );
    }
    if (!coordinatesConfig.fuzzy && !center) {
      throw new Error('Map: center prop is required when config.coordinates.fuzzy === false');
    }

    const location = coordinatesConfig.fuzzy ? obfuscatedCenter : center;

    return !isMapsLibLoaded() ? (
      <div className={classes} />
    ) : useStaticMap ? (
      <StaticMap
        center={location}
        zoom={zoom}
        address={address}
        coordinatesConfig={coordinatesConfig}
      />
    ) : (
      <DynamicMap
        containerElement={<div className={classes} />}
        mapElement={<div className={mapClasses} />}
        containerClassName={classes}
        mapClassName={mapClasses}
        center={location}
        zoom={zoom}
        address={address}
        coordinatesConfig={coordinatesConfig}
      />
    );
  }
}

Map.defaultProps = {
  className: null,
  rootClassName: null,
  mapRootClassName: null,
  address: '',
  zoom: config.coordinates.fuzzy ? config.coordinates.fuzzyDefaultZoomLevel : 11,
  coordinatesConfig: config.coordinates,
  useStaticMap: false,
};

Map.propTypes = {
  className: string,
  rootClassName: string,
  mapRootClassName: string,
  address: string,
  center: propTypes.latlng,
  obfuscatedCenter: propTypes.latlng,
  zoom: number,
  coordinatesConfig: object,
  useStaticMap: bool,
};

export default Map;
