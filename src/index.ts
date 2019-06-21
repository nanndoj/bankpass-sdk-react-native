import {
    Auth,
    AuthOptions,
    Client,
    IdentificationRequestOptions,
    Paths,
} from 'bankpass-core';
import { NodeClientFactory } from './node-client';

export { ServiceAccountOptions } from 'bankpass-core';
export { KeyType } from 'bankpass-core';

export { IdentificationRequestOptions };

export class Bankpass {
    private _client: Client;
    private authModule: Auth;

    constructor(private opts: AuthOptions) {
        this.authModule = new Auth(opts, NodeClientFactory);
    }

    requestUserIdentification = async (
        opts: IdentificationRequestOptions
    ): Promise<{ orderId: string }> => {
        const client: Client = await this.getClient();
        return client.request(Paths.AUTH, opts);
    };

    requestUserSignature = (userId: string) => {
        throw 'Not implemented yet';
    };

    collectResponse = async (orderId: string) => {
        const client: Client = await this.getClient();
        return client.request(Paths.COLLECT, { orderId });
    };

    getActivationCode = async (userId: string) => {
        const client: Client = await this.getClient();
        return client.request(Paths.CODE, { userId });
    };

    async getClient(): Promise<Client> {
        if (this._client) {
            return this._client;
        }

        this._client = await this.authModule.getClient();
        return this._client;
    }

    public async setAccessToken(token: string) {
        if (!this._client) {
            await this.getClient();
        }

        this._client.setAccessToken(token);
    }
}
