exports.mergeParams = (target, source) => {
    const headers = Object.assign({}, source.headers, target.headers);
    const data = Object.assign({}, source.data, target.data);
    return Object.assign({}, source, target, {
        headers,
        data,
    });
};
