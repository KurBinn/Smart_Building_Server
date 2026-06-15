import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ContrastIcon from '@mui/icons-material/Contrast';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { host, UserContext } from '../../App';
import { useEffect, useState } from 'react';
import verifyAccessToken from "../../function/verifyAccessToken";
import verifyRefreshToken from "../../function/verifyRefreshToken";
import { ColorModeContext } from '../../theme';

function Copyright(props) {
	return (
		<Typography variant="body2" color="text.secondary" align="center" {...props}>
		{'Copyright © '}
		<Link color="inherit" href="https://mui.com/">
			HUST
		</Link>{' '}
		{new Date().getFullYear()}
		{'.'}
		</Typography>
	);
}

export default function SignIn({setSignUp, setIsSignin, setForgetPassword})
{
    const [isLoading, setIsLoading] = useState(true);
    const backend_host = host;
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);
    const isDarkMode = theme.palette.mode === "dark";
    const checkIfAlreadySignIn = React.useCallback(async () =>
    {
        if(localStorage.getItem("access") !== null && localStorage.getItem("refresh") !== null)
        {
            const token = {"access_token": localStorage.getItem("access"), "refresh_token": localStorage.getItem("refresh")};

            if(await verifyAccessToken(host, token)){
                setIsSignin(true);
            }
            else
            {
                if(await verifyRefreshToken(host, token)){
                    setIsSignin(true);
                }
                else{
                    setIsLoading(false);
                }
            }
        }
        else
        {
            setIsLoading(false);
        }
    }, [setIsSignin]);
	const callbackSetIsSignIn = useContext(UserContext);
    const getAuthentication  = async (username, password) =>
    {
        const get_authentication_API_endpoint = `http://${backend_host}/api/token`;
        const get_authentication_API_data =
        {
            "username": username,
            "password": password,
        };
        const get_authentication_API_option =
        {
            "method": "POST",
            "headers":
            {
            "Content-Type": "application/json",
            },
            "body": JSON.stringify(get_authentication_API_data),
        }
        const get_authentication_API_response = await fetch(get_authentication_API_endpoint, get_authentication_API_option);
        const get_authentication_API_response_data = await get_authentication_API_response.json();
        if(get_authentication_API_response.status !== 200)
        {
            return false;
        }
        else if(get_authentication_API_response.status === 200 && 
            get_authentication_API_response_data.hasOwnProperty("access") &&
            get_authentication_API_response_data.hasOwnProperty("refresh") &&
            get_authentication_API_response_data.hasOwnProperty("role"))
        {
        localStorage.setItem("access", get_authentication_API_response_data["access"]);
        localStorage.setItem("refresh", get_authentication_API_response_data["refresh"]);
        localStorage.setItem("role", get_authentication_API_response_data["role"]);
        }
        else
        {
        throw new Error("Cannot get access and refresh token or user is not authenticated ...");
        }
        return true;
    }
    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        localStorage.setItem("username", data.get('username'))
        let isAuthenticated = null;
        try
        {
            isAuthenticated = await getAuthentication(data.get("username"), data.get("password"));
        }
        catch(err)
        {
            alert("Server is not available or username, password is wrong. Error " + err);
            callbackSetIsSignIn(false);
        }
        if(isAuthenticated === true)
        {
            callbackSetIsSignIn(true);
        }
        else
        {
            alert("Cannot verify username or password!");
        }
    };

    useEffect(()=>{
        checkIfAlreadySignIn();
    }, [checkIfAlreadySignIn]);
    return (
        <>
        {
        !isLoading
        &&
        <Box
            component="main"
            sx={{
                minHeight: "100vh",
                bgcolor: "background.default",
                color: "text.primary",
                display: "flex",
                alignItems: "center",
                py: { xs: 4, md: 8 },
                px: 2,
                position: "relative",
            }}
        >
        <Tooltip title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}>
            <IconButton
                aria-label="toggle theme"
                onClick={colorMode.toggleColorMode}
                sx={{
                    position: "absolute",
                    top: 18,
                    right: 18,
                    border: `1px solid ${theme.palette.background.border || theme.palette.divider}`,
                    bgcolor: "background.surface",
                    color: "text.primary",
                    "&:hover": {
                        bgcolor: "background.surfaceRaised",
                    },
                }}
            >
                <ContrastIcon />
            </IconButton>
        </Tooltip>

        <Container component="section" maxWidth="xs">

            <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: { xs: 3, sm: 4 },
                borderRadius: "16px",
                border: `1px solid ${theme.palette.background.borderStrong || theme.palette.divider}`,
                bgcolor: "background.surface",
                boxShadow: isDarkMode
                    ? "0 24px 70px rgba(0, 0, 0, 0.35)"
                    : "0 24px 70px rgba(15, 23, 42, 0.12)",
            }}
            >
            <Avatar sx={{ m: 1, bgcolor: isDarkMode ? 'primary.main' : 'secondary.main', color: isDarkMode ? 'primary.contrastText' : 'inherit' }}>
                <LockOutlinedIcon />
            </Avatar>

            <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
                Sign in
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                sx={{ bgcolor: "background.paper" }}
                />

                <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                sx={{ bgcolor: "background.paper" }}
                />

                {/* <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
                /> */}

                <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                >
                Sign In
                </Button>
                <Box sx={{ width: '100%' }}>
                    <Grid container justifyContent="flex-end" spacing={1}>
                    <Grid item>
                        <Link variant="body2" sx={{ cursor: 'pointer' }} onClick={()=>{setForgetPassword(true)}}>
                            Forgot password?
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link variant="body2" sx={{ cursor: 'pointer' }} onClick={()=>{setSignUp(true)}}>
                            Sign Up
                        </Link>
                    </Grid>
                    </Grid>
                </Box>
            </Box>
            </Box>

            <Copyright sx={{ mt: 8, mb: 4 }} />
        </Container>
        </Box>
    }
    </>
    );
}
