import { style } from '@vanilla-extract/css';

export const container = style({
  margin: ['0', '0 auto'],
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  textAlign: 'center',
  maxWidth: '70em',
});