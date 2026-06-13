import { useState, useEffect } from "react";
import { Box, Grid, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions} from "@mui/material";
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import { host } from "../../../App";

function SetTemperature({room_id, callbackSetSignIn, idNode, status, selectFunction, disabled = false}) {

  const [fanMode, setFanMode] = useState(1);
  const [open, setOpen] = useState(false);
  const handleIncreMode = () => {
    if (disabled) return;
    if (fanMode === 5) setFanMode(5);
    else setFanMode(fanMode + 1);
  }
  const handleDecreMode = () => {
    if (disabled) return;
    if (fanMode === 1) setFanMode(1);
    else setFanMode(fanMode - 1);
  }

  const handleAccept = async() => {
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
            "status": status ? 1 : 0,
            "setpoint": fanMode
          }),
      }
      await fetch(`http://${host}/api/set_actuator`, fetch_option);
  };
  
  return (
    <Grid container xs={12} sx={{mt: 1}} alignItems="center" justifyContent="center" spacing={1}>
      <Grid item xs={6} display="flex" justifyContent="center">
        <Button sx={{
          height:'60px',
          borderRadius: '50%',
          border: "2px solid",
          borderColor: "black",
          background: "aqua"
        }}>
          <h2 style={{ margin: 0}}>{disabled ? "NaN" : `Mode ${fanMode}`}</h2>
        </Button>
      </Grid>
      <Grid item xs={6} display="flex" flexDirection="column" justifyContent="center" gap={1}>
        <Button sx={{
          width: "5px",
          height: "40px",
        }}
          onClick={handleIncreMode}
          disabled={disabled}
        >
          <ArrowCircleUpIcon sx={{ fontSize: "2.5rem" }}/>
        </Button>
        <Button sx={{
          width: "5px",
          height: "40px",
        }}
        onClick={handleDecreMode}
        disabled={disabled}
        >
          <ArrowCircleDownIcon sx={{ fontSize: "2.5rem" }}/>
        </Button>
      </Grid>
        { !disabled && status === true
        ?
        <>
          <Button
          sx={{
                mt:1,
                borderRadius: 2,
                width: "10px",
                height: "40px",
              }}
          variant="contained"
          onClick={()=> setOpen(true)}
          >
          Send
        </Button>
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            maxWidth='xs'
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
            <DialogTitle id="alert-dialog-title" variant="h4" fontWeight='bold'>
            {"Confirm set fan mode"}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description" variant="h5">
                    {`Are you sure to set fan mode ${fanMode} ?`}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button style={{fontSize: '14px'}} onClick={() => setOpen(false)}>Disagree</Button>
                <Button style={{fontSize: '14px'}} onClick={handleAccept} autoFocus>Agree</Button>
            </DialogActions>
        </Dialog>
        </>
        : <h3>{disabled ? "NaN" : "Actuator is OFF"}</h3>}
    </Grid>
  )
}
export default SetTemperature
