import * as React from 'react';
import { useState } from 'react';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Header from '../../components/Header';
import { Container, Box, useTheme } from '@mui/material';
import Paper from '@mui/material/Paper';
import RoomConfig from './room/RoomConfig';
import NodeConfig from './node/NodeConfig';

export default function Configuration() {
    const [config, setConfig] = useState(0);
    const [roomIdForNodeConfig, setRoomIdForNodeConfig] = useState(0);
    const [roomSize, setRoomSize] = useState({x: 0, y: 0});
    const theme = useTheme();
    const dict = {
        0: <RoomConfig setConfig={setConfig} setRoomIdForNodeConfig={setRoomIdForNodeConfig} setRoomSize={setRoomSize}/>, 
        1: <NodeConfig roomIdForNodeConfig={roomIdForNodeConfig} setConfig={setConfig} roomSize={roomSize}/>
    };
    return (
        <Container
            maxWidth={false}
            disableGutters
            sx={{
                minHeight: "100%",
                bgcolor: theme.palette.background.default,
                px: { xs: 1.5, md: 2.5 },
                py: { xs: 1.5, md: 2 },
            }}
        >
            {
                dict[config]
            }
        </Container>
    );
}
