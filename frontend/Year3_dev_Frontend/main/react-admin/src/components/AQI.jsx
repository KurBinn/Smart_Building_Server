import { React, useEffect, useCallback, useState } from "react";
import { Grid, Typography, useTheme } from "@mui/material";
import { host } from "../App";
import { useTranslation } from "react-i18next";
import "../utils/i18n";
import verify_and_get_data from "../function/fetchData";
import { getAqiRating, normalizeAqiValue, NO_AQI_RATING } from "../utils/aqi";
const AQI = ({ room_id, callbackSetSignIn, time_delay = 0 }) =>
{
    const [aqi, setAqi] = useState({
        "level": NO_AQI_RATING.level,
        "color": NO_AQI_RATING.color,
        "hourly": "No data",
        "time": 0,
    })
    const setNoData = useCallback(() => {
        setAqi({
            "level": NO_AQI_RATING.level,
            "color": NO_AQI_RATING.color,
            "hourly": "No data",
            "time": 0,
        });
    }, []);
    const url = `http://${host}/api/room/AQIdustpm2_5?room_id=${room_id}`;
    const theme = useTheme();
    const {t} = useTranslation()

    const fetch_data_function = useCallback(async (api, access_token) =>
    {

        const headers = 
        {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
        }
        const option_fetch = 
        {
            "method": "GET",
            "headers": headers,
            "body": null,
        }
        const response = await fetch(api, option_fetch);
        if(response.status === 200)
        {
          let data;
          try {
            data = await response.json();
          } catch (e) {
            console.error("JSON parse error:", e);
            setNoData();
            return;
          }

            const hourly = normalizeAqiValue(data.hourly);
            const rating = getAqiRating(hourly);
            const new_data = {
                "level": rating.level,
                "color": rating.color,
                "hourly": hourly ?? "No data",
                "time": data.time,
            }

            setAqi(new_data);
        }
        else
        {
            try {
                await response.json();
            } catch (e) {
                console.error("JSON parse error:", e);
            }
            setNoData();
        }
    }, [setNoData]);
    
    useEffect(()=>{
        verify_and_get_data(fetch_data_function, callbackSetSignIn, host, url);

        if (!time_delay) {
            return undefined;
        }

        const timer = setInterval(() => {
            verify_and_get_data(fetch_data_function, callbackSetSignIn, host, url);
        }, time_delay);

        return () => clearInterval(timer);
    }, [callbackSetSignIn, fetch_data_function, time_delay, url]);

    return (
        <Grid container display="flex" flexDirection="column" justifyItems='center' textAlign='center'>
            <Grid container item justifyContent='center' alignContent='center'>
            <div style={{
                width: '100px', // Adjust as needed
                height: '100px', // Adjust as needed
                border: '15px solid', // Border makes the circle hollow
                borderColor: `${aqi['color'] || NO_AQI_RATING.color}`,
                borderRadius: '50%', // Makes the div a circle
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                padding: '80px',
                marginTop: '25px',
                marginLeft: '20px'
            }}>
                <span style={{
                    position: 'relative',
                    color: theme.palette.text.primary,
                    fontSize: '50px',
                    fontWeight: 'bold',
                    padding:"100px"
                }}>
                    {aqi['hourly']}
                </span>
            </div>
            </Grid>
            <Grid item marginY={0.6} />
            <Grid item style={{ marginLeft: '20px' }}>
                <Typography fontWeight='bold' variant='h2'>{t(aqi['level'] || NO_AQI_RATING.level)}</Typography>
            </Grid>
        </Grid>
    );
}

export default AQI;
