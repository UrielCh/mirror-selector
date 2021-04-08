# mirror-selector
Find fastest mirror to establish a TCP connection

## Usage sample:

This lib find the fastest link to a server.

### Classic usage:

You want to find the closest mirror to connect to it.
See test file for a code sample that find the closest debian deb mirror server.

### itinerant usage.

You have a database in your lan, that you can access with a VPN.
But you do not want to use the VPN when your a connected to the same lan.
Give thw VPN IP and the LAN IP to this API and use the fastest link to access the database.

## code sample

My redis database can be access as localhost, local network, or VPN.

```typescript
import getFastest from '.';

async code() {
    const server = await getFastest([
        {host: '127.0.0.1', port: 6379},
        {host: '192.168.1.4', port: 6379},
        {host: '10.0.10.4', port: 6379}\
    ], { timeout: 2000 });
    console.log('best link is: ', server);
}
```

This call will return me a localhost access if I'm on the server, a local access if I'm on the rigth network, a VPN access if I'm out of office, and off course will throw an Error if I have no access to my redis.
