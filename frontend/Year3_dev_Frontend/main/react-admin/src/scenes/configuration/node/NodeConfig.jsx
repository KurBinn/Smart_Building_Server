import * as React from 'react';
import { useState, useContext, useEffect } from 'react';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Header from '../../../components/Header';
import { Container,Button } from '@mui/material';
import Paper from '@mui/material/Paper';
import { Grid, Tooltip, Typography, useTheme } from "@mui/material";
import { host } from '../../../App';
import { UserContext } from '../../../App';
import DeleteIcon from '@mui/icons-material/Delete';
import PermDataSettingIcon from '@mui/icons-material/PermDataSetting';
import DetailsIcon from '@mui/icons-material/Details';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DialogConfirmDeleteNode from './DialogConfirmDeleteNode';
import NodeChange from './NodeChange';
import DialogConfirmSettingNode from './DialogConfirmSettingNode';
import verify_and_get_data from '../../../function/fetchData';
import RoomMap from '../../../components/RoomMap/RoomMap2';
import { TableContainer } from "@mui/material";
import verifyAccessToken from '../../../function/verifyAccessToken';
import verifyRefreshToken from '../../../function/verifyRefreshToken';
import ScanDevice from './ScanDevice';
import Options from '../../../components/OptionsRoomMap/Options';
import { Box} from "@mui/material";
import Algorithm from './Algorithm';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Chip from '@mui/material/Chip';

