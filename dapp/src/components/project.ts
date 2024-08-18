import pkg from 'js-sha3';
const {keccak256} = pkg;
import { Buffer } from "buffer";

import Versioning from "../contracts/soroban_versioning";


const projectState: { project_name: string | undefined, project_id: Buffer | undefined } = {
  project_name: undefined,
  project_id: undefined,
};

function loadedProjectId(): Buffer | undefined {
  return projectState.project_id;
}



function setProjectId(project_name: string): void {
  projectState.project_name = project_name
  // @ts-ignore
  projectState.project_id = new Buffer.from(keccak256.create().update(project_name).digest());
}


async function getProjectHash(): Promise<string | void> {
  if (projectState.project_id === undefined) {
    console.error("No project defined")
    return
  }
  const res = await Versioning.get_commit({ project_key: projectState.project_id })
  return res.result;
}


export { getProjectHash, loadedProjectId, setProjectId };
