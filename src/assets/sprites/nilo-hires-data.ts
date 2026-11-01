import p0 from './hires/nilo-data-0';
import p1 from './hires/nilo-data-1';
import p2 from './hires/nilo-data-2';
import p3 from './hires/nilo-data-3';
import p4 from './hires/nilo-data-4';
import p5 from './hires/nilo-data-5';
import p6 from './hires/nilo-data-6';

export const NILO_FRAME_SIZE = 112;
export const NILO_FRAME_COUNT = 48;

export const NILO_SHEET_DATA_URI =
  `data:image/png;base64,${[p0, p1, p2, p3, p4, p5, p6].join('')}`;
