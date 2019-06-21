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

import { default as nodeFetch } from 'node-fetch';
import { ClientFactory, Client } from 'bankpass-core';
import { createSign } from 'crypto';

class NodeClient extends Client {
    protected fetch = nodeFetch;

    /**
     * Sign the data using the private key and returns the signature
     *
     */
    protected sign(data: any): Promise<string> {
        const sign = createSign('SHA256');
        sign.update(JSON.stringify(data));
        sign.end();
        return Promise.resolve(sign.sign(this.key, 'hex'));
    }
}

export const NodeClientFactory: ClientFactory = {
    getClient: opts => {
        return new NodeClient(opts);
    },
};
