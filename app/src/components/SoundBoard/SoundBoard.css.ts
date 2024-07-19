import { style } from '@vanilla-extract/css';

export const board = style({
    listStyle: 'none',
    display: 'flex',
    flexWrap: 'wrap',
    padding: 0,
    justifyContent: 'center',
})

export const cell = style({
    listStyle: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '9em',
    height: '9em',
    overflow: 'hidden',
    transition: '100ms ease',

    selectors: {
        '&:hover, &:focus-visible': {
            transform: 'scale(1.15)',
            backgroundPosition: '12px',
        },
    },
})

export const toggle = style({
    margin: '2em'
})
