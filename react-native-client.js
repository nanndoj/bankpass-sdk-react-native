//@flow
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

import { ClientFactory, Client } from 'bankpass-core';
import { RSA } from 'react-native-rsa-native';

class RNClient extends Client {
    fetch = fetch;

    /**
     * Sign the data using the private key and returns the signature
     *
     */
    sign(data: any): Promise<string> {
        return RSA.signWithAlgorithm(JSON.stringify(data), this.key, "SHA256withRSA");
    }
}

export const RNClientFactory: ClientFactory = {
    getClient: opts => {
        return new RNClient(opts);
    },
};
