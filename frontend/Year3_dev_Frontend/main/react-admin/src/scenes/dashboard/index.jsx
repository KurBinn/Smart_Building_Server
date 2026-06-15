import { Box, useTheme } from "@mui/material";
import { useState, useContext, useEffect, useCallback } from "react";
import Container from '@mui/material/Container';
import Energy from "../../components/AqiRef/Energy2";
import { UserContext } from "../../App";
import Chart from "../../data/Chart2";
import {host} from "../../App";
import InformationTag from "../../components/InformationTag2";
import { useLocation } from "react-router-dom"; 
import AqiRef from "../../components/AqiRef/AqiRef3";
import EnergyChart from "../../components/EnergyChart/EnergyChart2";
import Options from "../../components/OptionsRoomMap/Options";
import verify_and_get_data from "../../function/fetchData";
import DetailNode from "../../components/NodeInfo/DetailNode";
import { fetchRoomImageAsDataUrl, getDefaultRoomImage, saveRoomImage } from "../../utils/roomImage";


const LIVE_REFRESH_MS = 5000;

const Dashboard = () => {
    const backend_host = host;
    const location = useLocation();
    const data_passed_from_landingpage = location.state ?? null;
    let room_id = data_passed_from_landingpage == null ? 1 : data_passed_from_landingpage.room_id
    const url_image = data_passed_from_landingpage?.image ?? data_passed_from_landingpage?.image_url ?? null;
    const theme = useTheme();
    const callbackSetSignIn = useContext(UserContext);
    const [optionChartData] = useState("now")
    const apiInformationTag = `http://${backend_host}/api/room/information_tag?room_id=${room_id}`;
    const [, setActuatorInfoOfRoom] = useState([]);
    const [configurationNodeAll, setConfigurationNodeAll] = useState([]);
    const api = `http://${host}/api/configuration_node?room_id=${room_id}`
    const [listNode, setListNode] = useState([])
    const [, setSeparate] = useState(false)
    const [isImageFetched, setIsImageFetched] = useState(false);
    const getDetailNodeId = (node) => node.node_id ?? node.id;
    const normalizeDetailNodes = (node) => {
        const nodeId = getDetailNodeId(node);
        const nodeFunction = node.type ?? node.function;
        if (nodeFunction === "sensor_actuator") {
            return [
                { id: nodeId, type: "sensor" },
                { id: nodeId, type: "actuator" },
            ];
        }
        return [{
            id: nodeId,
            type: nodeFunction === "sensor" ? "sensor" : "actuator",
        }];
    };
    const configuredDetailNodes = configurationNodeAll
        .filter((node) => {
            const status = String(node.status ?? "").toLowerCase();
            return status === "" || status === "sync" || status === "active";
        })
        .flatMap(normalizeDetailNodes);
    const selectedDetailNodes = listNode.flatMap(normalizeDetailNodes);
    const selectedSensors = selectedDetailNodes.filter((node) => node.type === "sensor");
    const selectedActuators = selectedDetailNodes.filter((node) => node.type === "actuator");
    const visibleDetailNodes = [
        ...(selectedSensors.length > 0
            ? selectedSensors
            : configuredDetailNodes.filter((node) => node.type === "sensor")),
        ...(selectedActuators.length > 0
            ? selectedActuators
            : configuredDetailNodes.filter((node) => node.type === "actuator")),
    ];
    const panelSx = {
        boxShadow: 0,
        border: `1px solid ${theme.palette.background.borderStrong || theme.palette.divider}`,
        borderRadius: "15px",
        backgroundColor: theme.palette.background.surface || theme.palette.background.paper,
    };
    const mainLayoutSx = {
        display: "grid",
        gap: 1.5,
        p: "8px",
        alignItems: "stretch",
        gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(280px, 0.92fr) minmax(440px, 1.65fr) minmax(270px, 0.82fr)",
            xl: "minmax(300px, 0.9fr) minmax(560px, 1.7fr) minmax(300px, 0.9fr)",
        },
        "@media (min-width: 900px) and (max-aspect-ratio: 4/3)": {
            gridTemplateColumns: "minmax(280px, 0.95fr) minmax(420px, 1.45fr)",
            "& .dashboard-right-column": {
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(260px, 1fr))",
                alignItems: "start",
            },
        },
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
            }
        }
        else
        {
            alert("Some error happened, try to reload page!");
        }
    }

    const fetchAndEncodeImage = useCallback(async () => {
        try {
            setIsImageFetched(false);
            const imageSource = await fetchRoomImageAsDataUrl(url_image, backend_host, room_id);
            saveRoomImage(imageSource, room_id);
            setIsImageFetched(true);
        } catch (error) {
            console.error("Error while loading room image:", error);
            saveRoomImage(getDefaultRoomImage(room_id), room_id);
            setIsImageFetched(true);
        }
    }, [backend_host, room_id, url_image]);

    useEffect(()=>{
        fetchAndEncodeImage()
        verify_and_get_data(getConfigurationNodeAllData, callbackSetSignIn, backend_host, api);
        const timer = setInterval(() => {
            verify_and_get_data(getConfigurationNodeAllData, callbackSetSignIn, backend_host, api);
        }, 20000);
        return () => clearInterval(timer);
    }, [api, backend_host, callbackSetSignIn, fetchAndEncodeImage])
    return (
    <>
    <Box 
        component="main"
        sx={{
            flexGrow: 1,
            bgcolor: theme.palette.background.default
        }}
    >
        <Box m={2}/>
            <Container
                maxWidth={false}
                disableGutters
                sx={{ overflowX: "hidden" }}
            >
                <Box sx={mainLayoutSx}>
                    <Box sx={{ minWidth: 0, height: "100%" }}>
                        <Box
                            width="100%" height="100%" display="flex"
                            flexDirection="column" alignItems="center" justifyContent="flex-start"
                        >
                            <Box 
                                sx={{
                                    ...panelSx,
                                    flex: "0 1 auto"}}
                                width="100%" display="flex"
                                flexDirection="column" alignContent="center" justifyContent="center"
                            >
                                <AqiRef callbackSetSignIn={callbackSetSignIn} time_delay={60000}/>
                            </Box>
                            <Box
                                sx={{
                                    ...panelSx,
                                    flex: "1 1 auto"}}
                                width="100%"
                                display="flex"
                                flexDirection="row"
                                alignSelf='center'
                                alignContent="center"
                                justify="center"
                                marginTop={2}
                            >
                            <InformationTag
                                url={apiInformationTag}
                                callbackSetSignIn={callbackSetSignIn}
                                time_delay={LIVE_REFRESH_MS}
                                room_id={room_id}
                                setActuatorInfoOfRoom={setActuatorInfoOfRoom}
                            />
                            </Box>
                            <Box 
                                sx={{
                                    ...panelSx,
                                    flex: "0 0 auto"}}
                                width="100%"
                                display="flex"
                                flexDirection="row"
                                alignSelf='center'
                                alignContent="center"
                                justify="center"
                                marginTop={2}
                            >
                                <Energy room_id={room_id} callbackSetSignIn={callbackSetSignIn} time_delay={15000} backend_host={backend_host} />  
                            </Box>

                        </Box>
                    </Box>

                    <Box sx={{
                        display: "flex",
                        alignSelf: "stretch",
                        minHeight: {
                            xs: "min(72vh, 640px)",
                            md: "clamp(560px, calc(100vh - 190px), 920px)",
                        },
                        minWidth: 0,
                    }}
                    >
                        <Options
                            room_id={room_id}
                            callbackSetSignIn={callbackSetSignIn}
                            configurationNodeAll={configurationNodeAll}
                            setListNode = {setListNode}
                            setSeparate = {setSeparate}
                            isImageFetched = {isImageFetched}
                            widthMap="100%"
                            data_passed_from_landingpage={data_passed_from_landingpage}
                        />
                    </Box>

                    <Box className="dashboard-right-column" sx={{ minWidth: 0, height: "auto", pr: 0.5, overflow: "visible" }}>
                        <DetailNode
                            room_id={room_id}
                            callbackSetSignIn={callbackSetSignIn}
                            listNode={visibleDetailNodes}
                            refreshInterval={LIVE_REFRESH_MS}
                        />
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                        alignItems: "stretch",
                        gap: 1.5,
                        p: "8px",
                        mt: 0,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Box 
                            sx={{
                                ...panelSx,
                                minHeight: "clamp(230px, 27vh, 340px)",
                            }}
                            width="100%" height="100%"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justify="center"
                        >
                            <EnergyChart room_id={room_id} callbackSetSignIn={callbackSetSignIn} time_delay={15000} backend_host={backend_host}/>
                        </Box>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Box 
                            sx={{
                                ...panelSx,
                                minHeight: "clamp(230px, 27vh, 340px)",
                            }}
                            width="100%" height="100%"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justify="center"
                        >
                            {   // bo phan optionChartData
                                optionChartData === "now" ?
                                <Chart
                                        room_id={room_id}
                                        callbackSetSignIn={callbackSetSignIn}
                                        timedelay={30000}
                                        optionData={optionChartData}
                                        apiInformationTag={apiInformationTag}
                                />
                                :
                                <Chart
                                        room_id={room_id}
                                        callbackSetSignIn={callbackSetSignIn}
                                        timedelay={30000}
                                        optionData={optionChartData}
                                        apiInformationTag={apiInformationTag}
                                />
                            }
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    </>
    );
}

export default Dashboard;
