import React from 'react'
import { Grid } from '@mui/material'
import SensorInfo from './SensorInfo';
import ActuatorInfo from './ActuatorInfo';

function DetailNode({room_id, callbackSetSignIn, listNode, refreshInterval}) {
  const sensors = listNode.filter((node) => node.type === "sensor")
  const actuators = listNode.filter((node) => node.type === "actuator")
  return (
    <Grid item container direction="column" spacing={2} sx={{
      height: "auto",
      width: "100%",
      "@media (min-width: 900px) and (max-aspect-ratio: 4/3)": {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(260px, 1fr))",
        gap: 2,
        margin: 0,
        "& > .MuiGrid-item": {
          paddingLeft: "0 !important",
          paddingTop: "0 !important",
          width: "100%",
          maxWidth: "none",
        },
      },
    }}>
      <Grid item sx={{ width: "100%" }}>
        <SensorInfo
          room_id = {room_id}
          callbackSetSignIn = {callbackSetSignIn}
          sensors = {sensors}
          refreshInterval = {refreshInterval}
        />
      </Grid>

      <Grid item sx={{ width: "100%" }}>
        <ActuatorInfo
          room_id = {room_id}
          callbackSetSignIn = {callbackSetSignIn}
          actuators = {actuators}
          refreshInterval = {refreshInterval}
        />
      </Grid>
  </Grid>
  )
}

export default DetailNode
