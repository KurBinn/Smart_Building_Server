import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens export
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#e0e0e0",
          200: "#c2c2c2",
          300: "#a3a3a3",
          400: "#858585",
          500: "#666666",
          600: "#525252",
          700: "#3d3d3d",
          800: "#292929",
          900: "#141414",
        },
        primary: {
          100: "#d0d1d5",
          200: "#a1a4ab",
          300: "#727681",
          400: "#1F2A40",
          500: "#141b2d",
          600: "#101624",
          700: "#0c101b",
          800: "#080b12",
          900: "#040509",
        },
        greenAccent: {
          100: "#dbf5ee",
          200: "#b7ebde",
          300: "#94e2cd",
          400: "#70d8bd",
          500: "#4cceac",
          600: "#3da58a",
          700: "#2e7c67",
          800: "#1e5245",
          900: "#0f2922",
        },
        redAccent: {
          100: "#f8dcdb",
          200: "#f1b9b7",
          300: "#e99592",
          400: "#e2726e",
          500: "#db4f4a",
          600: "#af3f3b",
          700: "#832f2c",
          800: "#58201e",
          900: "#2c100f",
        },
        blueAccent: {
          100: "#e1e2fe",
          200: "#c3c6fd",
          300: "#a4a9fc",
          400: "#868dfb",
          500: "#6870fa",
          600: "#535ac8",
          700: "#3e4396",
          800: "#2a2d64",
          900: "#151632",
        },
        blackColor: {
          100: "#d3d3d2",
          200: "#a7a7a6",
          300: "#7a7a79",
          400: "#4e4e4d",
          500: "#242424",
          600: "#1b1b1a",
          700: "#141413",
          800: "#0e0e0d",
          900: "#070706",
        },
      whiteColor: {
        100: "#ffffff",
        200: "#ffffff",
        300: "#ffffff",
        400: "#fafafa",
        500: "#eeeeee",
        600: "#cccccc",
        700: "#999999",
        800: "#666666",
        900: "#333333",
      },
      }
    : {
      grey: {
        100: "#141414",
        200: "#292929",
        300: "#3d3d3d",
        400: "#525252",
        500: "#666666",
        600: "#858585",
        700: "#a3a3a3",
        800: "#c2c2c2",
        900: "#e0e0e0",
      },
      primary: {
        100: "#040509",
        200: "#080b12",
        300: "#0c101b",
        400: "#101624",
        500: "#141b2d",
        600: "#1F2A40",
        700: "#727681",
        800: "#a1a4ab",
        900: "#d0d1d5",
      },
      greenAccent: {
        100: "#0f2922",
        200: "#1e5245",
        300: "#2e7c67",
        400: "#3da58a",
        500: "#4cceac",
        600: "#70d8bd",
        700: "#94e2cd",
        800: "#b7ebde",
        900: "#dbf5ee",
      },
      redAccent: {
        100: "#2c100f",
        200: "#58201e",
        300: "#832f2c",
        400: "#af3f3b",
        500: "#db4f4a",
        600: "#e2726e",
        700: "#e99592",
        800: "#f1b9b7",
        900: "#f8dcdb",
      },
      blueAccent: {
        100: "#151632",
        200: "#2a2d64",
        300: "#3e4396",
        400: "#535ac8",
        500: "#6870fa",
        600: "#868dfb",
        700: "#a4a9fc",
        800: "#c3c6fd",
        900: "#e1e2fe",
      },
      blackColor: {
        100: "#070706",
        200: "#0e0e0d",
        300: "#141413",
        400: "#1b1b1a",
        500: "#242424",
        600: "#4e4e4d",
        700: "#7a7a79",
        800: "#a7a7a6",
        900: "#d3d3d2",
        },
        whiteColor: {
          100: "#333333",
          200: "#666666",
          300: "#999999",
          400: "#d8d8d8",
          500: "#eeeeee",
          600: "#fafafa",
          700: "#ffffff",
          800: "#ffffff",
          900: "#ffffff",
      },
      }),
});

//mui theme settings 


