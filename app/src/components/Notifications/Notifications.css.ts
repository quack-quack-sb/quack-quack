import { style, globalStyle } from '@vanilla-extract/css';

export const container = style({});

globalStyle(`${container} > div`, {
  transform: 'none !important',
  bottom: '0px',
});
