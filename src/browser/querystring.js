export const stringify = (data) => {
    return encodeURIComponent(Object.keys(data).map((key) => {
        const val = data[key];
        if (Array.isArray(val)) {
            return val.map(v => `${key}=${v}`).join('&');
        }
        return `${key}=${val}`;
    }).join('&'));
};

export const parse = (queryString) => {
    const params = {};

    const setVal = (obj, key, val) => {
        const keys = key.split('.');
        while (keys.length) {
            let top = keys.unshift();

            if (keys.length !== 0 && typeof obj[top] === 'undefined') {
                obj[top] = {};
            }

            if (keys.length === 0) {
                if (/\[\]$/.test(top)) {
                    top = top.replace(/(\[\])$/, '');
                    obj[top] = obj[top] || [];
                    obj[top].push(val);
                } else {
                    obj[top] = val;
                }
            }
        }
    };

    queryString.split('&').forEach((group) => {
        const pair = group.split('=');

        const key = pair[0].replace(/(\[\])$/, '');
        const val = pair[1];

        setVal(params, key, val);
    });

    return params;
};