export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            // palette values for dark mode
            primary: {
              main: "#38bdf8",
              contrastText: "#07111f",
            },
            secondary: {
              main: "#4cceac",
              contrastText: "#061812",
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: "#0f141b",
              paper: "#18212b",
              surface: "#1f2b37",
              surfaceRaised: "#263443",
              border: "rgba(226, 232, 240, 0.28)",
              borderStrong: "rgba(248, 250, 252, 0.46)",
            },
            text: {
              primary: "#f8fafc",
              secondary: "#cbd5e1",
            },
            divider: "rgba(226, 232, 240, 0.28)",
            action: {
              hover: "rgba(56, 189, 248, 0.12)",
              selected: "rgba(56, 189, 248, 0.18)",
            },
          }
        : {
            // palette values for light mode
            primary: {
              main: colors.primary[100],
              contrastText: "#ffffff",
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: colors.whiteColor[600],
              paper: colors.whiteColor[700],
              surface: "#ffffff",
              surfaceRaised: "#f6f8fb",
              border: "rgba(20, 20, 20, 0.16)",
              borderStrong: "rgba(20, 20, 20, 0.32)",
            },
            text: {
              primary: colors.grey[100],
              secondary: colors.grey[300],
            },
            divider: "rgba(20, 20, 20, 0.16)",
          }),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === "dark" ? "#0f141b" : colors.whiteColor[600],
            color: mode === "dark" ? "#f4f7fb" : colors.grey[100],
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: mode === "dark" ? "#18212b" : colors.whiteColor[700],
            borderColor: mode === "dark" ? "rgba(226, 232, 240, 0.28)" : "rgba(20, 20, 20, 0.16)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: mode === "dark" ? "#18212b" : "#ffffff",
            border: `1px solid ${mode === "dark" ? "rgba(226, 232, 240, 0.28)" : "rgba(20, 20, 20, 0.14)"}`,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: mode === "dark" ? "rgba(226, 232, 240, 0.22)" : "rgba(20, 20, 20, 0.14)",
          },
          head: {
            color: mode === "dark" ? "#f8fafc" : colors.grey[100],
            backgroundColor: mode === "dark" ? "#223040" : "#f3f5f8",
          },
          body: {
            color: mode === "dark" ? "#e5edf6" : colors.grey[100],
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:nth-of-type(even)": {
              backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.025)" : "rgba(20, 20, 20, 0.025)",
            },
            "&:hover": {
              backgroundColor: mode === "dark" ? "rgba(56, 189, 248, 0.10)" : "rgba(20, 20, 20, 0.05)",
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: mode === "dark" ? "#dbeafe" : colors.grey[200],
            "&.Mui-focused": {
              color: mode === "dark" ? "#7dd3fc" : colors.blueAccent[500],
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "dark" ? "#111a24" : "#ffffff",
            color: mode === "dark" ? "#f8fafc" : colors.grey[100],
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: mode === "dark" ? "rgba(226, 232, 240, 0.34)" : "rgba(20, 20, 20, 0.24)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: mode === "dark" ? "rgba(125, 211, 252, 0.72)" : colors.blueAccent[500],
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: mode === "dark" ? "#7dd3fc" : colors.blueAccent[500],
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === "dark" ? "#1f2b37" : "#ffffff",
            border: `1px solid ${mode === "dark" ? "rgba(226, 232, 240, 0.34)" : "rgba(20, 20, 20, 0.12)"}`,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === "dark" ? "#1f2b37" : "#ffffff",
            border: `1px solid ${mode === "dark" ? "rgba(226, 232, 240, 0.34)" : "rgba(20, 20, 20, 0.12)"}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
          },
          outlined: {
            color: mode === "dark" ? "#f8fafc" : colors.grey[100],
            borderColor: mode === "dark" ? "rgba(244, 247, 251, 0.52)" : "rgba(20, 20, 20, 0.35)",
          },
        },
      },
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 30,
      },
      h3: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 16,
      },
      h6: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 14,
      },
    },
  };
};



// context for color mode, don't know how the hell this work
export const ColorModeContext = createContext({
  mode: "light",
  toggleColorMode: () => {},
});
  
export const useMode = () => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem("themeMode");
    return savedMode === "dark" ? "dark" : "light";
  });

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((prev) => {
          const nextMode = prev === "light" ? "dark" : "light";
          localStorage.setItem("themeMode", nextMode);
          return nextMode;
        }),
    }),
    [mode]
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  //theme is a object that function createTheme of MUI return
  //function createTheme of MUI will put the object returned by themeSettings(mode) to MUI
  return [theme, colorMode];
};

