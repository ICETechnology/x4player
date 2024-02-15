<template>
	<div class="m4c-cert hidden">
	</div>
</template>

<script>
// 簽章Plugin 文件在 https://trello.com/c/HDU3VoBv
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			brokerInfo: {},
			brokerID: '',
			traderID: '',
		}
	},
	beforeMount() {
		M4C.Cert = this;
	},
	mounted() {
	},
	beforeDestroy() {},
	components: {},
	methods: {
		// 申請憑證
		applyCert({brokerInfo, brokerID, traderID, inputPswd, inputBirthday}) {
			this.brokerInfo = brokerInfo || this.brokerInfo;
			this.brokerID = brokerID || this.brokerID;
			this.traderID = traderID || this.traderID;
			console.log('[OTP/憑證]', '開始申請憑證', this.brokerID, this.traderID);
			return new Promise((resolve, reject)=>{
				this.getCertInfo().then((certInfo)=>{
					this.makeCSR({certInfo}).then((csrResult)=>{
						this.certApply({csrResult, inputPswd, inputBirthday}).then((cert)=>{
							this.importCert({csrKeySet: csrResult.KeySet, cert}).then((prikey)=>{
								this.certRegister().then(()=>{
									this.getCertInfo().then((certInfo)=>{
										// 儲存憑證相關資訊
										this.saveCert({certInfo, prikey, cert});
										console.log('[OTP/憑證]', '憑證申請完成');
										// 額外查詢憑證更多資訊(非必要)
										M4C.Cert.certQuery({certNO: certInfo.CERT_NO});
										resolve();
									}).catch(err=>reject(err));
								}).catch(err=>reject(err));
							}).catch(err=>reject(err));
						}).catch(err=>reject(err));
					}).catch(err=>reject(err));
				}).catch(err=>reject(err));
			});
		},
		// 更新憑證
		renewCert({brokerInfo, brokerID, traderID}) {
			this.brokerInfo = brokerInfo || this.brokerInfo;
			this.brokerID = brokerID || this.brokerID;
			this.traderID = traderID || this.traderID;
			console.log('[OTP/憑證]', '開始更新憑證', this.brokerID, this.traderID);
			return new Promise((resolve, reject)=>{
				this.getCertInfo().then((certInfo)=>{
					this.makeCSR({certInfo}).then((csrResult)=>{
						this.getSign(csrResult.CSR).then((certSig)=>{
							this.certRenew({csrResult, certSig}).then((cert)=>{
								this.importCert({csrKeySet: csrResult.KeySet, cert}).then((prikey)=>{
									this.certRegister().then(()=>{
										this.getCertInfo().then((certInfo)=>{
											// 儲存憑證相關資訊
											this.saveCert({certInfo, prikey, cert});
											console.log('[OTP/憑證]', '憑證申請完成');
											resolve(certInfo);
										}).catch(err=>reject(err));
									}).catch(err=>reject(err));
								}).catch(err=>reject(err));
							}).catch(err=>reject(err));
						}).catch(err=>reject(err));
					}).catch(err=>reject(err));
				}).catch(err=>reject(err));
			});
		},
		// 取得目前可用功能、狀態及 CSR 金鑰長度 (對應台網GetFnStatus2)
		getCertInfo() {
			console.log('[OTP/憑證]', '開始取得憑證資訊');
			return new Promise((resolve, reject)=>{
				let cmd = {
					s: "TRADE",
					c: "cert.info",
					d: {
						BROKER_ID: this.brokerID,
						USER_ID: this.traderID,
						DEVICE_TYPE: this.deviceType,
						DEVICE_ID: this.deviceID,
						AP_ID: this.apID,
					},
					r: ''.random()
				};

				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), 9988, '[OTP/憑證]').then(data => {
					console.log('[OTP/憑證] getCertInfo 完成');
					resolve(data.d);
				}).catch(err=>reject(err));
			});
		},
		// 製作CSR
		makeCSR({certInfo}) {
			return new Promise((resolve, reject)=>{
				let param = {
					"KeySize": Number(certInfo.CSR_LEN),
					"CN": this.traderID,
					"UserPIN": this.userPIN,
				};
				console.log('[OTP/憑證]', '開始製作CSR', param);
				Sign.makeCSR(param, (result)=>{
					this.$set(this.$cert, 'CSR', result.CSR);
					this.$set(this.$cert, 'KeySet', result.KeySet);
					console.log('[OTP/憑證] Sign.makeCSR result.CSR : ', result.CSR);
					console.log('[OTP/憑證] Sign.makeCSR result.KeySet : ', result.KeySet);
					resolve(result);
				}, err=>reject(err));
			});
		},
		// 申請憑證命令
		certApply({csrResult, inputPswd, inputBirthday}) {
			console.log('[OTP/憑證]', '送出憑證申請命令');
			return new Promise((resolve, reject)=>{
				let cmd = {
					s: "TRADE",
					c: "cert.apply",
					d: {
						BROKER_ID: this.brokerID,
						USER_ID: this.traderID,
						USER_PWD: inputPswd,
						BIRTHDAY: inputBirthday,
						DEVICE_TYPE: this.deviceType,
						DEVICE_ID: this.deviceID,
						AP_ID: this.apID,
						CSR: csrResult.CSR,
					},
					r : "".random(),
				};
				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), 9988, '[OTP/憑證]').then(data => {
					let cert = data.d.CERT.split('-----BEGIN CERTIFICATE-----\n')[1].split('\n-----END CERTIFICATE-----')[0];
					console.log('[OTP/憑證] certApply 完成 CERT : \n', cert);
					resolve(cert);
				}).catch(err=>reject(err));
			});
		},
		// 更新憑證命令
		certRenew({csrResult, certSig}) {
			console.log('[OTP/憑證]', '開始更新憑證命令');
			return new Promise((resolve, reject)=>{
				let cmd = {
					s: "TRADE",
					c: "cert.update",
					d: {
						BROKER_ID: this.brokerID,
						USER_ID: this.traderID,	 
						DEVICE_TYPE: this.deviceType,
						DEVICE_ID: this.deviceID,
						AP_ID: this.apID,
						CSR: csrResult.CSR,
						SIGN: certSig,
						CERT_NO: this.$cert.CERT_NO,
					},
					r : "".random(),
				};
				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), 9988, '[OTP/憑證]').then(data => {
					if (data.d.CODE != 0) {
						reject({CODE: data.d.CODE, MSG: data.d.MSG});
						return;
					}
					// 憑證內容
					let cert = data.d.CERT.split('-----BEGIN CERTIFICATE-----\n')[1].split('\n-----END CERTIFICATE-----')[0];
					console.log('[OTP/憑證] certApply 完成 CERT : ', cert);
					resolve(cert);
				}).catch(err=>reject(err));
			});
		},
		// 憑證匯入
		importCert({csrKeySet, cert}) {
			return new Promise((resolve, reject)=>{
				let param = {
					"b64Keydata": csrKeySet,	// Sign.makeCSR -> result.KeySet
					"UserPIN": this.userPIN,	// `${this.traderID}70547377`
					"b64Cert": cert,			// 由 cert.apply 得到的憑證內容
				};
				console.log('[OTP/憑證]', '開始憑證匯入', param);
				Sign.importCert(param, (result)=>{
					console.log('[OTP/憑證] importCert result.KeySet : ', result.KeySet);
					resolve(result.KeySet);
				}, err=> {
					console.log('[OTP/憑證]', '憑證匯入失敗', err.MEMO || `(${err.CODE}) ${err.MSG}`);
					reject(err);
				});
			});
		},
		// 憑證註冊
		certRegister() {
			console.log('[OTP/憑證]', '送出憑證註冊命令');
			return new Promise((resolve, reject)=>{
				let cmd = {
					s: "TRADE",
					c: "cert.register",
					d: {
						BROKER_ID: this.brokerID,
						USER_ID: this.traderID,
						DEVICE_TYPE: this.deviceType,
						DEVICE_ID: this.deviceID,
						AP_ID: this.apID,
					},
					r: ''.random()
				};
				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), 9988, '[OTP/憑證]').then(data => {
					console.log('[OTP/憑證] certRegister 完成');
					resolve(data);
				}).catch(err=>reject(err));
			});
		},
		// 憑證查詢
		certQuery({brokerInfo, brokerID, traderID, certNO}) {
			this.brokerInfo = brokerInfo || this.brokerInfo;
			this.brokerID = brokerID || this.brokerID;
			this.traderID = traderID || this.traderID;
			console.log('[OTP/憑證]', '憑證查詢', this.brokerID, this.traderID);
			return new Promise((resolve, reject)=>{
				let cmd = {
					s: "TRADE",
					c: "cert.query",
					d: {
						BROKER_ID: this.brokerID,
						USER_ID: this.traderID,
						DEVICE_TYPE: this.deviceType,
						DEVICE_ID: this.deviceID,
						AP_ID: this.apID,
						SERIAL: certNO,
					},
					r: ''.random()
				};
				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), 9988, '[OTP/憑證]').then(data => {
					resolve(data);
				}).catch(err=>reject(err));
			});
		},
		// 簽章 = loadRSAKey + getPKCS1Sign
		getSign(certContent) {
			// 未指定過 traderID 時 -> 取用登入的 traderID
			this.traderID = this.traderID || this.$store.state.login.traderID;
			console.log('[OTP/憑證]', '開始取得簽章', this.traderID, certContent);
			return new Promise((resolve, reject)=>{
				this.loadRSAKey().then((data)=>{
					console.log('[OTP/憑證] loadRSAKey.data : ', data);
					this.getPKCS1Sign(certContent).then((certSig)=>{
						console.log('[OTP/憑證] getPKCS1Sign.certSig : ', certSig);
						resolve(certSig);
					}).catch(err=>reject(err));
				}).catch(err=>reject(err));
			});
		},
		// 載入金鑰
		loadRSAKey() {
			return new Promise((resolve, reject)=>{
				let param = {
					"b64data": this.$cert.PRIKEY,
					"UserPIN": this.userPIN,
				};
				console.log('[OTP/憑證] loadRSAKey.param : ', param);
				// (Sing the data using the RSA key information in memory.* Should have called LoadRSAKey() before signing data.)
				Sign.loadRSAKey(param, (content)=>{
					console.log('[OTP/憑證] loadRSAKey 完成內容 : ', content);
					resolve(content);
				}, err=>reject(err));
			});
		},
		// 產生 P1 簽章值(短章)
		getPKCS1Sign(src) {
			console.log('[OTP/憑證] getPKCS1Sign src : ', src);
			return new Promise((resolve, reject)=>{
				let param = {
					source: src,
					len: src.length
				};
				console.log('[OTP/憑證] getPKCS1Sign param : ', param);
				Sign.getPKCS1Sign(param, (result)=>{
					console.log('[OTP/憑證] getPKCS1Sign result : ', result.Sign);
					resolve(result.Sign);
				}, err=>reject(err));
			});
		},
		// 儲存所有憑證相關資訊
		saveCert({certInfo, prikey, cert}) {
			console.log('[OTP/憑證]', '儲存憑證資訊');
			this.$set(this.$cert, 'USER_ID', this.traderID);				// 憑證用戶證件號碼
			this.$set(this.$cert, 'CERT_NO', certInfo.CERT_NO);				// 憑證序號
			this.$set(this.$cert, 'STATUS', certInfo.STATUS);				// 憑證狀態代碼
			this.$set(this.$cert, 'MEMO', certInfo.MEMO);					// 憑證狀態訊息
			this.$set(this.$cert, 'CSR_LEN', Number(certInfo.CSR_LEN));		// 金鑰長度
			this.$set(this.$cert, 'ALLOW_APPLY', certInfo.ALLOW_APPLY);		// 是否允許申請憑證
			this.$set(this.$cert, 'ALLOW_RENEW', certInfo.ALLOW_RENEW);		// 是否允許更新憑證
			this.$set(this.$cert, 'APPLY_REQ_CSR', certInfo.APPLY_REQ_CSR);	// 申請憑證是否需要產生CSR
			this.$set(this.$cert, 'RENEW_REQ_CSR', certInfo.RENEW_REQ_CSR);	// 更新憑證是否需要產生CSR
			this.$set(this.$cert, 'PRIKEY', prikey);						// 金鑰
			this.$set(this.$cert, 'CERT', cert);							// 憑證
		},
		// 更新此 traderID 所對應的 accountID 的憑證 (下單需要)
		updateAccountsCert({traderID, accounts}) {
			let certObj = this.$store.state.cert[traderID];
			if (certObj) {
				accounts.forEach(obj => {
					this.$store.state.cert[obj.ACCOUNT_ID] = certObj;
				});
			}
		},
		// 憑證狀態文字
		getCertStatusText(statusCode) {
			statusCode = Number(statusCode);
			if (isNaN(statusCode)) return '';
			let code = `(${statusCode}) `;
			switch (statusCode) {
				case 0:
					return this.$ln('有效憑證');
				case 10:
					return code + this.$ln('憑證申請成功，等待CA傳回憑證');
				case 11:
					return code + this.$ln('申請發生錯誤');
				case 12:
					return code + this.$ln('憑證申請成功，CA已傳回憑證，但使用者尚未下載過憑證');
				case 13:
					return code + this.$ln('等待核准');
				case 20:
					return code + this.$ln('憑證已撤銷');
				case 30:
					return code + this.$ln('憑證已過期');
				case 31:
					return code + this.$ln('憑證即將過期');
				default:
					return `憑證狀態代碼 : ${statusCode}`;
			}
		},
	},
	watch: {
	},
	computed: {
		deviceType() {
			return this.$store.state.device.deviceType;
		},
		deviceID() {
			return this.$store.state.device.deviceID;
		},
		$cert() {
			if (!this.$store.state.cert[this.traderID])
				this.$set(this.$store.state.cert, this.traderID, {});
			return this.$store.state.cert[this.traderID];
		},
		// 使用者保護密碼
		userPIN() {
			return `${this.traderID}70547377`;
		},
		apID() {
			return "X4";
		},
		ss2api() {
			return `${this.brokerInfo.apiProtocol}://${this.brokerInfo.host}/ss2/api`;
		},
	},
}
</script>

<style scoped>
</style>