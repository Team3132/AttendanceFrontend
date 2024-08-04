import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { FaCircleUser } from "react-icons/fa6";
import AsChildLink from "./AsChildLink";

interface DefaultAppBarProps {
  title: string;
}

export default function DefaultAppBar({ title }: DefaultAppBarProps) {
  return (
    <>
      <Helmet>
        <title>{`${title} - Attendance System`}</title>
      </Helmet>
      <AppBar
        position="absolute"
        sx={{
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <AsChildLink to="/profile">
            <IconButton>
              <FaCircleUser />
            </IconButton>
          </AsChildLink>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}
