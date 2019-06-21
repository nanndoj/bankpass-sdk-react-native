//@flow
import {
    Auth,
    AuthOptions,
    Client,
    IdentificationRequestOptions,
    Paths,
} from 'bankpass-core';
import { RNClientFactory } from './react-native-client';

export { ServiceAccountOptions } from 'bankpass-core';
export { KeyType } from 'bankpass-core';

export { IdentificationRequestOptions };

export class Bankpass {
    _client: Client;
    authModule: Auth;

    constructor(opts: AuthOptions) {
        this.authModule = new Auth(opts, RNClientFactory);
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

    async getClient(): Promise<Client> {
        if (this._client) {
            return this._client;
        }

        this._client = await this.authModule.getClient();
        return this._client;
    }

    async setAccessToken(token: string) {
        if (!this._client) {
            await this.getClient();
        }

        this._client.setAccessToken(token);
    }
}