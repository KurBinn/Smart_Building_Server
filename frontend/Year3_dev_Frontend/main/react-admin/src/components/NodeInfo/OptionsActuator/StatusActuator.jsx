import { useState, useEffect, useCallback } from "react";
import verify_and_get_data from "../../../function/fetchData";
import { host } from "../../../App";
import { Box, Grid, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions} from "@mui/material";
import AirIcon from '@mui/icons-material/Air';
import Header from "../../Header";

function StatusActuator({room_id, callbackSetSignIn, idNode, status, setStatus, selectFunction, disabled = false}) {
  const [speed, setSpeed] = useState(NaN);
  const [mode, setMode] = useState("NaN");
  const [updatedAt, setUpdatedAt] = useState(0);
  const [open, setOpen] = useState(false);

  const url = idNode ? `http://${host}/api/actuator_status?room_id=${room_id}&node_id=${idNode}` : null;

  const handleAgree = async() => {
    if (disabled || !idNode) return;
    setOpen(false);
    const access_token =localStorage.getItem("access");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access_token}`,
    }
    const fetch_option = {
        "method": "POST",
        "headers": headers,
        "body": JSON.stringify({
          "room_id": room_id,
          "node_id": idNode,
          "function": selectFunction,
          "mode": "manual",
          "status": status ? 0 : 1
        }),
    }
    await fetch(`http://${host}/api/set_actuator`, fetch_option);
};
  const getStatusActuator = useCallback(async (url, access_token) => {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access_token}`,
    }
    const fetch_option = {
        "method": "GET",
        "headers": headers,
        "body": null,
    }
    const response = await fetch(url, fetch_option);

    if(response.status === 200){
      const data = await response.json()
      const nextState = Number(data["state"]);
      setStatus(nextState === 1);
      const nextSpeed = Number(data["current_value"]);
      setSpeed(Number.isFinite(nextSpeed) ? nextSpeed : NaN);
      setMode(data["mode"] ?? "NaN");
      const nextUpdatedAt = Number(data["time"]);
      setUpdatedAt(Number.isFinite(nextUpdatedAt) ? nextUpdatedAt : 0);
    }
    else{
      setStatus(false);
      setSpeed(NaN);
      setMode("NaN");
      setUpdatedAt(0);
    }
  }, [setStatus])

  useEffect(()=>{
        if (!url || disabled) {
          setStatus(false);
          setSpeed(NaN);
          setMode("NaN");
          setUpdatedAt(0);
          return;
        }
        verify_and_get_data(getStatusActuator, callbackSetSignIn, host, url);
        const timer = setInterval(()=>{
            verify_and_get_data(getStatusActuator, callbackSetSignIn, host, url);
        }, 30000);
        return () => clearInterval(timer)
    },[url, disabled, callbackSetSignIn, setStatus, getStatusActuator]);

  const formatUpdatedAt = (timestamp) => {
    if (!timestamp) return "No data";
    const updatedDate = new Date(timestamp * 1000);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };
    return updatedDate.toLocaleDateString("en-US", options);
  };

  return (
      <Grid container item xs={12} alignItems="center" justifyContent="center" spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Button
            sx={{
              width: '50px',
              height: '60px',
              borderRadius: '50%',
              border: "solid 2px",
              backgroundColor: disabled || !idNode ? 'white' : (!status ? 'red' : "green"),
            }}
            disabled={disabled || !idNode}
            onClick={()=>setOpen(true)}
          >
            <h3>{disabled || !idNode ? "NaN" : (!status ? "Off" : "On")}</h3>
          </Button>
        </Grid>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              width: "300px",
              borderRadius: "10px"
            }
          }}
        >
          <DialogTitle id="alert-dialog-title" variant="h5" fontWeight="bold">
            {status ? "Confirm Turn OFF" : "Confirm Turn ON"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {status ? "Are you sure to turn off?" : "Are you sure to turn on?"}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button sx={{ fontSize: 14 }} onClick={() => setOpen(false)}>Disagree</Button>
            <Button sx={{ fontSize: 14 }} onClick={handleAgree} autoFocus>Agree</Button>
          </DialogActions>
        </Dialog>
        <Grid item xs={6} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <AirIcon style={{ fontSize: '3rem' }} />
            <Header title={`Fan speed mode: ${mode && mode !== "NaN" ? mode.toUpperCase() : "NaN"}`} fontSize="14px"/>
            <Header title={`PWM: ${Number.isFinite(speed) ? speed : "NaN"}`} fontSize="12px"/>
            <Header title={`updated on ${formatUpdatedAt(updatedAt)}`} fontSize="11px"/>
          </Box>
        </Grid>
      </Grid>

  )
}

export default StatusActuator