export default function NodeConfig({roomIdForNodeConfig, setConfig, roomSize}) {
    
    const theme = useTheme();
    const callbackSetSignIn = useContext(UserContext);
    const backend_host = host;
    const api = `http://${host}/api/configuration_node?room_id=${roomIdForNodeConfig}`
    const [configurationNodeAll, setConfigurationNodeAll] = useState([]);
    const [isLoadingNodeConfig, setIsLoadingNodeConfig] = useState(true);
    const [listNode, setListNode] = useState([])
    const [separate, setSeparate] = useState(false)
    const [isImageFetched, setIsImageFetched] = useState(false)
    const dict_function = {
        "sensor": "Sensor",
        "air": "Air conditioner",
        "fan": "Fan",
        "actuator": "Actuator",
    }
    const panelSx = {
        bgcolor: theme.palette.background.surface || theme.palette.background.paper,
        border: `1px solid ${theme.palette.background.borderStrong || theme.palette.divider}`,
        borderRadius: "12px",
        boxShadow: 0,
    };

    const getConfigurationNodeAllData = async (url, access_token) => 
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
        const response = await fetch(url, option_fetch);

        const data = await response.json()
        if(data)
        {
            if(response.status === 200)
            {
                setConfigurationNodeAll(data);
                setIsLoadingNodeConfig(false)
            }
        }
        else
        {
            alert("Some error happened, try to reload page!");
        }
    }

    const handleButtonClick = async(url) => {

        const scan_device = async(url, access_token)=>{

            console.log("Sent request");
            alert("Please wait! Gateway is scanning");

            const headers =
            {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${access_token}`,
            }
            const body = JSON.stringify({
                "operator": "scan_device",
                "status": 1,
                "info": {
                    "room_id": roomIdForNodeConfig,
                    "protocol": "ble_mesh"
                }
            })

            const option_fetch =
            {
                "method": "POST",
                "headers": headers,
                "body": body,
            }
            const response = await fetch(url, option_fetch);
            
            if(response.status === 200){
                alert("Scan Processing in 60s");
            } else{
                alert("Try again!")
            }
        }

        const token = {access_token: null, refresh_token: null}
        if(localStorage.getItem("access") !== null && localStorage.getItem("refresh") !== null){
            token.access_token = localStorage.getItem("access");
            token.refresh_token = localStorage.getItem("refresh");
        } else {
            throw new Error("There is no access token and refresh token ....");
        }

        if( await verifyAccessToken(backend_host, token) === true){
            scan_device(url, token["access_token"])
        } else {
            if(await verifyRefreshToken(backend_host, token) === true){
                scan_device(url, token["access_token"]);
            } else {
                callbackSetSignIn(false);
            }
        }
        
    };
    
    const handleImage = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("image", file);
            const token = {access_token: null, refresh_token: null}
            if(localStorage.getItem("access") !== null && localStorage.getItem("refresh") !== null){
                token.access_token = localStorage.getItem("access");
                token.refresh_token = localStorage.getItem("refresh");
            } else {
                throw new Error("There is no access token and refresh token ....");
            }
            const headers =
            {
                "Authorization": `Bearer ${token.access_token}`,
            }
            const response = await fetch(`http://${host}/api/room_image?room_id=${roomIdForNodeConfig}`, {
                "method": "PATCH",
                "headers": headers,
                "body": formData,
            })
            
            if (response.status === 200){
                alert("Upload Successfully")
            } else {
                alert("Error Upload")
            }
        }
    };

    useEffect(()=>{
        verify_and_get_data(getConfigurationNodeAllData, callbackSetSignIn, backend_host, api);
        const timer = setInterval(() => {
            verify_and_get_data(getConfigurationNodeAllData, callbackSetSignIn, backend_host, api);
        }, 10000);
        return () => clearInterval(timer);
    },[isLoadingNodeConfig])


    return (
        <>
        {

        isLoadingNodeConfig === true ?
            <h1>Loading ...</h1>
            :
            <Container sx={{ p: 0, m: 0, width: "100%" }}
                        maxWidth={false}
                        disableGutters>
                <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                    <Grid item>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            fontSize: "10px",
                            fontWeight: "bold",
                            padding: "5px 12px",
                            }}
                        variant="contained"

                        onClick={()=>{
                            setConfig(0);
                        }}
                    >
                        Go Back
                    </Button>
                    </Grid>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImage}
                        style={{ display: "none" }}
                        id="upload"
                    />
                    <Grid item component="label" htmlFor="upload">
                    <Button
                        component="span"
                        startIcon={<ArrowDownwardIcon />}
                        sx={{
                            fontSize: "10px",
                            fontWeight: "bold",
                            padding: "5px 12px",
                        }}
                        variant="contained"
                    >
                        Import Image Room
                    </Button>
                    </Grid>
                </Grid>
                {/* Protocol Wifi*/}
                {/* <NodeChange configurationNodeAll={configurationNodeAll} 
                            callbackSetSignIn={callbackSetSignIn} 
                            nodeConfigLoading={{0: isLoadingNodeConfig, 1: setIsLoadingNodeConfig}}
                            roomIdForNodeConfig={roomIdForNodeConfig}
                            roomSize={roomSize}
                /> */}
                <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
                    <Grid item xs={12} lg={5} sx={{ minWidth: 0 }}>
                        <Grid container direction="column" spacing={2} sx={{ minWidth: 0 }}>
                            <Grid item sx={{ minWidth: 0, width: "100%", maxWidth: "100%" }}>
                                <TableContainer sx={{ ...panelSx, width: "100%", maxWidth: "100%", overflowX: "auto", height: { xs: "340px", md: "clamp(340px, 38vh, 520px)" }, overflowY: "auto", p:{ xs: 1, md: 2 }}}>
                                    <Header title={`All node records in room ${roomIdForNodeConfig}`} fontSize="20px"/>
                                    <Table size="small" stickyHeader sx={{ minWidth: 760 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.surfaceRaised" }}>Node id</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.surfaceRaised" }}>Position x</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.surfaceRaised" }}>Position y</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.surfaceRaised" }}>Function</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.surfaceRaised" }}>Mac Address</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "14px", bgcolor: "background.surfaceRaised" }}>Status</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "14px", bgcolor: "background.surfaceRaised" }}>Setting</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "14px", bgcolor: "background.surfaceRaised" }}>Delete</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                        {configurationNodeAll.map((row) => (
                                            <TableRow key={row.id} hover>
                                                <TableCell sx={{ fontWeight: 400, fontSize: "13px" }}>{row.node_id}</TableCell>
                                                <TableCell sx={{ fontWeight: 400, fontSize: "13px" }}>{row.x_axis}</TableCell>
                                                <TableCell sx={{ fontWeight: 400, fontSize: "13px" }}>{row.y_axis}</TableCell>
                                                <TableCell sx={{ fontWeight: 400, fontSize: "13px" }}>{dict_function[row.function]}</TableCell>
                                                <TableCell sx={{ fontWeight: 400, fontSize: "13px", minWidth: 150 }}>{row.mac}</TableCell>
                                                <TableCell>
                                                <Chip
                                                    label={row.status === "sync" ? "Active" : "Inactive"}
                                                    color={row.status === "sync" ? "success" : "error"}
                                                    sx={{ fontSize: "12px", width:'68px', fontWeight:'bold' }}
                                                />
                                                </TableCell>

                                                <TableCell
                                                sx={{ width: 100 }}
                                                >
                                                    <DialogConfirmSettingNode callbackSetSignIn={callbackSetSignIn} 
                                                        NodeConfigLoading={{0: isLoadingNodeConfig, 1: setIsLoadingNodeConfig}}
                                                        row={row}
                                                        configurationNodeAll={configurationNodeAll}
                                                        roomSize={roomSize}
                                                        />
                                                </TableCell>
                                                <TableCell
                                                sx={{ width: 100 }}
                                                >
                                                    <DialogConfirmDeleteNode callbackSetSignIn={callbackSetSignIn} NodeConfigLoading={{0: isLoadingNodeConfig, 1: setIsLoadingNodeConfig}} id={row.node_id}/>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                    {/* <Link color="primary" href="#" onClick={preventDefault} sx={{ mt: 3 }}>
                                        See more orders
                                    </Link> */}

                                </TableContainer>
                            </Grid>
                            <Grid item sx={{ minWidth: 0, width: "100%", maxWidth: "100%" }}>
                                <Algorithm roomIdForNodeConfig={roomIdForNodeConfig}/>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} lg={7} sx={{ minWidth: 0 }}>
                        <Grid container direction="column" spacing={2} sx={{ minWidth: 0 }}>
                            <Grid item sx={{ height: { xs: "min(70vh, 520px)", md: "clamp(420px, 54vh, 680px)" }, minHeight: { xs: 380, md: 420 }, width:"100%", minWidth: 0 }}>
                                <Options room_id={roomIdForNodeConfig}
                                callbackSetSignIn={callbackSetSignIn}
                                configurationNodeAll={configurationNodeAll}
                                setListNode = {setListNode}
                                setSeparate = {setSeparate}
                                isImageFetched = {isImageFetched}
                                widthMap="100%"
                                heightMap={null}
                                data_passed_from_landingpage={{"x_length": roomSize.x,"y_length": roomSize.y}}
                                />
                            </Grid>
                            <Grid item sx={{ display: "flex", justifyContent: { xs: "stretch", sm: "flex-start" }, minWidth: 0 }}>
                            <Button
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    padding: "5px 12px",
                                    width: { xs: "100%", sm: "auto" },
                                    }}
                                variant="contained"

                                onClick={()=>{handleButtonClick(`http://${host}/api/scan_device`)}}
                            >
                                SCAN DEVICE
                            </Button>
                            </Grid>
                            <Grid item sx={{ minWidth: 0 }}>
                                <ScanDevice roomIdForNodeConfig={roomIdForNodeConfig}/>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

            </Container>
            }
            </>
    );
}
