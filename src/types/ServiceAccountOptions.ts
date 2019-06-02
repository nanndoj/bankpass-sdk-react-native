import {KeyType} from "./KeyType";

export interface ServiceAccountOptions {
    "type": KeyType;
    "private_key_id": string;
    "private_key": string;
    "token_uri": string;
    "project_id": string;
    "api_endpoint": string;
}