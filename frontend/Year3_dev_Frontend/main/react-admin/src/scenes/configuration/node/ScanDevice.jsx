import * as React from 'react';
import { useState, useContext, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Header from '../../../components/Header';
import { Container,Button, useTheme } from '@mui/material';
import { TableContainer } from "@mui/material";
import { host } from '../../../App';
import verify_and_get_data from '../../../function/fetchData';
import { UserContext } from '../../../App';
import verifyAccessToken from '../../../function/verifyAccessToken';
import verifyRefreshToken from '../../../function/verifyRefreshToken';

export default function ScanDevice({roomIdForNodeConfig}) {
  const theme = useTheme();
  const callbackSetSignIn = useContext(UserContext);
  const api = `http://${host}/api/all_scan_device?room_id=${roomIdForNodeConfig}`
  const backend_host = host;
  const [scanNodeData, setScanNodeData] = useState(null)
  const getAllScanDevice = async (url, access_token) =>
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

      if(response.status === 200)
      {
        const data = await response.json()
        setScanNodeData(data);
      }else{
        setScanNodeData(null);
      }
  }

  const handleDeleteClick= async (url) =>{

    const deleteNode = async(url, access_token)=>
      {
        const headers =
        {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
        }
        const option_fetch =
        {
            "method": "DELETE",
            "headers": headers,
            "body": null,
        }
        const response = await fetch(url, option_fetch);
  
        if(response.status === 200){
          alert("Delete Successfully")
        }
        else{
          alert("Some error happened, try to reload page!");
        }
    }

    if (window.confirm("Do you want to delete device ?")) {
      const token = {access_token: null, refresh_token: null}

      if(localStorage.getItem("access") !== null && localStorage.getItem("refresh") !== null){
          token.access_token = localStorage.getItem("access");
          token.refresh_token = localStorage.getItem("refresh");
      } else {
          throw new Error("There is no access token and refresh token ....");
      }

      if( await verifyAccessToken(backend_host, token) === true){
        deleteNode(url, token["access_token"])
      } else {
          if(await verifyRefreshToken(backend_host, token) === true){
            deleteNode(url, token["access_token"]);
          } else {
              callbackSetSignIn(false);
          }
      }
    } else {
      console.log("Cancel Delete");
  }

  }

  const handleAddClick= async(url, data) =>{
    const addNode = async(url, access_token)=>
      {
        const headers =
        {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
        }
        const body = JSON.stringify({
          "operator": "add_node",
          "status": 1,
          "info": {
              "room_id": roomIdForNodeConfig,
              "protocol": "ble_mesh",
              "remote_prov":{
                "enable": data.remote_enable,
                "unicast": data.remote_unicast,
              },
              "dev_info": {
                            "uuid": data.uuid,
                            "device_name": data.device_name,
                            "mac": data.mac,
                            "address_type": data.address_type,
                            "oob_info": data.oob_info,
                            "adv_type": data.adv_type,
                            "bearer_type": data.bearer_type,
                            "rssi": data.rssi
                          }
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
          alert("Processing add note please wait few minutes ....")
        }
        else{
          alert("Try again");
        }
    }

    if (window.confirm("Do you want to add device ?")) {
      const token = {access_token: null, refresh_token: null}

      if(localStorage.getItem("access") !== null && localStorage.getItem("refresh") !== null){
          token.access_token = localStorage.getItem("access");
          token.refresh_token = localStorage.getItem("refresh");
      } else {
          throw new Error("There is no access token and refresh token ....");
      }

      if( await verifyAccessToken(backend_host, token) === true){
        addNode(url, token["access_token"])
      } else {
          if(await verifyRefreshToken(backend_host, token) === true){
            addNode(url, token["access_token"]);
          } else {
              callbackSetSignIn(false);
          }
      }
    } else {
      console.log("Cancel Add");
  }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      verify_and_get_data(getAllScanDevice, callbackSetSignIn, backend_host, api);
    }, 5000);
    return () => clearInterval(timer);
  },[])
  return (
  <TableContainer sx={{ width: "100%", overflowX: "auto", bgcolor: "background.paper", height: { xs: "380px", md: "clamp(390px, 43vh, 520px)", xl: "clamp(420px, 44vh, 560px)" }, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', p:{ xs: 1, md: 2 }, alignItems: 'center', justifyContent: 'center',}} >
    <Header title={`Unprovisioned device in room ${roomIdForNodeConfig}`} fontSize="20px"/>
    <Table size="small" stickyHeader>
        <TableHead>
            <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.paper" }}>Device Name</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.paper" }}>Mac Address</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.paper" }}>UUID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.paper" }}>Bearer Type</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.paper" }}>Accept</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "15px", bgcolor: "background.paper" }}>Delete</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>

        { scanNodeData && scanNodeData.map((node, index) => (
        <TableRow key={index} hover>
          <TableCell sx={{ fontWeight: 400, fontSize: "13px" }}>{node.device_name}</TableCell>
          <TableCell sx={{ fontWeight: 400, fontSize: "13px" }}>{node.mac}</TableCell>
          <TableCell sx={{ fontWeight: 400, fontSize: "13px" }}>{node.uuid}</TableCell>
          <TableCell sx={{ fontWeight: 400, fontSize: "15px" }}>{node.bearer_type}</TableCell>
          <TableCell sx={{ width: "100px", "& .MuiInputBase-root": { height: 35 } }}>
          <Button sx={{ backgroundColor: "#0fa80f", color: "white", fontWeight: "bold", "&:hover": { backgroundColor: "#24d124" } }}
                      onClick={()=>{handleAddClick(`http://${host}/api/configuration_node_ble_mesh`, node)}} >
                Accept
          </Button>
        </TableCell>
        <TableCell sx={{ width: "100px", "& .MuiInputBase-root": { height: 35 } }}>
            <Button sx={{ backgroundColor: "#c5350d", color: "white", fontWeight: "bold", "&:hover": { backgroundColor: "#e55d37" },
                        }}
                        onClick={()=>{handleDeleteClick(`http://${host}/api/delete_device?node_id=${node.id}`)}}>
                Delete
            </Button>
        </TableCell>
    </TableRow>
))}
        </TableBody>
    </Table>
  </TableContainer>
  );
}
