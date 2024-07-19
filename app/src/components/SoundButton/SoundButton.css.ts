import { style } from '@vanilla-extract/css';

export const label = style({
  background: 'white',
  color: 'black',
  border: '1px solid black',
  width: '100%',
  height: '100%',
  lineHeight: '2.5em',
});

export const button = style({
  margin: '0 auto',
  fontSize: '4em',
  width: '100%',
  height: '70%',
  border: 'none',
});

export const menuContent = style({
  background: 'white',
  minWidth: '100px',
  padding: '4px',
  border: '2px solid black',
  borderRadius: '2px',
});

export const menuItem = style({
  color: 'black',
  fontWeight: 'bold',
  borderRadius: '2px',
  padding: '4px',
  cursor: 'pointer',
  ':hover': {
    background: 'pink',
  },
});
