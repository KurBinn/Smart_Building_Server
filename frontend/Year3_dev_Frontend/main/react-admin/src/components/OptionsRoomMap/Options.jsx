import { Box, Button, useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import Grid from '@mui/material/Grid';
import {host} from "../../App";
import RoomMap2D from "../Map2D/RoomMap2D";
import RoomMap from "../RoomMap/RoomMap2";
import RoomMapConnections from "../RoomMap/RoomMapConnections";
import { useTranslation } from "react-i18next";
import "../../utils/i18n"
import { getStoredRoomImage, saveRoomImage } from "../../utils/roomImage";

function Options({ room_id, callbackSetSignIn, configurationNodeAll, setListNode, setSeparate, isImageFetched, widthMap, heightMap, data_passed_from_landingpage}) {
    const {t} = useTranslation()
    const theme = useTheme();
    const [status, setStatus] = useState(true);
    const [statusConnections, setStatusConnections] = useState(false);
    const [image, setImage] = useState(() => getStoredRoomImage(room_id));

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const base64 = await convertToBase64(file);
            setImage(saveRoomImage(base64, room_id));
        }
    };

    useEffect(() => {
        setImage(getStoredRoomImage(room_id));
    }, [isImageFetched, room_id]);

    const toolbarButtonSx = {
        width: { xs: "calc(50% - 10px)", sm: "120px", lg: "140px" },
        minWidth: { xs: "96px", sm: "120px" },
        height: { xs: "44px", md: "48px", xl: "56px" },
        backgroundColor: theme.palette.background.surfaceRaised || theme.palette.background.paper,
        color: theme.palette.text.primary,
        fontSize: { xs: "14px", md: "16px", xl: "18px" },
        fontWeight: "bold",
        padding: "5px 10px",
        margin: "5px",
        border: `1px solid ${theme.palette.background.border || theme.palette.divider}`,
        borderRadius: "5px",
        "&:hover": { backgroundColor: theme.palette.action.hover }
    };

    return (
        <Box
            sx={{
                boxShadow: 0,
                border: `1px solid ${theme.palette.background.borderStrong || theme.palette.divider}`,
                borderRadius: '15px',
                backgroundColor: theme.palette.background.surface || theme.palette.background.paper,
                p:1
            }}
            width="100%" height="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
            minHeight={0}
        >
            <Grid sx={{ mb: 1, width: "100%", display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
                <Button sx={toolbarButtonSx}
                    onClick={() => {
                        setStatus(true)
                        setStatusConnections(false)
                        }}>
                    {t("room")}
                </Button>
                <Button sx={toolbarButtonSx}
                    onClick={() => {
                        setStatus(false)
                        setStatusConnections(false)
                    }}>
                    {t("heatmap")}
                </Button>
                <Button sx={toolbarButtonSx}
                    onClick={() => {
                        setStatus(false)
                        setStatusConnections(true)
                        }}>
                    {t("connections")}
                </Button>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                    id="upload-button"
                />
                <label htmlFor="upload-button">
                    <Button component="span"
                        sx={toolbarButtonSx}>
                        {t("import")}
                    </Button>
                </label>

            </Grid>
            {status? (
                <RoomMap2D room_id={room_id} url={image} configurationNodeAll={configurationNodeAll} setListNode={setListNode}
                callbackSetSignIn = {callbackSetSignIn} setSeparate = {setSeparate} widthMap={widthMap} heightMap={heightMap} data_passed_from_landingpage={data_passed_from_landingpage}/>
            ) : (statusConnections ?
                // <RoomMapConnections
                // room_id={room_id}
                // callbackSetSignIn={callbackSetSignIn}
                // backend_host={host}
                // setSeparate = {setSeparate}
                // />
                <RoomMap2D
                    room_id={room_id}
                    url={image}
                    configurationNodeAll={configurationNodeAll}
                    setListNode={setListNode}
                    callbackSetSignIn = {callbackSetSignIn}
                    setSeparate = {setSeparate}
                    widthMap={widthMap}
                    heightMap={heightMap}
                    statusConnections={statusConnections}
                    data_passed_from_landingpage={data_passed_from_landingpage}
                    />
                :
                <RoomMap
                room_id={room_id}
                callbackSetSignIn={callbackSetSignIn}
                backend_host={host}
                setSeparate = {setSeparate}
            />
            )}
        </Box>
    );
}

export default Options;
