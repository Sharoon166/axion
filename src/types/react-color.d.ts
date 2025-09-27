declare module 'react-color' {
  export interface RGBColor {
    r: number;
    g: number;
    b: number;
    a?: number;
  }

  export interface HSLColor {
    h: number;
    s: number;
    l: number;
    a?: number;
  }

  export interface ColorResult {
    hex: string;
    rgb: RGBColor;
    hsl: HSLColor;
    oldHue: number;
    source: string;
  }

  export interface ChromePickerProps {
    color?: string | RGBColor | HSLColor;
    onChange?: (color: ColorResult) => void;
    onChangeComplete?: (color: ColorResult) => void;
    disableAlpha?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }

  export const ChromePicker: React.FC<ChromePickerProps>;
}
