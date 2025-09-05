class _WSProto_ {constructor(){}
    /**
     * @param {string} type 
     * @param {string} data 
     * @returns {string}
     */
    encode(type, data) { return `${type}§+${data}` }

    // arguments
    /**
     * @param {string[]} args 
     * @returns {string}
     */
    encodeData(args) {
        let out = "";
        let _i = 0;
        for (const arg in args) {
            const length = arg.length;
            out += `${length},${arg}`;
            if (_i !== 0) out += "!"; 
        _i++; }
        return out;
    }
    /**
     * @param {string} data 
     */
    decodeData(data) {
        const [type, payload] = data.split('§+');
        let args = [];
        let i = 0;
        while (i < payload.length) {
            let commaIndex = payload.indexOf(',', i);
            if (commaIndex === -1) break;
            let len = parseInt(payload.slice(i, commaIndex), 10);
            i = commaIndex + 1;
            let value = payload.slice(i, i + len);
            args.push(value);
            i += len;
            if (payload[i] === '!') i++;
        }
        return {type, args};
    }

    // for msg encoding
    /**
     * @param {string} channel
     * @param {string} message
     */
    encodeMessage(channel, message) {
        const chnl = btoa(channel);
        const msg = Array.from(message).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
        return { message: msg, channel: chnl };
    }
    /**
     * @param {string[]} data
     */
    decodeMessage(data) {
        const decoded = this.decodeData(data[0]);
        decoded.args[0] = decoded.args[0].split('@');
        decoded.args[1] = data[1];
        const channel = atob(decoded.args[0][0]);
        const user = decoded.args[0][1];
        const msg = decoded.args[1];
        let message = '';
        for (let i = 0; i < msg.length; i += 2) {
            message += String.fromCharCode(parseInt(msg.substr(i, 2), 16));
        }
        return { channel, user, message };
    }
};
export const WSProtocol = _WSProto_.prototype;
