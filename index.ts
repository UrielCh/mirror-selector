import net from 'net';

export interface HostPort {
    host: string;
    port: number;
}

export interface HostPortResolved {
    host: string;
    port: number;
    open: boolean;
    durration: number;
}

type CancelablePromise<T> = Promise<T> & { cancel: () => void }

export const delay = (ms: number): CancelablePromise<any> => {
    let timeout: NodeJS.Timeout;
    let resolveP: (value?: any) => void;
    const prom: CancelablePromise<any> = new Promise(resolve => {
        resolveP = resolve;
        timeout = setTimeout(resolve, ms)
    }) as CancelablePromise<any>;
    prom.cancel = () => {
        clearTimeout(timeout);
        resolveP();
    };
    return prom;
}

export const getFastest = async (destinations: { host: string, port: number }[], options?: { timeout?: number, concurrency?: number }): Promise<{ host: string, port: number, open: boolean }> => {
    options = options || {};
    let timeout = options.timeout || 1000;
    const concurrency = options.concurrency || 3;
    let stop: undefined | ((value?: unknown) => void);

    const fastests: HostPortResolved[] = [];

    while (destinations.length) {
        const dests = destinations.splice(0, concurrency);
        console.log('testing', dests.map(a=>a.host).join(', '), 'timeout:', timeout);
        const killSwitchPromise = new Promise((resolve) => { stop = resolve });
        const sharedTimeOut = delay(timeout);
        const killSwitch = Promise.race([killSwitchPromise, sharedTimeOut])
        const fastest = await Promise.race(dests.map(({ host, port }) => isPortReachable(port, { host, killSwitch })));
        if (stop)
            stop();
        sharedTimeOut.cancel();
        if (fastest.open) {
            fastests.push(fastest);
            if (fastest.durration < timeout) {
                timeout = fastest.durration;
            }
        }
    }

    fastests.sort((a, b) => a.durration - b.durration);
    console.log(fastests);
    if (fastests.length) {
        return fastests[0];
    }
    throw Error('no open ports');
}

export const isPortReachable = async (port: number, opt: { killSwitch: Promise<any>, host?: string }): Promise<HostPortResolved> => {
    let { killSwitch, host = '127.0.0.1' } = opt;
    if (!killSwitch)
        killSwitch = delay(1000);
    // console.log('start', host);
    return new Promise(((resolve) => {
        let done = false;
        const start = Date.now();

        let socket = new net.Socket();
        const abort = () => {
            // console.log('abort', host);
            socket.destroy();
            if (!done) {
                const durration = Date.now() - start;
                resolve({ host, port, open: false, durration });
                done = true;
            }
        };
        // socket.setTimeout(timeout);
        killSwitch.then(abort);
        socket.once('error', abort);

        socket.connect(port, host, () => {
            // console.log('connected', host);
            socket.end();
            const durration = Date.now() - start;
            resolve({ host, port, open: true, durration });
            done = true;
        });
    }));
};

export default getFastest;
