import {Auth, AuthOptions} from "./auth";
import {Client} from "./client";
import {IdentificationRequestOptions} from "./types/IdentificationRequestOption";
import {Paths} from "./types/Paths";

export {ServiceAccountOptions} from "./types/ServiceAccountOptions";
export {KeyType} from "./types/KeyType";
export { IdentificationRequestOptions };

export class Bankpass {

    private _client: Client;
    private authModule: Auth;

    constructor(private opts: AuthOptions) {
        this.authModule = new Auth(opts);
    }

    requestUserIdentification = async (opts: IdentificationRequestOptions): Promise<{ orderId: string }> => {
       const client: Client = await this.getClient();
       return client.request(Paths.AUTH, opts);
    };

    requestUserSignature = (userId: string) => { throw 'Not implemented yet' };

    collectResponse = async (orderId: string) => {
        const client: Client = await this.getClient();
        return client.request(Paths.COLLECT, { orderId });
    };

    getActivationCode = async (userId: string) => {
        const client: Client = await this.getClient();
        return client.request(Paths.CODE, { userId });
    };



    async getClient(): Promise<Client> {
        if(this._client) {
            return this._client;
        }

        this._client = await this.authModule.getClient();
        return this._client
    }

    public async setAccessToken(token: string) {
        if(!this._client) {
            await this.getClient();
        }

        this._client.setAccessToken(token);
    }

}

