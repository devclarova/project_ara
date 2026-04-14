import * as React from 'react';

declare module 'react-simple-maps' {
  export interface ComposableMapProps {
    width?: number;
    height?: number;
    projection?: string | ((...args: unknown[]) => unknown);
    projectionConfig?: Record<string, unknown>;
    children?: React.ReactNode;
    className?: string;
  }

  export interface GeographiesProps {
    geography?: string | Record<string, unknown> | string[];
    children?: (data: { geographies: unknown[] }) => React.ReactNode;
    parseGeographies?: (geos: unknown[]) => unknown[];
  }

  export interface GeographyProps {
    geography?: unknown;
    onMouseEnter?: (evt: React.MouseEvent) => void;
    onMouseLeave?: (evt: React.MouseEvent) => void;
    onMouseDown?: (evt: React.MouseEvent) => void;
    onMouseUp?: (evt: React.MouseEvent) => void;
    onClick?: (evt: React.MouseEvent) => void;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    className?: string;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
    onMouseEnter?: (evt: React.MouseEvent) => void;
    onMouseLeave?: (evt: React.MouseEvent) => void;
    onClick?: (evt: React.MouseEvent) => void;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    onMoveStart?: (evt: React.SyntheticEvent, position: { x: number; y: number; k: number }) => void;
    onMoveEnd?: (evt: React.SyntheticEvent, position: { x: number; y: number; k: number }) => void;
    children?: React.ReactNode;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<MarkerProps>;
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
}

declare module 'd3-scale' {
  export function scaleLinear<Domain = number, Range = number>(): {
      (value: Domain): Range;
      domain(domain: Domain[]): any;
      range(range: Range[]): any;
      clamp(clamp: boolean): any;
  };
}

