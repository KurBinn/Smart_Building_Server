import ContactPageIcon from '@mui/icons-material/ContactPage';
import { Grid, Button, Typography, useTheme } from "@mui/material"
import { useState } from 'react';
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault';
function ContactForm() {
  const [status, setStatus] = useState(false)
  const theme = useTheme();
  return (
    <Grid sx={{ position: "fixed", bottom: 0, right: 0, zIndex: 1000 }}>
      {status &&
          <DisabledByDefaultIcon
            sx= {{fontSize: "2rem", right: 2, position: "absolute", bottom: "68px", cursor: "pointer",}}
            onClick={()=> setStatus(false)}
      />}
      <Button
      sx={{
        mb: 2,
        mr: 1,
        display: "flex",
        flexDirection: "row",
        alignItems : "center",
        borderRadius: status ? "25px": "50%",
        border: `2px solid ${theme.palette.background.borderStrong || theme.palette.divider}`,
        backgroundColor: theme.palette.background.surfaceRaised || theme.palette.background.paper,
        color: theme.palette.text.primary,
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
        },
      }}
      onClick={()=> setStatus(true)}
      >
          <ContactPageIcon sx= {{fontSize: "3rem"}}/>
          {
          status &&
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSeISswyYk3nAW-WpLGpxwpxXxjRRJfMJEdUZgfnlXc30rUN3Q/viewform?usp=dialog" target="_blank" rel="noopener noreferrer"
          style={{ textDecoration: 'underline', color: theme.palette.text.primary }}
          >
            <Typography sx={{fontWeight: "bold"}}>Give Feedback</Typography>
          </a>
          }
      </Button>
    </Grid>
  )
}

export default ContactForm
