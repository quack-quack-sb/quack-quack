import { globalStyle } from '@vanilla-extract/css';

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
});

globalStyle('*', {
  margin: 0,
});

globalStyle('html, body', {
  height: '100%',
});

globalStyle('p, h1, h2, h3, h4, h5, h6', {
  overflowWrap: 'break-word',
});

globalStyle('h1, h2, h3, h4, h5, h6', {
  color: '#fff',
});

globalStyle('a', {
  color: 'rgb(62, 110, 193)',
  textDecoration: 'none'
});

globalStyle('img, picture, video, canvas, svg', {
  display: 'block',
  maxWidth: '100%',
});

globalStyle('input, button, textarea, select', {
  font: 'inherit',
});

globalStyle('#root', {
  isolation: 'isolate',
});

globalStyle(':root', {
  fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: 400,
  color: 'rgb(161, 161, 170)',
  backgroundColor: 'rgb(24 24 27)',
  fontSynthesis: 'none',
  textRendering: 'optimizeLegibility',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  WebkitTextSizeAdjust: '100%',
});
