import React from "react";
import {BasicAgents,Live,Coverage,Inventory,Shadow,ActiveAgent,Limits,Identity} from "./screens-base.jsx";
import {MCP,Policy,Guide,Approvals,Search,Forensic} from "./screens-later.jsx";
const screens={
 "s0-connect":BasicAgents,
 "s0-live":Live,
 "s1-coverage":Coverage,
 "s1-inventory":Inventory,
 "s1-shadow":Shadow,
 "s2-activate":ActiveAgent,
 "s2-limits":Limits,
 "s3-identity":Identity,
 "s3-user-spend":()=> <Limits byUser={true}/>,
 "s4-mcp":MCP,
 "s4-policy":Policy,
 "s4-guide":Guide,
 "s5-approvals":Approvals,
 "s6-search":Search,
 "s6-forensic":Forensic
};
export function RenderScreen({id}){
 const Component=screens[id]||BasicAgents;
 return <Component/>;
}
