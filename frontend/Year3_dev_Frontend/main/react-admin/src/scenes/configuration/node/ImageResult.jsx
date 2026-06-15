import { useState, useEffect, useCallback} from "react";
import { host } from "../../../App";
import { Typography, Grid, Button, Tooltip, Box } from "@mui/material";

function ImageResult({roomIdForNodeConfig, dataRoom, setData, algorithm, communicationRadius, sensingRadius, numberNode}) {
  const url = `http://${host}/api/result_coverage_algorithm?room_id=${roomIdForNodeConfig}&&algorithm=${algorithm}`;
  const [imageDecode, setImageDecode] = useState(null);
  const [imageEncode, setImageEncode] = useState(null);
  const [state, setState] = useState(true);
  const uploadedCoverageImage = dataRoom?.uploadedCoverageImage || localStorage.getItem(`coverage_image:${roomIdForNodeConfig}`);
  const activeAlgorithmImage = state ? imageDecode : imageEncode;
  const activeImage = uploadedCoverageImage || activeAlgorithmImage;
  const fetchAndEncodeImage = useCallback(async (url_image, cmd) => {
    try {
        url_image= `http://${host}` + url_image
        const response = await fetch(url_image);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);

        reader.onload = () => {
            const base64 = reader.result;
            localStorage.setItem(cmd, base64);
            if (cmd === "image_decode") setImageDecode(base64);
            if (cmd === "image_encode") setImageEncode(base64);
        };
    } catch (error) {
        console.error("Error:", error);
        }
    }, []);


  const handleLoad = useCallback(async() =>{
      const token = {access_token: null, refresh_token: null}
      if(localStorage.getItem("access") !== null && localStorage.getItem("refresh") !== null){
          token.access_token = localStorage.getItem("access");
          token.refresh_token = localStorage.getItem("refresh");
      } else {
          throw new Error("There is no access token and refresh token ....");
      }

      const headers = {
        "Content-Type" : "application",
        "Authorization": `Bearer ${token.access_token}`
      }

      const option_fetch={
        "method": "GET",
        "headers": headers,
        "body": null,
      }

      const response = await fetch(url, option_fetch)
      if(response.status === 200){
        const data = await response.json()
        setData(data)
        fetchAndEncodeImage(data.image_decode, "image_decode")
        fetchAndEncodeImage(data.image_encode, "image_encode")
      } else {
        console.info("Coverage algorithm result is not ready yet.");
      }
  }, [fetchAndEncodeImage, setData, url])

  useEffect(()=>{
    handleLoad();
    const timer = setInterval(() => {
        handleLoad();
    }, 60000);
    return () => clearInterval(timer);
    },[handleLoad])
  return (
    <>
        <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ flex: 1, minHeight: 0 }}>
            {activeImage ?
            <>
            <Grid item container direction="column" alignItems="center" justifyContent="center" sx={{ minHeight: 0, flex: 1, width: "100%", overflow: "hidden" }}>
              <Tooltip style={{
                    fontSize: "14px",
                    backgroundColor: "white",
                    border: '1px solid #eeeeee',
                    maxWidth: 400,
                    whiteSpace: 'normal'
                }}
                placement="left"
                title={
                    <Grid>
                        <Typography color="inherit">{`Algorithm: ${algorithm}`}</Typography>
                        <Typography color="inherit">{`Number Node: ${numberNode}`}</Typography>
                        <Typography color="inherit">{`Sensing Radius: ${sensingRadius}`}</Typography>
                        <Typography color="inherit">{`Communication Radius: ${communicationRadius}`}</Typography>
                        <Typography color="inherit">{`Detail: The image shows the positions of sensor nodes in the network, along with the coverage area of each node and their connectivity with neighboring nodes, aiming to achieve optimal coverage within the room.`}</Typography>
                    </Grid>
                }
                >
                <Box
                  component="img"
                  src={activeImage}
                  alt="Coverage optimization result"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                    mx: "auto",
                  }}
                />
              </Tooltip>
            </Grid>
            {imageDecode && imageEncode && !uploadedCoverageImage &&
            <Button sx={{
                          backgroundColor: "black",
                          color: "white",
                          fontSize: "13px",
                          fontWeight: "bold",
                          padding: "4px 12px",
                          mt: 1,
                          "&:hover": { backgroundColor: "#6d65ea" }
                          }}
                      variant="contained"
                      onClick = {()=> setState(!state)}
            >Change Image</Button>
            }
            </>
            :
            <Box
              sx={{
                flex: 1,
                width: "100%",
                minHeight: { xs: 190, md: 240 },
                border: "1px dashed",
                borderColor: "background.borderStrong",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                px: 2,
                bgcolor: "background.surfaceRaised",
              }}
            >
              <Typography variant="h5" fontWeight="bold" color="text.secondary">
                No coverage image. Add an image or run algorithm setting.
              </Typography>
            </Box>
            }
        </Grid>
    </>
  )
}

export default ImageResult
