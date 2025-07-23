import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#007bff',
            light: '#6dacef',
            dark: '#0056b3',
            contrastText: '#fff',
        },
        secondary: {
            main: '#6c757d',
            light: '#8e98a0',
            dark: '#494e52',
            contrastText: '#fff',
        },
        error: {
            main: '#dc3545',
        },
        warning: {
            main: '#ffc107',
        },
        info: {
            main: '#17a2b8',
        },
        success: {
            main: '#28a745',
        },
        background: {
            default: '#f8f9fa',
            paper: '#ffffff',
        },
        text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
        },
        divider: 'rgba(0, 0, 0, 0.12)',
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h1: { fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem' },
        h2: { fontSize: '2rem', fontWeight: 600, marginBottom: '0.8rem' },
        h3: { fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.7rem' },
        h4: { fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.6rem' },
        h5: { fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' },
        h6: { fontSize: '1rem', fontWeight: 500, marginBottom: '0.4rem' },
        body1: { fontSize: '1rem' },
        body2: { fontSize: '0.875rem' },
    },
    spacing: 8,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                switchBase: {
                    color: '#bdbdbd',
                    '&.Mui-checked': {
                        color: '#ffc107',
                    },
                    '&.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#ffc107',
                    },
                },
            },
        },
    },
});

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#81D4FA',
            light: '#E1F5FE',
            dark: '#0288D1',
            contrastText: '#212121',
        },
        secondary: {
            main: '#C5CAE9',
            light: '#E8EAF6',
            dark: '#7986CB',
            contrastText: '#212121',
        },
        error: {
            main: '#FF5252',
        },
        warning: {
            main: '#FFCC80',
        },
        info: {
            main: '#80CBC4',
        },
        success: {
            main: '#A5D6A7',
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E',
        },
        text: {
            primary: '#E0E0E0',
            secondary: '#B0B0B0',
        },
        divider: 'rgba(255, 255, 255, 0.12)',
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h1: { fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem' },
        h2: { fontSize: '2rem', fontWeight: 600, marginBottom: '0.8rem' },
        h3: { fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.7rem' },
        h4: { fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.6rem' },
        h5: { fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' },
        h6: { fontSize: '1rem', fontWeight: 500, marginBottom: '0.4rem' },
        body1: { fontSize: '1rem' },
        body2: { fontSize: '0.875rem' },
    },
    spacing: 8,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                switchBase: {
                    color: '#424242',
                    '&.Mui-checked': {
                        color: '#81D4FA',
                    },
                    '&.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#81D4FA',
                    },
                },
            },
        },
        MuiInputBase: {
            styleOverrides: {
                root: ({ theme }) => ({
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.light,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                    },
                    '& .MuiInputBase-input': {
                        color: theme.palette.text.primary,
                    },
                }),
            },
        },
    },
});

export { lightTheme, darkTheme };