const url = require('url');
const tunnel = require('tunnel-agent');

const defaultProxyHeaderWhiteList = [
    'accept',
    'accept-charset',
    'accept-encoding',
    'accept-language',
    'accept-ranges',
    'cache-control',
    'content-encoding',
    'content-language',
    'content-location',
    'content-md5',
    'content-range',
    'content-type',
    'connection',
    'date',
    'expect',
    'max-forwards',
    'pragma',
    'referer',
    'te',
    'user-agent',
    'via',
];

const defaultProxyHeaderExclusiveList = ['proxy-authorization'];

const constructProxyHost = uriObject => {
    const port = uriObject.port;
    const protocol = uriObject.protocol;
    let proxyHost = uriObject.hostname + ':';
    if (port) {
        proxyHost += port;
    } else if (protocol === 'https:') {
        proxyHost += '443';
    } else {
        proxyHost += '80';
    }

    return proxyHost;
};

const constructTunnelOptions = (options, proxyHeaders) => {
    const {
        proxy,
        hostname,
        port,
        auth,
        headers,
        ca,
        cert,
        key,
        passphrase,
        pfx,
        ciphers,
        rejectUnauthorized,
        secureOptions,
        secureProtocol,
    } = options;

    const tunnelOptions = {
        proxy: {
            host: proxy.hostname,
            port: +proxy.port,
            proxyAuth: proxy.auth,
            headers: proxyHeaders,
        },
        headers,
        ca,
        cert,
        key,
        passphrase,
        pfx,
        ciphers,
        rejectUnauthorized,
        secureOptions,
        secureProtocol,
    };
    return tunnelOptions;
};

const constructTunnelFnName = (protocol, proxyProtocol) => {
    const fromProtocol = protocol === 'https:' ? 'https' : 'http';
    const toProtocol = proxyProtocol === 'https:' ? 'Https' : 'Http';
    return [fromProtocol, toProtocol].join('Over');
};

const getTunnelFn = ({ protocol, proxy }) => {
    const tunnelFnName = constructTunnelFnName(protocol, proxy.protocol);
    return tunnel[tunnelFnName];
};

const constructProxyHeaderWhiteList = (headers, proxyHeaderWhiteList) => {
    const whiteList = proxyHeaderWhiteList.reduce((set, header) => {
        set[header.toLowerCase()] = true;
        return set;
    }, {});

    return Object.keys(headers)
        .filter(header => {
            return whiteList[header.toLowerCase()];
        })
        .reduce((set, header) => {
            set[header] = headers[header];
            return set;
        }, {});
};

const createTunnel = (options = {}) => {
    const tunnelFn = getTunnelFn(options);

    const {
        proxyHeaderExclusiveList = [],
        proxyHeaderWhiteList = [],
        headers = {},
    } = options;

    const proxyHeaders = constructProxyHeaderWhiteList(
        headers,
        proxyHeaderWhiteList.concat(defaultProxyHeaderWhiteList),
    );
    proxyHeaders.host = constructProxyHost(options);

    proxyHeaderExclusiveList
        .concat(defaultProxyHeaderExclusiveList)
        .forEach(key => {
            proxyHeaders[key] = null;
        });

    const tunnelOptions = constructTunnelOptions(options, proxyHeaders);
    return tunnelFn(tunnelOptions);
};

exports.defaultProxyHeaderWhiteList = defaultProxyHeaderWhiteList;
exports.defaultProxyHeaderExclusiveList = defaultProxyHeaderExclusiveList;
exports.createTunnel = createTunnel;
