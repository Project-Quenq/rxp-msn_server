import * as fs from "fs";
import * as path from "path";
import { IConfig } from "./interfaces/IConfig.js";
import { MSNServer } from "./MSNServer.js";
const __dirname = import.meta.dirname;

new MSNServer(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), { encoding: 'utf-8' })) as IConfig);
// \`\${this.contactName} has just sent you a nudge!\` : \`You have sent a nudge!\`