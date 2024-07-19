import { style } from '@vanilla-extract/css';

export const container = style({
  margin: ['0', '0 auto'],
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  textAlign: 'center',
  maxWidth: '45em',
});

export const header = style({
  fontSize: '4em',
  marginTop: '1em',
  marginBottom: '0.5em',
});

export const input = style({
  padding: '0.5em'
})

export const button = style({
  marginLeft: '1em',
  padding: '0.5em'
})

export const image = style({
  marginTop: '3em'
})