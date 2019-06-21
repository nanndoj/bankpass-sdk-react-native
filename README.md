# Bankpass nodejs SDK

Bankpass SDK for React Native

-   [Bankpass Client API Reference][client-docs]

[explained]: https://cloud.google.com/apis/docs/client-libraries-explained

**Table of contents:**

-   [Quickstart](#quickstart)
    -   [Before you begin](#before-you-begin)
    -   [Installing the client library](#installing-the-client-library)
    -   [Using the client library](#using-the-client-library)
-   [Samples](#samples)
-   [Versioning](#versioning)
-   [Contributing](#contributing)
-   [License](#license)

## Quickstart

### Before you begin

1.  [Select or create a Bankpass project][projects].
1.  [Enable the Authentication API][enable_api].
1.  [Set up authentication with a service account][auth] so you can access the
    API from your local workstation.

### Installing the client library

```bash
npm install react-native-bankpass
```

### Using the client library

#### Setup the client using your credentials

```javascript
const { Bankpass } = require('react-native-bankpass');
// import { Bankpass } from 'bankpass';

const client = new Bankpass({
    credentials,
});
```

#### Request the user identification

```javascript
client
    .requestUserIdentification({
        userId,
        requirements: [],
    })
    .then(response => {
        console.log(response.orderId);
    });
```

#### Request the user signature

```javascript
client
    .requestUserSignature({
        userId,
        requirements: [],
    })
    .then(response => {
        console.log(response.orderId);
    });
```
