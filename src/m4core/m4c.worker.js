const msgpack = require("msgpack-lite");
const BSON = require('bson');
const pako = require('pako');

// 解壓縮 binary(Unit8Array)
uncompressBinary = function(u8) {
	let self = this;
	let data = {};
	let u8content = u8.slice(1);
	// M4C 壓縮機制 : 第一個 byte 代表用哪種方式壓縮
	let compressType = String.fromCharCode(u8[0]);
	// MESSAGE-PACK
	if (compressType === "M") {
		data = msgpack.decode(u8content);
	}
	// GZip 解壓縮
	else if (compressType === "G") {
		// 解壓縮
		let result = pako.inflate(u8content, {to: 'string'});
		data = JSON.parse(result);
	}
	// BSon 解壓縮 -> 目前無法在 web worker 解，只能回主線程解
	else if (compressType === "B") {
		data = BSON.deserialize(u8content);
	}
	return data;
};
onmessage = function(e) {
	let {action, dataType, unicqueKey, payload, dataTypeKey} = e.data;
	switch (action) {
		case 'uncompressBinary':
			// ArrayBuffer -> Uint8Array
			if (payload instanceof ArrayBuffer) {
				payload = new Uint8Array(payload);
			}
			let decompressedData = uncompressBinary(payload);
			postMessage({dataType, unicqueKey, decompressedData, dataTypeKey});
		break;
	}
};
