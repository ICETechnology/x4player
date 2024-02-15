<template>
    <div class="m4c-ac hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
const CryptoJS = require('crypto-js');

export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			// 密碼 map PBKDF2 (避免同密碼反覆編的優化)
			mapPwdToPBKDF2: {},
			acToken:[],
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.AC = this.$store.state.m4c.ac = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'ac', 'c': 'tk.get', 'callback': this.onTkGetData.bind(this)});		
		M4C.regDispatch({'s': 'ac', 'c': 'perm', 'callback': this.onPermData.bind(this)});		
		M4C.regDispatch({'s': 'ac', 'c': 'acstk.get', 'callback': this.login3rdGetSIG.bind(this)});		
		M4C.regDispatch({'s': 'ac', 'c': 'usr.upd', 'callback': this.onChangePwdData.bind(this)});		
		M4C.regDispatch({'s': 'ac', 'c': 'login.upd.pwd', 'callback': this.onLoginData.bind(this)});		
		M4C.regDispatch({'s': 'ac', 'c': 'acstk.login', 'callback': this.onLoginData.bind(this)});		
		M4C.regDispatch({'s': 'ac', 'c': 'ezlogin', 'callback': this.onLoginData.bind(this)});		
		M4C.regDispatch({'s': 'ac', 'c': 'login.upd.pwd', 'callback': this.onLoginData.bind(this)});		
	},
    methods: {
		onTkGetData(data, wsConn) {
			if (data.$CD == 1 && data.d.TKS)
				this.acToken = data.d.TKS;
		},
		// AC 權限問題
		onPermData(data, wsConn) {
			// 回覆內容轉語系
			M4C.responseChangeLanguage(data, "AC_");
			M4C.trigger("AC-PERM-ERROR", data, wsConn);
		},
		// 登入
		login(data, wsConn) {
			// 台新
			if (this.enableEZLogin)
				this.ezlogin(data, wsConn);
			// 富邦 (富邦 ss2-ac 升級 2.21.0+ 後，就可以刪除所有 login3rd 相關功能)
			else if (wsConn.info.login3rd)
				this.login3rd(data, wsConn);
		},
		// 簡易登入
		ezlogin(data, wsConn) {
			let cmd = {};
			cmd.s = 'ac';
			cmd.c = 'ezlogin';
			cmd.r = ''.random();
			cmd.d = {};
			cmd.d.COMPANY = wsConn.info.comp;
			cmd.d.PRODUCT = wsConn.info.prod;
			cmd.d.LOGIN = wsConn.info.user;
			cmd.d.PWD = this.getEZLoginPassword(`${wsConn.info.user}${wsConn.initCode}`);
			// 有被拿去解析，不可隨便調整
			cmd.d.APP = `${this.projectID}.${this.deviceType}`;
			cmd.d.RT_PERMS = true;					// 是否回傳帳號權限
			cmd.d.appVs = window._version.v;
			cmd.d.FORCED = true;
			M4C.send(cmd, {'wsConn': wsConn});
		},
		// 取得簡易登入密碼
		getEZLoginPassword(combineStr) {
			window.CryptoJS = CryptoJS;
			let hash = CryptoJS.SHA256(combineStr);
			let hashInBase64 = CryptoJS.enc.Hex.stringify(hash);
			console.log("[AC] getEZLoginPassword by", combineStr, "->", hashInBase64);
			return hashInBase64;
		},
		// 收到登入的回覆
		onLoginData(data, wsConn) {
			// 斷線重連 登入失敗時
			if (wsConn.info.byReConnect && data.cd < 0) {
				M4C.trigger("AUTO-RECONNECT-FAIL", data, wsConn);
				return;
			}
			// 回覆內容轉語系
			M4C.responseChangeLanguage(data, "AC_");
			// 記下該連線的 AC 登入結果
			this.$set(wsConn, 'acResponse', data);
			this.$set(wsConn, 'responseData', data);

			// 登入成功、首登修改密码、定期修改密码都执行ping/pong
			if (data.cd === 1 || data.cd === -203 || data.cd === -204){
				// 開始 PING/PONG
				M4C.startPing(data, wsConn);
			}
			// 登入成功
			if (data.cd === 1){
				// AC 登入成功
				wsConn.acReady = true;
				// 報價連線只要 AC 登入成功，就是為完整登入成功
				if (wsConn.info.type === "quote") {
					wsConn.connecting = false;
					wsConn.loginReady = true;
				}
				wsConn.$CD = data.cd;
				wsConn.$STATUS = 'AC-LOGIN-READY';

				M4C.trigger("AC-LOGIN-READY", data, wsConn);
				
				if (wsConn.info.type === "trade" && wsConn.acResponse.d["pd.setting"] && wsConn.acResponse.d["pd.setting"].broker) {
					this.$store.state.compositeConfig = wsConn.acResponse.d["pd.setting"].broker.composite;
				}
			}
			// 密碼失效
			else if(data.cd === -203 || data.cd === -204){
				// 取消連線十秒client自行踢斷機制。
				clearTimeout(M4C.connectLoginTimeout);
				eventBus.$emit("PASSWORD-INVALID", data);
			}
			// 其它登入失敗
			else {
				wsConn.$CD = data.cd;
				wsConn.$STATUS = 'AC-LOGIN-FAIL';
				wsConn.connecting = false;
			}
			// 清除連線Timeout
			clearTimeout(wsConn.timeout);
			delete wsConn.timeout;
		},

		getAcToken(tkQty, wsConn = this.$store.state.wsConnMap.quote) {
			let cmd = {};
			cmd.s = 'ac';
			cmd.c = 'tk.get';
			cmd.d = {
				SESSION: wsConn.acResponse.d.SESSION,
				qrytks: tkQty || 1,
			}
			cmd.r =  "".random();
			M4C.send(cmd, {'wsConn': wsConn});
		},
		//  3rd-login : 取得 ACSTK
		login3rd(data, wsConn) {
			wsConn.$STATUS = 'AC-LOGIN';
			let cmd = {};
			cmd.s = 'ac';
			cmd.c = 'acstk.get';
			cmd.r = "".random();
			cmd.d = {};
			cmd.d.COMPANY = wsConn.info.comp;
			cmd.d.PRODUCT = wsConn.info.prod;
			M4C.send(cmd, {'wsConn': wsConn});
			wsConn.info.initCode = data.d;
			// this.sim3rdPswd = this.encodeACLoginPassword(wsConn.info, data.d, wsConn.info.pswd);
		},	
		// 3rd-login : 取得 SIG
		login3rdGetSIG(data, wsConn) {
			let acstk = data.d.ACSTK;
			let encryptAcstk = acstk;
			// 免登入看報價 -> ACSTK 進行 AES 編碼 https://trello.com/c/DnI4WXWW/
			if (wsConn.info.type === "quote" && this.$store.state.config.CONFIG.LOGIN_QUOTE) {
				console.log(`CryptoJS.AES from `, acstk);
				var key = CryptoJS.enc.Utf8.parse(`c5f16e055e42b444`);
				var iv = CryptoJS.enc.Utf8.parse(`a9b3c7d1e5f9g2h4`);
				let encryptedData = CryptoJS.AES.encrypt(acstk, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
				encryptAcstk = encryptedData.toString();
				console.log(`CryptoJS.AES to `, encryptAcstk);
			}
			let cmd = {};
			cmd.s = "ac";
			cmd.c = "auth.sign";
			cmd.d = {};
			cmd.d.comp = wsConn.info.comp;
			cmd.d.pd = wsConn.info.prod;
			cmd.d.lg = wsConn.info.user;
			cmd.d.xnt = wsConn.initCode;
			cmd.d.acstk = acstk;
			cmd.r = "".random();
			try {
				let wcType = wsConn.info.type;
				let cmdStr = JSON.stringify(cmd);
				console.log(M4C.getWsConnMark(wsConn), `Http get SIG : `, cmdStr);
				const formData = new FormData();
				formData.append('cmdLine', cmdStr);
				let apiPath = wsConn.info.apiPath;
				console.log(`M4C.AC.login3rdGetSIG.apiPath : `, apiPath);
				asyncAwaitFetchArrayBuffer(apiPath, {
					method: 'POST',
					credentials: 'include',
					body: formData
				}).then(buffer=>{
					let enc = new TextDecoder("utf-8");
					let arr = new Uint8Array(buffer);
					let str = enc.decode(arr);
					// 回應可能包含多行內容
					str.split("\n").forEach((strJson)=>{
						if (strJson) {
							let obj = JSON.parse(strJson);
							if (obj.s==="ac" && obj.c==="auth.sign") {
								wsConn.SIG = obj.d.sig;
								wsConn.ACSTK = encryptAcstk;
								console.log(M4C.getWsConnMark(wsConn), `Http get SIG response : `, JSON.stringify(obj));
								this.login3rdAC(wsConn);
							}
						}
					});
				});
			} catch (error) {
				alert(error.message);
			}
		},
		// 3rd-login : 用 ACSTK + SIG 登入 AC
		login3rdAC(wsConn) {
			let cmd = {};
			cmd.s = 'ac';
			cmd.c = 'acstk.login';
			cmd.r = "".random();
			cmd.d = {};
			cmd.d.COMPANY = wsConn.info.comp;
			cmd.d.PRODUCT = wsConn.info.prod;
			cmd.d.LOGIN = wsConn.info.user;
			// 有被拿去解析，不可隨便調整
			cmd.d.APP = `${this.projectID}.${this.deviceType}`;
			cmd.d.ACSTK = wsConn.ACSTK;
			cmd.d.SIG = wsConn.SIG;
			cmd.d.appVs = window._version.v;		// app版本號(統計用)
			M4C.send(cmd, {'wsConn': wsConn});
		},	
		// 修改密碼 (MO情境only)
		changePassword(user, newPwd, oldPwd) {
			this.newPwd = this.encodePBKDF2(newPwd);
			let cmd = {};
			cmd.s = "ac";
			cmd.c = "usr.upd";
			cmd.r = "".random();
			cmd.d = {};
			cmd.d.COMPANY = "ss2";
			cmd.d.PRODUCT = "ff";
			cmd.d.LOGIN = user;
			cmd.d.PWD = this.newPwd;
			cmd.d.VRYPWD = this.encodePBKDF2(oldPwd);
			M4C.send(cmd);
			return this.baseQuery('DataChangePassword');
		},
		// 修改密碼回覆 (MO情境only)
		onChangePwdData(data, wsConn) {
			let result = this.baseOnTradeData('DataChangePassword', data, "AC_PASSWORD_");
			// 密碼修改成功 -> 更新記憶的密碼，供斷線重連使用
			if (data.cd === 1) {
				wsConn.info.pswd = this.newPwd;
				localStorage.setItem(`${this.projectID}_LOGIN_PBKDF2`, this.newPwd);
				delete this.newPwd;
				this.$set(result, "$CD", 0);
				this.$set(result, "$STATUS", "DONE");
			}
		},
		// 編碼 AC 登入用密碼
		encodeACLoginPassword(info, initCode, pwd) {
			let lib = window.ss2EncodeLib;
			let pwdToPBKDF2;
			if (pwd === "************") {
				pwdToPBKDF2 = localStorage.getItem(`${info.project}_LOGIN_PBKDF2`);
			}
			else {
				// 若 memory 已經存在該密碼的 PBKDF2 則直接用 (效率更快)
				pwdToPBKDF2 = this.mapPwdToPBKDF2[pwd] || this.encodePBKDF2(pwd);
				// 將該密碼的 PBKDF2 存起來
				this.mapPwdToPBKDF2[pwd] = pwdToPBKDF2;
				// 將 PBKDF2 存到 localStorage 記憶密碼機制使用
				localStorage.setItem(`${info.project}_LOGIN_PBKDF2`, pwdToPBKDF2);
			}
			// console.log("[AC-Encode] pwdToPBKDF2:", pwdToPBKDF2);
			
			// 3. 再根據由 Dispatcher 取得的 INIT 參數 與上述密碼合併再使用 SHA256 演算法編譯.
			// 合併方式: SHA256(步驟1的編譯密碼轉換成BYTES + INIT參數轉換成BYTES)
			let bytes = [];
			let str = lib.hex2a(pwdToPBKDF2 + initCode);
			for (let i = 0; i < str.length; ++i) {
				let code = str.charCodeAt(i);
				bytes = bytes.concat([code]);
			}
			// console.log("[AC-Encode] combine-bytes:", bytes.join(','));
			let encodedPwd = lib.sha256(bytes);
			// console.log("[AC-Encode] after-sha256:", encodedPwd);
			return encodedPwd;
		},
		// 將密碼進行 PBKDF2 編碼
		encodePBKDF2(pwd) {
			let lib = window.ss2EncodeLib;
			// *** 編碼測試頁在 ss2code/sample/ac.encode/ ***
			// 1. 使用 PBKDF2 對原始密碼加密.
			// 2. PBKDF2 編譯參數: SALT = "70547377", Iteration = 4000, Key Size=512
			let pwdToPBKDF2 = lib.pbkdf2.pbkdf2Sync(pwd, '70547377', 4000, 64, 'sha512').toString('hex');
			return pwdToPBKDF2;
		},
		// 延用舊密碼(直接對ac發命令)
		useOldPwd() {
			// 發送命令
			M4C.send({
				"s": "ac",
				"c": "login.upd.pwd",
				"d": {},
				"r": "".random(16)
			});
		},
	},
	watch: {},
    computed: {
		projectID() {
			return this.$store.state.config.projectID;
		},
		deviceType() {
			if (!this.$store.state.device.isAPP)
				return 'browser';
			if (this.$store.state.device.isAndroid)
				return 'android';
			else if (vuex.device.isIOS)
				return 'ios';
			else
				return 'others';
		},
		publicPdSetting() {
			return this.$store.state.config.publicPdSetting;
		},
		// 啟用簡易快速登入 https://trello.com/c/tjhz730D
		enableEZLogin() {
			try{return this.publicPdSetting.CONFIG.Login.enableEZLogin;}catch(e){}
		},
	},
}
</script>
