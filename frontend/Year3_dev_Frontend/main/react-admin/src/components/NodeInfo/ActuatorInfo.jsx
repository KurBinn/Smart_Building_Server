import { Grid, Typography, Select, MenuItem, InputLabel} from "@mui/material";
import { useState, useEffect } from 'react';
import Header from "../../components/Header";
import StatusActuator from './OptionsActuator/StatusActuator';
import SetTemperature from './OptionsActuator/SetTemperature';
import SetTimer from './OptionsActuator/SetTimer';
import { useTranslation } from 'react-i18next';
import SetLight from './OptionsActuator/SetLight';

function ActuatorInfo({room_id, callbackSetSignIn, actuators}) {
  const {t} = useTranslation()
  const [status, setStatus] = useState(false);
  const [idNode, setIdNode] = useState("")
  const [selectFunction, setSelectFunction] = useState("Air")
  const [type, setType] = useState("Panasonic")
  const hasActuator = actuators.length > 0;
  useEffect(() => {
    if (actuators.length > 0) {
      setIdNode(actuators[0].id);
    } else {
      setIdNode("");
      setStatus(false);
    }
  }, [actuators]);
  return (
    <Grid container item textAlign='center'
      sx={{ border: "1px solid black", borderRadius: "15px", p: 0.75, backgroundColor: "background.paper" }}
    >

      <Grid item xs={12} sm={12} md={12} textAlign="center" justifyContent='center' >
        <Typography sx={{fontWeight: "bold", fontSize: "20px"}}> Actuator Info And Setting Mode </Typography>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={1}>
          <Grid item>
            <InputLabel sx={{ fontSize: "14px", color: "black",  marginTop: "0px", textAlign: "center", justifyContent: "center", fontWeight: "bold"}}> Node Id </InputLabel>
            <Select
              value={idNode}
              onChange={(e) => setIdNode(e.target.value)}
              disabled={!hasActuator}
              displayEmpty
              sx={{ width: 50, height: 30, fontWeight: "bold" }}
            >
              {!hasActuator && <MenuItem value="">NaN</MenuItem>}
              {actuators.map((node)=>
                <MenuItem value={node.id}>{node.id}</MenuItem>
              )}
            </Select>
          </Grid>
          <Grid item>
            <InputLabel sx={{ fontSize: "14px", color: "black",  marginTop: "0px", textAlign: "center", justifyContent: "center", fontWeight: "bold"}}> Function </InputLabel>
            <Select
              value={hasActuator ? selectFunction : ""}
              onChange={(e) => setSelectFunction(e.target.value)}
              disabled={!hasActuator}
              displayEmpty
              sx={{ width: 80, height: 30, fontWeight: "bold" }}
            >
                {!hasActuator && <MenuItem value="">NaN</MenuItem>}
                <MenuItem value="Air">Air</MenuItem>
                <MenuItem value="Light">Light</MenuItem>
            </Select>
          </Grid>
          {/* {selectFunction === "Air"?
          <Grid item>
            <InputLabel sx={{ fontSize: "14px", color: "black",  marginTop: "0px", textAlign: "center", justifyContent: "center", fontWeight: "bold"}}> Type </InputLabel>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              sx={{ width: 120, height: 30, fontWeight: "bold" }}
            >
                <MenuItem value="Panasonic">Panasonic</MenuItem>
                <MenuItem value="Daikin">Daikin</MenuItem>
                <MenuItem value="LG">LG</MenuItem>
            </Select>
          </Grid>
          :  null } */}
        </Grid>
      </Grid>

      <Grid item container direction='row' xs ={12} sx={{ mt: 1 }} spacing={1} justifyContent="space-between">
        <Grid item xs={12} sm={5.9} md={12} lg={5.9} sx={{
            border: '1px solid black',
            borderRadius: '8px',
            padding: 1,
          }}>
          <Header title = "Actuator Status" fontSize="18px"/>
            <StatusActuator
              room_id={room_id}
              callbackSetSignIn={callbackSetSignIn}
              idNode={idNode}
              status={status}
              setStatus={setStatus}
              selectFunction={selectFunction}
              disabled={!hasActuator}
            />
        </Grid>
        {selectFunction === "Air"?
        <Grid item xs={12} sm={5.9} md={12} lg={5.9}
        sx={{
          border: '1px solid black',
          borderRadius: '8px',
          padding: 1
        }}>
          <Header title = "Set Fan Mode" fontSize="18px"/>
          <SetTemperature
            room_id={room_id}
            callbackSetSignIn={callbackSetSignIn}
            idNode={idNode}
            status={status}
            selectFunction={selectFunction}
            disabled={!hasActuator}
          />
        </Grid>:
        <Grid item xs={12} sm={5.9} md={12} lg={5.9}
        sx={{
          border: '1px solid black',
          borderRadius: '8px',
          padding: 1
        }}
        >
        <Header title = "Set Light" fontSize="18px"/>
        <SetLight
          room_id={room_id}
          callbackSetSignIn={callbackSetSignIn}
          idNode={idNode}
          status={status}
          selectFunction={selectFunction}
          disabled={!hasActuator}
        />
        </Grid>
        }
      </Grid>
    
      <Grid container xs ={12} sx={{ mt:1,
              border: '1px solid black',
              borderRadius: '8px',
              padding: 1.5,
              }}
              justifyContent="center">
        <Header title = "Set Time Fan Mode" fontSize="20px"/>
        <SetTimer
          room_id={room_id}
          callbackSetSignIn={callbackSetSignIn}
          idNode={idNode}
          status={status}
          selectFunction={selectFunction}
          disabled={!hasActuator}
        />
      </Grid>
    </Grid>
  )
}

export default ActuatorInfo
