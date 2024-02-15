export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		// 註冊資料分派 - 問題回報
		M4C.regDispatch({'s': 'helpdesk', 'c': 'issue.new', 'callback': this.onIssueNew.bind(this)});
		M4C.regDispatch({'s': 'appbo', 'c': 'svc.versions', 'callback': this.onSvcVersions.bind(this)});
	},
	mounted() {
		let cmd = {"s": "appbo", "c": "svc.versions", "r": "".random()};
		M4C.send(cmd, 'quote');
	},
	beforeDestroy() {},
	components: {},
	methods: {
		onSvcVersions(data) {
			this.svcVersions = data.d;
		},
		// 發送測試報告
		sendReport() {
			M4C.AC.getAcToken(2);
			let cmd = {
				s: "helpdesk",
				c: "issue.new",
				d: {
					title: `X4 UITest (${this.fileName}) 测试报告`,
					desc: this.reportDesc,
					mac: this.mac,
					device_id: this.device_id,
					os: this.os,
					ap: this.ap,
					ap_vs: this.ap_vs,
					app_id: this.app_id,
					app_vs: this.app_vs,
					plugin_oc: this.plugin_oc,
				},
				r: "".random(),
				ts: Date.parse(new Date())
			};
			M4C.send(cmd, 'quote');
			this.$store.state.notify(`UITest 测试报告已送出`);
		},
		onIssueNew(data) {
			if (data.$CD < 0) {
				// 建立失敗提示
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `测试报告建立失败`,
					content: `${this.$ln('测试报告建立失败, 请稍后再试')} (${data.$CD})`,
					confirmOnly: true,
				});
			}
			if (data.$CD == 1){
				this.$store.state.notify({
					icon: `check_circle`,
					head: `UITest 测试报告`,
					body: `测试报告发卡完成`,
				});
				// 上傳 server 版本資訊
				this.uploadFile(data.d._id, M4C.AC.acToken[0], JSON.stringify(this.svcVersions, null, '\t'), `svc.versions.txt`);
				// 上傳腳本
				this.uploadFile(data.d._id, M4C.AC.acToken[1], JSON.stringify(this.testList, null, '\t'), this.fileName);
			}	
		},
		// 上傳附件
		uploadFile(id, acToken, strData, fileName) {
			let uploadUrl = `https://${this.uploadHost}/helpdesk/api/issue/upl`;
			let formData = new FormData();
			let blobData = new Blob([strData], {type: 'text/plain'});
			formData.append("id", id);
			formData.append("tk", acToken);
			formData.append("file", blobData, fileName);
			try {
				asyncAwaitFetchArrayBuffer(uploadUrl, {
					method: 'POST',
					body: formData
				}).then(buffer=>{
					M4C.AC.acToken.splice(M4C.AC.acToken.indexOf(acToken), 1); // 清除acToken
					let enc = new TextDecoder("utf-8");
					let arr = new Uint8Array(buffer);
					let str = enc.decode(arr);
					console.log(`UITestReport uploadFile result:`, str);
					// 回應可能包含多行內容
					str.split("\n").forEach((strJson)=>{
						if (strJson) {
							let obj = JSON.parse(strJson);
							this.$store.state.notify({
								icon: `check_circle`,
								head: `UITest 测试报告`,
								body: obj.cd===1 ? '檔案上传成功' : '檔案上传失敗',
							});
						}
					});
				});
			} catch(e) {
				console.error(`UITestReport uploadFile exception: `, e.message);
			}
		},
	},
	watch: {
		testIndex(nv) {
			let self = this;
			if (nv >= this.testList.length) {
				this.outputMode = false;
				eventBus.$emit("CONFIRM-DIALOG", {
					title: self.$ln("测试通过"),
					content: self.$ln("将测试报告送出(开卡)？"),
					confirm: () => {
						self.sendReport();
					}
				});
			}
		}
	},
	computed: {
		mac() {return this.$store.state.device.macAddress;},					// MAC 位址
		device_id() {return this.$store.state.device.deviceID;},				// 裝置 ID
		os() {},																// OS 版本
		ap() {},																// 主程式
		ap_vs() {return window._version.v;},									// 主程式版本
		app_id() {},															// App ID
		app_vs() {return this.$store.state.device.appVersion;},					// App 版本
		plugin_oc() {return this.$store.state.device.optionCloudVersion;},		// 期權雲版本
		userAgent() {return navigator.userAgent;},
		isIOS() {return this.$store.state.device.isIOS;},
		isAPP() {return this.$store.state.device.isAPP;},
		isMobile() {return this.$store.state.device.isMobile;},
		quoteInfo() {return this.$store.state.wsConnMap.quote.info;},
		tradeInfo() {return this.$store.state.selectedWSConn.info;},
		uploadHost() {return this.$store.state.status.quoteHost;},
		reportDesc() {
			let result = '## 测试范围\r\n\r\n';
			let titleList = this.testList.filter(o=>o.action==='title');
			result += titleList.map(o=>`- ${o.text}`).join('\r\n');
			return result;
		}
	},
}