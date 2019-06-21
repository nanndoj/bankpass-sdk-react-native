import { Bankpass, ServiceAccountOptions } from './index';
import credentials from './test.config.json';
import fetch from 'node-fetch';
import { MAX_RETRIES } from 'bankpass-core';
import { Paths } from 'bankpass-core';

const USER_ID = 'any-valid-user-id';
const ACCESS_TOKEN = 'valid-access-token';
const ORDER_ID = 'order-id';

const opts = {
    userId: USER_ID,
    requirements: [],
};

describe('requestIdenfitication', () => {
    beforeEach(() => fetch.reset());

    test('should create a client using the credential object', () => {
        const client = new Bankpass({
            credentials: credentials as ServiceAccountOptions,
        });

        expect(client.requestUserIdentification).toBeTruthy();
    });

    test('should create a client using the config file path', () => {
        const client = new Bankpass({
            keyFile: './test.config.json',
        });

        expect(client.requestUserIdentification).toBeTruthy();
    });

    test('should retry in case of fail', done => {
        const client = new Bankpass({
            keyFile: './test.config.json',
        });

        fetch.mock('*', 500);

        client.requestUserIdentification(opts).catch(error => {
            expect(fetch.calls().length).toEqual(MAX_RETRIES);
            done();
        });
    });

    test('should issue a token request when requesting the user identification', done => {
        const client = new Bankpass({
            keyFile: './test.config.json',
        });

        fetch.mock('*', { accessToken: ACCESS_TOKEN });

        client.requestUserIdentification(opts).then(response => {
            expect(fetch.calls()[0][0]).toEqual(credentials.token_uri);
            done();
        });
    });

    test('should use the cached token when requesting the user identification', done => {
        const client = new Bankpass({
            keyFile: './test.config.json',
        });

        fetch.mock('*', { accessToken: ACCESS_TOKEN });

        // Force the access token to be cached
        return client.setAccessToken(ACCESS_TOKEN).then(() => {
            return client.requestUserIdentification(opts).then(response => {
                // A call to the access token should not be made
                expect(fetch.calls()[0][0]).not.toEqual(credentials.token_uri);
                done();
            });
        });
    });

    test('should sign the request for the access token', done => {
        const client = new Bankpass({
            keyFile: './test.config.json',
        });

        fetch.mock('*', { accessToken: ACCESS_TOKEN });

        return client.requestUserIdentification(opts).then(response => {
            // A call to the access token should not be made
            const tokenRequest = fetch.calls()[0][1];
            const body = JSON.parse(tokenRequest.body);
            expect(tokenRequest.headers.signature).toBeTruthy();
            expect(body.timestamp).toBeTruthy();
            done();
        });
    });

    test('should use the access token in the identification request', done => {
        const client = new Bankpass({
            keyFile: './test.config.json',
        });

        fetch.mock('*', { orderId: ORDER_ID });

        // Force the access token to be cached
        return client.setAccessToken(ACCESS_TOKEN).then(() => {
            return client.requestUserIdentification(opts).then(response => {
                const authRequest = fetch.calls()[0][1];
                // A call to the access token should not be made
                expect(authRequest.headers.Authorization).toEqual(
                    `Bearer ${ACCESS_TOKEN}`
                );
                done();
            });
        });
    });

    test('should return the orderId when requesting a user identification', done => {
        const client = new Bankpass({
            credentials: credentials as ServiceAccountOptions,
        });

        fetch.mock(credentials.token_uri, { accessToken: ACCESS_TOKEN });
        fetch.mock([credentials.api_endpoint, Paths.AUTH].join(''), {
            orderId: ORDER_ID,
        });

        // Force the access token to be cached
        return client.setAccessToken(ACCESS_TOKEN).then(() => {
            return client.requestUserIdentification(opts).then(response => {
                expect(response.orderId).toEqual(ORDER_ID);
                done();
            });
        });
    });

    test('should try to get a new access token when the current one is expired', done => {
        const client = new Bankpass({
            credentials: credentials as ServiceAccountOptions,
        });

        fetch.mock(credentials.token_uri, { accessToken: ACCESS_TOKEN });
        fetch.mock([credentials.api_endpoint, Paths.AUTH].join(''), 403, {
            exception: 'Token Expired',
        });

        // Force the access token to be cached
        return client.setAccessToken(ACCESS_TOKEN).then(() => {
            return client.requestUserIdentification(opts).catch(() => {
                const tokenRequest = fetch.calls()[1][0];
                expect(tokenRequest).toEqual(credentials.token_uri);
                done();
            });
        });
    });

    test('should provide the reason why the request was denied', done => {
        const client = new Bankpass({
            credentials: credentials as ServiceAccountOptions,
        });

        fetch.mock(credentials.token_uri, { accessToken: ACCESS_TOKEN });
        fetch.mock([credentials.api_endpoint, Paths.AUTH].join(''), 403, {
            exception: 'Token Expired',
        });

        // Force the access token to be cached
        return client.setAccessToken(ACCESS_TOKEN).then(() => {
            return client.requestUserIdentification(opts).catch(err => {
                expect(err.status).toBeTruthy();
                done();
            });
        });
    });
});
