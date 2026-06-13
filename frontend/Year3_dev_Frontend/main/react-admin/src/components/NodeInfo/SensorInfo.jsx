import { host } from "../../App"
import { useEffect, useState } from "react";
import verify_and_get_data from "../../function/fetchData";
import { Grid, Typography, Paper, useMediaQuery, useTheme, Box} from "@mui/material";
import ThermostatIcon from '@mui/icons-material/Thermostat';
import Co2Icon from '@mui/icons-material/Co2';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import LightModeIcon from '@mui/icons-material/LightMode';
import BoyIcon from '@mui/icons-material/Boy';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import LensBlurIcon from '@mui/icons-material/LensBlur';
import AdjustIcon from '@mui/icons-material/Adjust';

const iconMap = {
  co2: Co2Icon,
  temp: ThermostatIcon,
  hum: InvertColorsIcon,
  light: LightModeIcon,
  dust: LensBlurIcon,
  sound: VolumeUpIcon,
  tvoc: FilterDramaIcon,
  motion: BoyIcon,
  time: AdjustIcon,
};


function SensorInfo({room_id, callbackSetSignIn, sensors}) {
    const backend_host = host
    const [dataSensors, setDataSensors] = useState([])
    const api = `http://${backend_host}/api/raw_data_all_sensor?room_id=${room_id}`
    const [averageSensorNode, setAverageSensorNode] = useState({});
    const preferMd = useMediaQuery('(max-width:900px)');
    const theme = useTheme();
    const getRawDataSensors = async(url, access_token) =>{
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      }
      const option_fetch =
        {
            "method": "GET",
            "headers": headers,
            "body": null,
        }
        const response = await fetch(url, option_fetch);

        const data = await response.json()
        if(data){
            if(response.status === 200){
              setDataSensors(data);
            }
        }
        else{
            alert("Some error happened, try to reload page!");
        }
    }

    const formatValue = (value) => (
      Number.isFinite(value) ? value : "NaN"
    );

    const average_data = ((dataSensors, sensors) => {

      const data = {
        co2: NaN,
        temp: NaN,
        hum: NaN,
        light: NaN,
        dust: NaN,
        sound: NaN,
        tvoc: NaN,
        motion: NaN,
        time: 0,
      }

      const sum = {
        co2: 0,
        temp: 0,
        hum: 0,
        light: 0,
        dust: 0,
        sound: 0,
        tvoc: 0,
        motion: 0,
      }
      const count = {
        co2: 0,
        temp: 0,
        hum: 0,
        light: 0,
        dust: 0,
        sound: 0,
        tvoc: 0,
        motion: 0,
      }

      const getNodeId = (node) => node.node_id ?? node.id
      for(let i = 0; i < dataSensors.length; i++){
        const check = sensors.some((node) => Number(getNodeId(node)) === Number(dataSensors[i].node_id))
        if(check){
          for (const key in sum){
            const value = Number(dataSensors[i][key])
            if(Number.isFinite(value) && value >= 0){
              sum[key] += value
              count[key] += 1
            }
          }
          const time = Number(dataSensors[i].time)
          if(Number.isFinite(time) && time > 0){
            data.time = Math.max(data.time, time)
          }
        }
      }

      for (const key in sum) {
        if(count[key] > 0){
          data[key] = parseFloat((sum[key] / count[key]).toFixed(1))
        }
      }
      return data
    })

    useEffect(() => {
      setAverageSensorNode(average_data(dataSensors, sensors))
  }, [dataSensors, sensors]);


    useEffect(()=>{
    average_data(dataSensors, sensors);
    verify_and_get_data(getRawDataSensors, callbackSetSignIn, backend_host, api);
    const timer = setInterval(() => {
        verify_and_get_data(getRawDataSensors, callbackSetSignIn, backend_host, api);
    }, 30000);
    return () => clearInterval(timer);
    },[api, backend_host, callbackSetSignIn])
  
  return (
    <Grid container item textAlign='center' paddingTop={preferMd ? 0 : 0.5} justifyContent='center'
      sx={{ border: "1px solid black", borderRadius: "15px", p: 0.75, backgroundColor: theme.palette.background.paper }}
    >
        <Grid item container xs={12} sm={12} md={12} textAlign="center" justifyContent='center' my={0.25} mb={1}>
          <Typography sx={{fontWeight: "bold", fontSize: "20px"}}> Average Data Sensor Node </Typography>
        </Grid>
        <Box sx={{ width: "100%" }}>
          <Grid item container spacing={0.5} px='4px' marginBottom={0.25} justifyContent='center'>
              { Object.entries(averageSensorNode).map(([key, value], index, array) => {
                  const IconComponent = iconMap[key] || LensBlurIcon;
                  if (index === array.length - 1) return (
                    <Grid item xs={4}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', boxShadow: 0 }}>
                    <Paper style={{ flex: 1, backgroundColor: theme.palette.background.paper, padding: '6px'}} sx={{ boxShadow: "0px 0px 0px 0px", border: `none`}}>
                        <IconComponent style={{ fontSize: '2.25rem' }} />
                        <Grid container display="flex" flexDirection="column" justifyItems='center' textAlign='center'>
                            <Grid container item justifyContent='center' alignContent='center'>
                                <Typography sx={{ fontSize: "13px" }}>Number Node</Typography>
                            </Grid>
                            <Grid item>
                                <Typography sx={{ fontSize: "22px", fontWeight: "bold" }}>
                                    {sensors.length}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                    </div>
                    </Grid>);
                  else return (
                    <Grid item xs={4}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', boxShadow: 0 }}>
                    <Paper style={{ flex: 1, backgroundColor: theme.palette.background.paper, padding: '6px'}} sx={{ boxShadow: "0px 0px 0px 0px", border:"none"}}>
                        <IconComponent style={{ fontSize: '2.25rem' }} />
                        <Grid container display="flex" flexDirection="column" justifyItems='center' textAlign='center'>
                            <Grid container item justifyContent='center' alignContent='center'>
                                <Typography sx={{ fontSize: "13px" }}>{key}</Typography>
                            </Grid>
                            <Grid item>
                                <Typography sx={{ fontSize: "22px", fontWeight: "bold" }}>
                                    {formatValue(value)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                    </div>
                    </Grid>
                  )
              })}
          </Grid>
          <Grid textAlign='center' spacing={1} marginY={1}>
              <Typography textAlign='center' sx={{ fontSize: "13px" }}>updated on {
                                      (()=>{
                                          const new_time = averageSensorNode["time"]
                                          const utcDate = new Date(new_time * 1000)
                                          const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'};
                                          const formattedDateTime = utcDate.toLocaleDateString('en-US', options);
                                          return formattedDateTime;
                                      })()
                                  }
              </Typography>
          </Grid>
        </Box>
    </Grid>
  )
}
export default SensorInfo
