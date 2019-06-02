/**
 * Copyright 2019 Bankpass Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {ServiceAccountOptions} from "./types/ServiceAccountOptions";
import { createSign } from "crypto";
import fetch from "node-fetch";
import { RETRY_DELAY_MS, MAX_RETRIES } from "./constants";
import { RequestStatus } from "./types/RequestStatus";

export class Client  {

    email: string;
    key: string;
    keyId: string;
    projectId: string;
    tokenURI: string;
    apiEndpoint: string;

    private accessToken: string;

    constructor(private opts: ServiceAccountOptions) {
        this.fromJSON(opts);
    }

    /**
     * Create a credentials instance using the given input options.
     * @param json The input object.
     */
    fromJSON(json: ServiceAccountOptions): void {
        if (!json) {
            throw new Error(
                'Must pass in a JSON object containing the service account auth settings.'
            );
        }
        if (!json.private_key) {
            throw new Error(
                'The incoming JSON object does not contain a private_key field'
            );
        }

        // Extract the relevant information from the json key file.
        this.key = json.private_key;
        this.keyId = json.private_key_id;
        this.projectId = json.project_id;
        this.tokenURI = json.token_uri;
        this.apiEndpoint = json.api_endpoint;
    }

    /**
     * Sign the data using the private key and returns the signature
     *
     */
    private sign(data: any): string {
        const sign = createSign('SHA256');
        sign.update(JSON.stringify(data));
        sign.end();
        return sign.sign(this.key, 'hex');
    }

    public request(path: string, body: any): Promise<any> {
        // Get an access Token
        return this.authorizedFetch(this.apiEndpoint + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

    }

    private fetchWithRetry = (url, options, n = 1) => {
        return new Promise((resolve, reject) => {
            fetch(url, options)
                .then(response => {
                    if (response.status >= 400 && response.status < 410) {
                        return response.text().then(text => {
                            let reason;
                            try {
                                reason = JSON.parse(text)
                            } catch(ex) {
                                reason = text ? new Error(text) : {};
                            }
                            throw {
                                status: RequestStatus.UNAUTHORIZED,
                                reason
                            }
                        });
                    }

                    if (response.status !== RequestStatus.SUCCESS) {
                        throw response;
                    }

                    resolve(response.json());
                })
                .catch(error => {
                    if(error.status === RequestStatus.UNAUTHORIZED) return reject(error);
                    if (n === MAX_RETRIES) return reject(error);

                    setTimeout(() => {
                        this.fetchWithRetry(url, options, n + 1)
                            .then(resolve)
                            .catch(reject)
                    }, RETRY_DELAY_MS);
                });
        });
    };

    private authorizedFetch = (url, request) => {
        return new Promise((resolve, reject) => {
            return this.getAccessToken()
                .then(token => {
                    // A token was found. We will now issue a request to see
                    // if the token still valid
                    return this.fetchWithToken(url, request, token)
                        .then(resolve)
                        .catch(err => {
                            if (err && err.status === RequestStatus.UNAUTHORIZED) {
                                // The token is not valid anymore
                                // Getting a new access token
                                return this.fetchToken()
                                    .then(({ accessToken }) => {
                                        // Save the new token
                                        this.setAccessToken(accessToken);

                                        // issue the same request using the new token
                                        this.fetchWithToken(url, request, accessToken)
                                            .then(resolve)
                                            .catch(reject);
                                    })
                                    .catch(reject);
                            }

                            return reject(err);
                        });
                })
                .catch(reject);
        });
    };

    private getAccessToken = () => {
        const token = this.accessToken;

        // Check if there's an access token already
        if (!token) {
            // Get an access token
            return this.fetchToken()
                .then(({ accessToken }) => {
                    // save the token
                    this.setAccessToken(accessToken);
                    return accessToken;
                })
                .catch(err => {
                    if (
                        err instanceof TypeError &&
                        err.message === 'Network request failed'
                    ) {
                        throw err;
                    }


                    const errorBody = err._bodyText && JSON.parse(err._bodyText);
                    // It was unable to get a new access token in this device
                    // This device must be unauthorized immediately
                    if (errorBody && errorBody.meta && errorBody.meta.deauthorize) {
                        throw new Error(
                            'Invalid JSON configuration file.'
                        );
                    }

                    throw err;
                });
        }

        return Promise.resolve(token);
    };


    private fetchToken = () => {
        const preparedData = {
            keyId: this.keyId,
            timestamp: new Date().toISOString()
        };

        const signature = this.sign(preparedData);

        // Configure a new request to the token API
        const req = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'signature': signature
            },
            body: JSON.stringify(preparedData)
        };

        // Issue a request to get the token
        return this.fetchWithRetry(this.tokenURI, req);
    };


    public setAccessToken = (accessToken: string) => {
        this.accessToken = accessToken;
    };

    private fetchWithToken = (url, request, token) => {
        // Add the authentication header
        const req = {
            ...request,
            headers: {
                ...request.headers,
                Authorization: `Bearer ${token}`
            }
        };

        // Try to issue a new authorized request
        return this.fetchWithRetry(url, req);
    };
}