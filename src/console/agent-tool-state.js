// Estados de demostración aislados por agente. La fuente seed del agente-demo
// conserva la compatibilidad con el prototipo previo; un agente nuevo no hereda
// las tools aprobadas ni los destinos de otro agente.
export const mcpFor=(state,agentId)=>state.toolsMcpByAgent?.[agentId]??(agentId==="agt-demo"?state.toolsMcp||[]:[]);
export const approvalsFor=(state,agentId)=>state.approvedToolsByAgent?.[agentId]??(agentId==="agt-demo"?state.approvedTools||[]:[]);
export const supervisionFor=(state,agentId)=>state.supervisionByAgent?.[agentId]??(agentId==="agt-demo"?state.supervision||{}:{});
export const setMcpFor=(state,agentId,tools)=>({...state,toolsMcpByAgent:{...state.toolsMcpByAgent,[agentId]:tools}});
export const setApprovalsFor=(state,agentId,tools)=>({...state,approvedToolsByAgent:{...state.approvedToolsByAgent,[agentId]:tools}});
export const setSupervisionFor=(state,agentId,controls)=>({...state,supervisionByAgent:{...state.supervisionByAgent,[agentId]:controls}});
