<template>
    <div class="m4c hidden" />
</template>

<script>
import M4C_Event from '@/m4core/M4C.Event';
export default {
	mixins: [M4C_Event],
	props: [],
	data() {
		return {
			// 註冊指定 service 回呼
			mapServiceToDispatchFunction: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		window.M4C = this.$store.state.m4c.core = this;
		// 策略損益核心 (該核心使用 M4C，因此需要在 M4C Ready 的時候才能呼叫此核心 init)
		if (StrategyProfitLossCore)
			StrategyProfitLossCore.init();
	},
    methods: {
		// 重建連線狀態
		resetWsConn(btID) {
			let wsConn = this.wsConnMap[btID] || {};
			this.$set(this.$store.state.wsConnMap, btID, wsConn);
			this.$set(wsConn, "key", btID);
			this.$set(wsConn, "acReady", false);		// 該連線是否已經通過 AC 登入完成
			this.$set(wsConn, "loginReady", false);		// 該連線是否已完成登入 (用以判斷是否斷線自動重連)
			this.$set(wsConn, "connecting", true);		// 該連線是否正在連線中ing...
			this.$set(wsConn, "closed", false);			// 該連線是否已關閉/斷線
			this.$set(wsConn, "notReconnect", false);	// 該連線不允許自動重連
			this.$set(wsConn, "ACResponse", {});		// 該連線的 AC 登入回覆
			this.$set(wsConn, "$STATUS", "");
			this.$set(wsConn, "$CD", "");
			this.$set(wsConn, "responseData", {});
			if (wsConn.timeout)
				clearTimeout(wsConn.timeout);
			return wsConn;
		},
		connect(info) {
			let self = this;
			// 重查 client ipv4/ipv6
			M4C.IP.requestIP();
			// 重建連線狀態
			let wsConn = self.resetWsConn(info.btID);
			// 已存在 websocket 時，若狀態不是 1(OPEN) 時則不予使用 (斷線重連情境)
			if (info.websocket && info.websocket.readyState !== 1)
				delete info.websocket;
			// 每次都要建全新的 websocket
			let wsSocket = info.websocket || new WebSocket(info.host);
			// 指定 binary 資料為 arraybuffer 型態
			wsSocket.binaryType = "arraybuffer";
			wsSocket.uid = wsSocket.uid || ''.random();
			this.$set(wsConn, "socket", wsSocket);
			this.$set(wsConn, "info", info);
			// 自帶 websocket 的表示已經 onopen 完成
			if (info.websocket) self.$store.state.wsConnMap[this.btID] = 'OPEN';
			// 列印訊息
			console.log(M4C.getWsConnMark(wsConn), `M4C.connect`, info.host, info.websocket ? '(直接沿用連線)' : '');

			wsSocket.btID = info.btID;
			wsSocket.onopen = function(evt) {
				let wsConn = self.$store.state.wsConnMap[this.btID];
				wsConn.$STATUS = 'OPEN';
				console.log(M4C.getWsConnMark(wsConn), `websocket.onopen`, JSON.stringify(evt, ["code", "message", "type", "name"]));
			};
			wsSocket.onmessage = function(evt) {
				let wsConn = self.$store.state.wsConnMap[this.btID];
				self.onWsData(wsConn, evt.data);
			};
			wsSocket.onclose = function(evt) {
				let wsConn = self.$store.state.wsConnMap[this.btID];
				console.log(M4C.getWsConnMark(wsConn), `websocket.onclose : `, JSON.stringify(evt, ["code", "message", "type", "name"]));
				// 此 btID 已經存在新的連線 -> 本連線斷線不做任何處理 (避免已廢棄連線觸發斷線重連)
				if (wsConn.socket.uid !== this.uid) return;
				wsConn.connecting = false;
				self.onWsClose(wsConn, evt);
			};
			wsSocket.onerror = function(evt) {
				let wsConn = self.$store.state.wsConnMap[this.btID];
				console.log(M4C.getWsConnMark(wsConn), `websocket.onerror`, JSON.stringify(evt, ["code", "message", "type", "name"]));
			};
			// 十秒無法登入完成視為登入失敗
			wsConn.timeout = setTimeout((wsConn)=>{
				wsConn.connecting = false;
				wsConn.$CD = -99108;
				wsConn.$STATUS = 'TIMEOUT';
			}, 9998, wsConn);
			return wsConn;
		},
		// 指定 brokerID + traderID 斷線
		disconnect(brokerID, traderID) {
			let btID;
			// 相容報價連線
			if (brokerID === 'quote')
				btID = 'quote';
			// 相容不帶任何參數表示中斷當前選擇中的交易帳號的連線
			else if (!brokerID && !traderID)
				btID = `${this.selectedBTO.brokerID}|${this.selectedBTO.traderID}`;
			else
				btID = `${brokerID}|${traderID}`;
			let wsConn = this.wsConnMap[btID];
			this.disconnectWsConn(wsConn);
		},
		// 指定 wsConn 斷線
		disconnectWsConn(wsConn) {
			console.log(M4C.getWsConnMark(wsConn), `M4C.disconnect()`);
			clearTimeout(wsConn.timeout);
			M4C.send(`{"s":"ac","c":"logout"}`, {'wsConn': wsConn});
			wsConn.notReconnect = true;
			wsConn.loginReady = false;
			wsConn.connecting = false;
			// 沒有 $CD 時，清空 $STATUS (主動斷線情境)
			if (!wsConn.$CD)
				wsConn.$STATUS = '';
			console.log(M4C.getWsConnMark(wsConn), `disconnectWsConn.socket.close()`);
			wsConn.socket.close();
		},
		// 強制斷線重連
		reconnect(wsConn) {
			// 相容報價連線
			if (wsConn === 'quote')
				wsConn = this.wsConnMap.quote;
			wsConn = wsConn || this.selectedWSConn;
			wsConn.loginReady = false;
			wsConn.connecting = false;
			console.log(M4C.getWsConnMark(wsConn), `reconnect.socket.close()`);
			wsConn.socket.close();
		},
		// 強制斷線重連 (不依賴 close 的重連，因為懷疑有情境會讓 weboscket 無效卻也沒有 close)
		forceReconnect(wsConn) {
			wsConn = wsConn || this.wsConnMap.quote;
			// 強制斷線
			this.disconnectWsConn(wsConn);
			// 確保不延續使用舊的websocket
			delete wsConn.info.websocket;
			// 建立連線
			M4C.connect(wsConn.info);
		},
		// websocket 收到資料
		onWsData(wsConn, str) {
			// 有收到資料 (用來切分是否未成功連線就已發生中斷)
			this.receivedData = true;
			// 資料轉往解碼核心
			M4C.Decode.onData(wsConn, str);
		},
		// 註冊指定 service 要分派至哪個 function
		regDispatch(obj) {
			let self = this;
			let service = obj.s;
			let command = obj.c || 'ALL';
			let map = self.mapServiceToDispatchFunction;
			if (map[service] == null)
				map[service] = {};
			if (map[service][command] == null)
				map[service][command] = [];
			map[service][command].push(obj.callback);
		},
		// 資料分派
		dispatch(wsConn, data, orgStr) {
			let self = this;
			let service = data.s;
			let command = data.c;
			let str = orgStr || JSON.stringify(data);
			// 印收到的資料
			M4C.Console.logData({wsConn, str, data});

			// 錯誤代碼一律調整至 data.$CD
			data.$CD = data.cd;

			// 支持處理由 Dispatcher 代理的錯誤訊息
			M4C.processDispatcherError(data, wsConn);

			// 回覆內容轉語系
			if (service === 'TRADE') {
				data.$CD = data.d? data.d.CODE || data.cd: data.cd;
				self.responseChangeLanguage(data, "TRADE_");				
			}

			// 分派此 service 資料至有註冊的回呼
			let map = self.mapServiceToDispatchFunction;
			if (map[service]) {
				if (map[service][command]) {
					map[service][command].forEach((dispatchCB)=>{
						dispatchCB(data, wsConn);
					});
				}
				if (map[service]['ALL']) {
					map[service]['ALL'].forEach((dispatchCB)=>{
						dispatchCB(data, wsConn);
					});
				}
			}
		},
		// 由 Dispatcher 代理的各種錯誤代碼
		processDispatcherError(data, wsConn) {
			if (data.cd <= -10000 && data.cd > -20000) {
				M4C.responseChangeLanguage(data, "DISPATCHER_");
				// 在非開發者模式不提示無權限訊息，改log error方式記錄。
				if(data.cd === -10002 && !this.$store.state.device.isDVM) {
					console.error(`Dispatcher Error`, `(${data.s}/${data.c}) ${data.$MSG} (${data.cd})`, );
				}
				else {
					this.$store.state.notify({
						type: `error`,
						head: `Dispatcher Error`,
						body: `(${data.s}/${data.c}) ${data.$MSG}`,
					});
				}
			}
		},
		// 直接帶入 key 轉語系
		mappingLanguage(key) {
			return this.mappingTable[key] ? this.mappingTable[key][this.langCode] : null;
		},
		// 回覆內容轉語系 (轉語系結果一律放在 data.$MSG 內)
		responseChangeLanguage(data, prefix = "") {
			// if (data.cd == null) return;
			let dd = data.d;
			// 接受 server 來的 msg/MSG 欄位作為預設值 (無權限時沒有data.d資料)
			let msg = dd ? (dd.msg || dd.MSG || '') : '';
			// 優先使用 data.d.CODE 高於 data.cd
			let code = dd ? (dd.CODE || data.cd) : null;
			let txt = this.mappingLanguage(`${prefix}${code}`);
			return data.$MSG = txt || msg;
		},
		// 送出訊息
		send(data, param) {
			let self = this;
			try {
				let strData = typeof data === "object" ? JSON.stringify(data) : data;
				let objData = typeof data === "string" ? JSON.parse(data) : data;
				// 匹配要送出此命令的連線
				let wsConn;
				// 有指定 wsConn 時
				if (param && param.wsConn)
					wsConn = param.wsConn;
				// 命令的 "s" 有被指定往報價連線發時
				if (!wsConn && (this.$store.state.config.sendByQuote[objData.s] || param==='quote'))
					wsConn = this.wsConnMap.quote;
				// 其它時，使用當前選擇交易帳號的連線
				if (!wsConn)
					wsConn = this.selectedWSConn;

				if (!wsConn || !wsConn.socket || wsConn.socket.readyState !== 1) {
					return;
				}

				// 交易連線時，在送出之前塞入 BROKER_ID
				if (objData.s === "TRADE" && this.$store.state.login.brokerID && !objData.d.BROKER_ID) {
					objData.d.BROKER_ID = this.$store.state.login.brokerID;
					strData = JSON.stringify(objData);
				}

				// websocket.send 送出
				wsConn.socket.send(strData);
				// log command
				M4C.Console.logSend({wsConn, strData, objData});
			}
			catch(error){
				console.error(`M4C.send error`, error);
			}
		},
		// websocket 斷線
		onWsClose(wsConn, evt) {
			let self = this;
			// 斷線即視為 AC 登出
			wsConn.acReady = false;
			// 結束 PIN/PON 機制
			clearInterval(wsConn.pingInterval);
			// AC 回覆超過連線數，斷線後不再重連
			if (wsConn.acResponse && wsConn.acResponse.cd == '-651')
				return;
			// 已經被設定為不重連 (ex. 執行 disconnect 情境)
			if (wsConn.notReconnect)
				return;
			// 已斷線 (不使用 $CD, $STATUS 以免覆蓋 server 回覆)
			this.$set(wsConn, 'closed', true);
			// 已登入->發生斷線->背景自動重連
			if (wsConn.loginReady || wsConn.info.byReConnect) {
				// 暫停/背景化 -> 不自動重連
				if (this.pause) {
					console.log(M4C.getWsConnMark(wsConn), "NOT-RECONNECT by Pause");
				}
				else {
					// 斷線即視為未登入
					wsConn.loginReady = false;
					console.log(M4C.getWsConnMark(wsConn), "AUTO-RECONNECT");
					setTimeout((wsConn)=>{
						wsConn.info.byReConnect = true;
						M4C.connect(wsConn.info);
					}, 2000, wsConn);
				}
			}
			// 未登入 (連線階段就失敗)
			else {
				// wsConn.$CD = -100;
				// wsConn.$STATUS = 'CLOSE';
			}
		},
		// PING 機制，防止被 server 踢斷 (server 利用這個機制將閒置連線踢斷)
		startPing(data, wsConn) {
			// 取用 AC 回覆的 PING_TIME 作為發送間隔
			let timer = data.d.PING_TIME || 30000;
			console.log(M4C.getWsConnMark(wsConn), `啟動 pnr 機制 (${timer}ms), 發送 pnr 不印 log !`);
			wsConn.pingInterval = setInterval((wsConn)=>{
				M4C.send({"s": "dispatcher", "c": "pnr"}, {wsConn: wsConn});
			}, timer, wsConn);
		},
		// 取得識別代號
		getWsConnMark(wsConn) {
			return `[${wsConn.key}@${wsConn.socket.uid}]`;
		},
	},
	watch: {},
    computed: {
		langCode() {
			return this.$store.state.lang.language;
		},
		mappingTable() {
			return this.$store.state.lang.mappingTable;
		},
		wsConnMap() {
			return this.$store.state.wsConnMap;
		},
		selectedWSConn() {
			return this.$store.state.selectedWSConn;
		},
		/** 當前交易帳號 BTO 物件 */
		selectedBTO() {
			return this.$store.state.selectedBTO;
		},
		// 暫停/背景中
		pause() {
			return this.$store.state.status.pause;
		},
	},
}
</script>
