<template>
	<div class="m4c-cert-changing hidden">
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			brokerInfo: {},
			brokerID: '',
			traderID: '',
			// 全景簽章錯誤訊息
			errorCodeMap: {
				'5001': '一般性錯誤',
				'5002': '配置記憶體發生錯誤',
				'5003': '記憶體緩衝區太小',
				'5004': '未支援函式',
				'5005': '錯誤的參數',
				'5006': '無效的handle',
				'5007': '試用版函式庫已過期',
				'5008': 'Base64編碼解碼錯誤',
				'5010': '找不到憑證',
				'5011': '憑證已過期',
				'5012': '憑證時間尚未合法',
				'5013': '憑證可能過期或無法使用',
				'5014': '憑證主旨錯誤',
				'5015': '無法找到憑證發行者',
				'5016': '憑證上的簽章值是錯誤的',
				'5017': '無效的憑證用途（加解密、簽驗章）',
				'5020': '憑證已撤銷',
				'5021': '憑證已撤銷（金鑰洩露）',
				'5022': '憑證已撤銷（CA compromised）',
				'5023': '憑證已撤銷（聯盟已變更）',
				'5024': '憑證已撤銷（已取代）',
				'5025': '憑證已撤銷（已停止）',
				'5026': '憑證保留或暫禁',
				'5028': '憑證己撤銷（凍結）',
				'5030': 'CRL 已過期',
				'5031': 'CRL 尚未有效',
				'5032': '無法找到CRL',
				'5034': 'CRL上的簽章值無效',
				'5035': '取得摘要值錯誤',
				'5036': '不合法的簽章',
				'5037': '內容錯誤',
				'5040': '憑證格式錯誤',
				'5041': 'CRL 格式錯誤',
				'5042': '錯誤的PKCS7格式',
				'5043': '金鑰的格式錯誤',
				'5044': '不合法的憑證請求檔格式(PKCS10)',
				'5045': '無效的格式',
				'5046': '無效的PKCS12格式',
				'5050': '找不到指定物件',
				'5051': '簽章值中無原文',
				'5052': '簽章值中無憑證',
				'5053': '簽章值中無SignerInfo',
				'5060': '憑證與私密金鑰並非成對',
				'5061': '簽章失敗',
				'5062': '驗章失敗',
				'5063': '加密失敗',
				'5064': '解密失敗',
				'5065': '產生金鑰失敗',
				'5066': '刪除使用者憑證失敗',
				'5070': '取消操作',
				'5071': '密碼不正確，您的憑證異常，請至系統設定>恢復原廠設定做重置，並重新申請憑證，謝謝',
				'5072': 'Smart Card或者USB token已被鎖卡無法使用',
				'5080': 'XML文件格式錯誤',
				'5081': 'XML標籤找不到',
				'5091': 'PKCS12不正確',
				'5092': 'PKCS12解碼失敗',
				'5093': 'PKCS12解密失敗',
				'5094': 'PKCS12取得金鑰失敗',
				'5095': 'PKCS12取得憑證失敗',
				'5100': '無效狀態',
				'5101': '超出範圍',
				'5201': '無法開啟store',
				'5202': '憑証鏈不存在',
				'5203': '無法開啟CSP',
				'5204': '找不到關聯的私密金鑰',
				'5205': '關聯的私密金鑰已被標記成不能匯出',
				'5206': 'store存取被拒',
				'5510': 'Socket Time Out',
				'5901': 'Unicode錯誤',
				'5902': '找不到指定檔案',
				'5903': '找不到指定路徑',
				'5904': '找不到指定網路路徑',
				'5905': '使用者登入帳號或密碼錯誤',
				'5906': '沒有權限存取'
			},

		}
	},
	beforeMount() {
		M4C.Cert = this;
		/* 以下這段可以直接在有全景簽章 plugin 的 app 的 console 執行測試
		let userPIN = "chin1234";
		let content = "OU=RA-TAISHIN,C=TW";
		plugins.Changing.generatePrivateKey(2048, userPIN, function(result) {
			console.log('generatePrivateKey result : ', result);
			plugins.Changing.generateCSR(result.priKey, userPIN, content, function(result) {
				console.log('generateCSR result : ', result);
				plugins.Changing.pureSignEx(result.priKey, userPIN, '簽章明文', function(result) {
					console.log('pureSignEx result : ', result);
				});
			});
		});
		*/
	},
	mounted() {
	},
	beforeDestroy() {},
	components: {},
	methods: {
		set({brokerInfo, brokerID, traderID}) {
			this.brokerInfo = brokerInfo || this.brokerInfo;
			this.brokerID = brokerID || this.brokerID;
			this.traderID = traderID || this.traderID;
		},
		// 申請憑證
		applyCert({brokerInfo, brokerID, traderID, accountID, inputBirthday, inputMobile, inputEmail, inputVerifyCode}) {
			this.brokerInfo = brokerInfo || this.brokerInfo;
			this.brokerID = brokerID || this.brokerID;
			this.traderID = traderID || this.traderID;
			console.log('[OTP/憑證]', '開始申請憑證', this.brokerID, this.traderID);
			return new Promise((resolve, reject)=>{
				this.generatePrivateKey(this.userPIN).then(()=>{
					this.makeCSR({password: this.userPIN, subject: this.makeCSRSubject}).then((csrResult)=>{
						this.certApply({csrResult, inputBirthday, inputMobile, inputEmail, inputVerifyCode}).then((cert)=>{
							this.getSubject({cert}).then((subjectObj)=>{
								this.certRegister({cert, subjectObj}).then(()=>{
									this.certInfo({}).then((certInfo)=>{
										// 儲存憑證相關資訊
										this.saveCert({certInfo, cert});
										console.log('[OTP/憑證]', '憑證申請完成');
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
		renewCert({brokerInfo, brokerID, traderID, accountID, inputMobile, inputEmail, inputVerifyCode}) {
			this.brokerInfo = brokerInfo || this.brokerInfo;
			this.brokerID = brokerID || this.brokerID;
			this.traderID = traderID || this.traderID;
			let cert = vuex.cert[accountID].CERT;
			console.log('[OTP/憑證]', '開始更新憑證', this.brokerID, this.traderID);
			return new Promise((resolve, reject)=>{
				this.generatePrivateKey(this.userPIN).then(()=>{
					this.makeCSR({password: this.userPIN, subject: this.makeCSRSubject}).then((csrResult)=>{
						this.getSubject({cert}).then((subjectObj)=>{
							this.certRenew({csrResult, subjectObj, inputMobile, inputEmail, inputVerifyCode}).then((cert)=>{
								this.certRegister({cert, subjectObj}).then(()=>{
									this.certInfo({}).then((certInfo)=>{
										// 儲存憑證相關資訊
										this.saveCert({certInfo, cert});
										console.log('[OTP/憑證]', '憑證展延完成');
										resolve(certInfo);
									}).catch(err=>reject(err));
								}).catch(err=>reject(err));
							}).catch(err=>reject(err));
						}).catch(err=>reject(err));
					}).catch(err=>reject(err));
				}).catch(err=>reject(err));
			});
		},
		// 取得目前可用功能、狀態及 CSR 金鑰長度 (對應台網GetFnStatus2)
		certInfo({brokerID, traderID}) {
			this.brokerID = brokerID || this.brokerID;
			this.traderID = traderID || this.traderID;
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

				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), this.requestTimeoutMS, '[OTP/憑證]').then(data => {
					console.log('[OTP/憑證] certInfo 完成');
					this.certNO = data.d.CERT_NO;
					resolve(data.d);
				}).catch(err=>reject(err));
			});
		},
		// 申請憑證命令
		certApply({csrResult, inputBirthday, inputMobile, inputEmail, inputVerifyCode}) {
			console.log('[OTP/憑證]', '送出憑證申請命令');
			return new Promise((resolve, reject)=>{
				let cmd = {
					s: "TRADE",
					c: "cert.apply",
					d: {
						BROKER_ID: this.brokerID,
						USER_ID: this.traderID,
						BIRTHDAY: inputBirthday,
						DEVICE_TYPE: this.deviceType,
						DEVICE_ID: this.deviceID,
						AP_ID: this.apID,
						CSR: csrResult.csr,
						MOBILE: inputMobile,
						EMAIL: inputEmail,
						MODEL: this.model,
						OTP: inputVerifyCode,
					},
					r : "".random(),
				};
				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), this.requestTimeoutMS, '[OTP/憑證]').then(data => {
					console.log('[OTP/憑證] certApply 完成');
					resolve(data.d.CERT);
				}).catch(err=>reject(err));
			});
		},
		// 取得憑證Subject
		getSubject({cert}) {
			console.log('[OTP/憑證]', '取得憑證Subject(取得CN)');
			return new Promise((resolve, reject)=>{
				plugins.Changing.certGetSubject(cert, result=>{
					if (result.code === 0 && result.subject) {
						console.log('[OTP/憑證] getSubject :', result.subject);
						try {
							let subjectObj = Object.fromEntries(result.subject.split(result.subject.includes(',') ? ',' : '\n').map(s => s.split('=')));
							if (!subjectObj || !subjectObj.CN)
								reject({CODE: -99800, MSG: '憑證異常(憑證主旨內容異常)，若重試仍失敗，請洽詢客服人員'});
							else
								resolve(subjectObj);
						}catch(err){
							console.log('[OTP/憑證] getSubject parse exception :', err);
							reject({CODE: -99801, MSG: '憑證異常(憑證主旨解析失敗)，若重試仍失敗，請洽詢客服人員'});
						}
					}
					else
						reject({CODE: -99802, MSG: '憑證異常(無法取得憑證主旨)，若重試仍失敗，請洽詢客服人員'});
				});
			});
		},
		// 更新憑證命令
		certRenew({csrResult, subjectObj, inputMobile, inputEmail, inputVerifyCode}) {
			console.log('[OTP/憑證]', '開始更新憑證命令');
			return new Promise((resolve, reject)=>{
				let cmd = {
					s: "TRADE",
					c: "cert.update",
					d: {
						BROKER_ID: this.brokerID,
						DEVICE_TYPE: this.deviceType,
						CSR: csrResult.csr,
						CN: subjectObj.CN,
						MODEL: this.model,
						EMAIL: inputEmail,
						MOBILE: inputMobile,
						OTP: inputVerifyCode,
					},
					r : "".random(),
				};
				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), this.requestTimeoutMS, '[OTP/憑證]').then(data => {
					if (data.d.CODE != 0) {
						reject({CODE: data.d.CODE, MSG: data.d.MSG});
						return;
					}
					// 憑證內容
					let cert = data.d.CERT;
					console.log('[OTP/憑證] certApply 完成 CERT : ', cert);
					resolve(cert);
				}).catch(err=>reject(err));
			});
		},
		// 憑證註冊
		certRegister({cert, subjectObj}) {
			console.log('[OTP/憑證]', '開始進行憑證註冊');
			let uploadTime = this.getDateTimeFormat();
			return new Promise((resolve, reject)=>{
				this.getP7SignValue({cert, content: uploadTime}).then((result)=>{
					let cmd = {
						s: "TRADE",
						c: "cert.register",
						d: {
							BROKER_ID: this.brokerID,
							USER_ID: this.traderID,
							DEVICE_TYPE: this.deviceType,
							DEVICE_ID: this.deviceID,
							AP_ID: this.apID,
							CN: subjectObj.CN,
							UPLOAD_TIME: uploadTime,
							SIGLOG: result.secret,
						},
						r: ''.random()
					};
					console.log('[OTP/憑證]', '送出憑證註冊命令');
					M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), this.requestTimeoutMS, '[OTP/憑證]').then(data => {
						console.log('[OTP/憑證] certRegister 完成');
						resolve(data);
					}).catch(err=>reject(err));
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
				M4C.Http.fetchTrade(this.ss2api, JSON.stringify(cmd), this.requestTimeoutMS, '[OTP/憑證]').then(data => {
					this.$set(this.$cert, 'STATUS', data.d.STATUS);
					this.$set(this.$cert, 'APPLY_ID', data.d.APPLY_ID);
					this.$set(this.$cert, 'INITIAL_DATE', data.d.INITIAL_DATE);
					this.$set(this.$cert, 'EXPIRE_DATE', data.d.EXPIRE_DATE);
					resolve(data);
				}).catch(err=>reject(err));
			});
		},
		// 簽章
		getSign(content) {
			// 未指定過 traderID 時 -> 取用登入的 traderID
			this.traderID = this.traderID || this.$store.state.login.traderID;
			console.log('[OTP/憑證]', '取得簽章', this.traderID, content);
			return new Promise((resolve, reject)=>{
				try {
					plugins.Changing.pureSignEx(this.$cert.PRIKEY, this.userPIN, content, (result)=>{
						console.log('[OTP/憑證]', '取得簽章完成', result);
						if (result.code === 0)
							resolve(result.secret);
						else
							reject(result.code, this.errorCodeMap[result.code] || '');
					});
				} catch (err) {
					reject(err);
				}
			});
		},
		// 儲存所有憑證相關資訊
		saveCert({certInfo, cert}) {
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
			this.$set(this.$cert, 'PRIKEY', this.priKey);					// 金鑰
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
		// 產生 Private Key
		generatePrivateKey(password) {
			let self = this;
			console.log('[OTP/憑證]', '產生 Private Key', password);
			return new Promise((resolve, reject)=>{
				try {
					plugins.Changing.generatePrivateKey(2048, password, (result)=>{
						console.log('[OTP/憑證]', '產生 Private Key =>', result);
						if (result.code === 0) {
							self.priKey = result.priKey;
							resolve(result);
						}
						else
							reject({CODE: result.code, MSG: this.errorCodeMap[result.code] || ''});
					});
				} catch (err) {
					reject(err);
				}
			});
		},
		// 產生 CSR
		makeCSR({password, subject}) {
			console.log('[OTP/憑證]', '產生 CSR', this.priKey, password, subject);
			return new Promise((resolve, reject)=>{
				try {
					// 產生 CSR
					plugins.Changing.generateCSR(this.priKey, password, subject, (result)=>{
						console.log('[OTP/憑證]', '產生 CSR =>', result);
						if (result.code === 0)
							resolve(result);
						else
							reject({CODE: result.code, MSG: this.errorCodeMap[result.code] || ''});
					});
				} catch (err) {
					reject(err);
				}
			});
		},
		// 取得格式化日期
		getDateTimeFormat() {
			var today = new Date();
			var yyyy = today.getFullYear();
			var MM = today.getMonth() + 1;
			var DD = today.getDate();
			var hh = today.getHours();
			var mm = today.getMinutes();
			var ss = today.getSeconds();
			if (MM < 10) MM = "0" + MM;
			if (DD < 10) DD = "0" + DD;
			if (hh < 10) hh = "0" + hh;
			if (mm < 10) mm = "0" + mm;
			if (ss < 10) ss = "0" + ss;
			return MM + "/" + DD + " " + hh + ":" + mm + ":" + ss + " " + yyyy;
		},
		// 取得P7簽章
		getP7SignValue({cert, content}) {
			console.log('[OTP/憑證]', '開始取得P7簽章', content);
			return new Promise((resolve, reject)=>{
				// 產生簽章值
				try {
					plugins.Changing.signWithCert(this.priKey, cert, this.userPIN, content, (result)=>{
						console.log('[OTP/憑證]', '開始取得P7簽章 =>', result);
						if (result.code === 0)
							resolve(result);
						else
							reject({CODE: result.code, MSG: this.errorCodeMap[result.code] || ''});
					});
				} catch (err) {
					reject(err);
				}
			});			
		},
	},
	watch: {
	},
	computed: {
		// Device : android=20，ios=21 https://trello.com/c/5PXERbcM
		deviceType() {
			if (vuex.device.isAndroid)
				return '20';
			else if (vuex.device.isIOS)
				return '21';
			else
				return vuex.device.deviceType;
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
		publicPdSetting() {
			return this.$store.state.config.publicPdSetting;
		},
		// 製作 CSR 的主旨，支持 pdsetting 設定
		makeCSRSubject() {
			let result = 'OU=Taishin Securities Co.,C=TW';
			try{result = vuex.config.publicPdSetting.CONFIG.CERT.makeCSRSubject;}catch(e){}
			return result;
		},
		// 行動裝置型號 ex. "Android 12 realme RMX2117"
		model() {
			return vuex.device.isAPP ? `${device.platform || ''} ${device.version || ''} ${device.manufacturer || ''} ${device.model || ''}` : 'browser';
		},
		// 憑證相關命令Timeout秒數
		requestTimeoutMS() {
			try{return Number(vuex.config.publicPdSetting.CONFIG.CERT.requestTimeoutMS);}catch(e){}
			return 9988;
		},
	},
}
</script>

<style scoped>
</style>