const toBase64 = (str) => Buffer.from(str || '', 'utf8').toString('base64');

exports.toBase64 = toBase64;
