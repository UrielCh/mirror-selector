import https from 'https';
import getFastest, { HostPort } from '.';

async function getMirrors() : Promise<HostPort[]>{
    return new Promise((resolve) => {
        const contents: string[] = [];
        https.get("https://www.debian.org/mirror/list", function(response) {
            response.setEncoding("utf8");
            response.on("data", (chunk) => {contents.push(chunk)})
            response.on("end", function () {
                console.log('total chunk: ', contents.length);
                const request = contents.join('');
                const all = request.matchAll(/http:\/\/(ftp\.[a-z0-9.-]+)\//g);
                const doms =  [...new Set([...all].map(a => a[1]))];
                const hp = doms.map(host => ({host, port: 80}));
                resolve(hp);
            });
          });
          
    })    
}

async function test() {
    const hostsPorts: HostPort[] = await getMirrors();
    const faster = await getFastest(hostsPorts, {timeout: 2000, concurrency: 5});
    console.log(faster);
}
test();