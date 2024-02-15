<template>
    <div class="m4c-issue hidden" ref="addImage"/>
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	data() {
		return {
			// 截圖資料
			catchScreenData: "",
			catchScreenName: "",
			catchScreenTime: "",
			// 截圖花費時間
			catchScreenCost: 0,
			// 上傳mapping表
			uploadMap: {},
			// 發送mapping表
			sendMap: {},
			// 回報讀取狀態
			unReadMsg: false,
			// 暫存發送命令
			cacheCmd: {},
			// 暫存未讀命令
			cacheUnreadCmd: {},
			// 未讀mapping表
			unReadMap: {},
			// 已讀mapping表
			setReadMap: {},
			// 當前回報資料
			currentIssue: {},
			// 總表、分類表、合約表...版本號資料。
			clsVersionObj: {},
		}
	},
	beforeMount() {
		let self = this;
		// 支持 Vuex + Window全域
		M4C.Issue = this.$store.state.m4c.issue = this;
		// 註冊資料分派 - 問題回報
		M4C.regDispatch({'s': 'helpdesk', 'c': 'issue.new', 'callback': this.onSubmitData.bind(this)});
		// 註冊資料分派 - 查詢問題回報
		M4C.regDispatch({'s': 'helpdesk', 'c': 'issue.srch', 'callback': this.onQueryData.bind(this)});
		// 註冊資料分派 - 取得特定問題回報
		M4C.regDispatch({'s': 'helpdesk', 'c': 'issue.get', 'callback': this.onGetData.bind(this)});
		// 註冊資料分派 - 增加留言
		M4C.regDispatch({'s': 'helpdesk', 'c': 'issue.cmt.add', 'callback': this.onAddIssueCmt.bind(this)});
		// 註冊資料分派 - 設定已讀
		M4C.regDispatch({'s': 'helpdesk', 'c': 'issue.read', 'callback': this.onSetReaded.bind(this)});
		// 註冊資料分派 - 問題回報更新
		M4C.regDispatch({'s': 'helpdesk', 'c': 'issue.updated', 'callback': this.onUpdateData.bind(this)});
	},
    methods: {
		// 僅能處理DataURL
		dataURLtoFile(dataurl, filename) { 
			var arr = dataurl.split(','),
				// 取mime type
				mime = arr[0].match(/:(.*?);/)[1],
				// 檔案內容
				bstr = atob(arr[1]), 
				n = bstr.length, 
				u8arr = new Uint8Array(n);
				
			while(n--){
				u8arr[n] = bstr.charCodeAt(n);
			}
			let _filename = `${filename}.${mime.split('/')[1]}`;
			let blobData = new Blob([u8arr], {type: mime});
			return blobData;
		},
		getImgeFile() {
			return this.dataURLtoFile(this.catchScreenData);
		},
		// 上傳附檔。
		uploadFile(id, file, acToken, picName, rkey) {
			let self = this;
			let noNotify = this.sendMap[rkey] && this.sendMap[rkey].noNotify;
			const uploadURi = `https://${this.$uploadHost}/helpdesk/api/issue/upl`;
			const formData = new FormData();
			const imagefile = this.dataURLtoFile(file);
			// id是問題回報後，server回覆的_id
			formData.append("id", id);
			// acToken是另外跟server要的一次性Token;
			formData.append("tk", acToken);
			// 這裡的副檔名沒有特別判斷，寫死是因為用html2canvas截圖，沒有特別指定類型，預設就是png
			// formData.append("file", imagefile, `${Date.parse(new Date())}.png`);
			formData.append("file", imagefile, `${picName || "screenshots_" + Date.now() + ".png"}`);
			console.log(`M4C.Issue.uploadFile:`, {"uploadURi": uploadURi, "id": id, "token": acToken, "file_size": imagefile.size});
			try {
				if(rkey)
					this.$set(this.sendMap[rkey], "status", 'UPLOAD_FILE');
				asyncAwaitFetchArrayBuffer(uploadURi, {
					method: 'POST',
					body: formData
				}).then(buffer=>{
					M4C.AC.acToken.splice(0,1); // 順便清除acToken
					let enc = new TextDecoder("utf-8");
					let arr = new Uint8Array(buffer);
					let str = enc.decode(arr);
					console.log(`M4C.Issue.uploadFile result:`, str);
					// 回應可能包含多行內容
					str.split("\n").forEach((strJson)=>{
						if (strJson) {
							let obj = JSON.parse(strJson);
							if (obj.cd===1) {
								if(rkey)
									self.$set(self.sendMap[rkey], "status", 'UPLOAD_FILE_SUCCESS');
								if(!noNotify){
									this.$store.state.notify({
										icon: `check_circle`,
										head: `问题回报`,
										body: `檔案上传成功`,
									});
								}
							}
							else {
								if(rkey)
									self.$set(self.sendMap[rkey], "status", 'UPLOAD_FILE_FAIL');
								if(noNotify){
									this.$store.state.notify({
										icon: `error`,
										head: `问题回报`,
										body: `${this.$ln('檔案上传失敗')} (${obj.cd})`,
									});
								}
							}
						}
					});
					if(!noNotify)
						delete self.sendMap[rkey];
				});
			} catch(e) {
				if(rkey)
					self.$set(self.sendMap[rkey], "status", 'UPLOAD_FAIL');
				console.error(`M4C.Issue.uploadFile exception Msg: `, e.message);
			}
		},
		cleanData() {
			this.$set(this.$store.state.data.issueData, []);
			this.$set(this.$store.state.data.issueUnreadData, []);
		},
		// 發送issue
		submitIssue(data, attachObj, config) {
			let cmd = {
				s: "helpdesk",
				c: "issue.new",
				d: {
					mac: this.mac,
					device_id: this.device_id,
					os: this.os,
					ap: this.ap,
					ap_vs: this.ap_vs,
					app_id: this.app_id,
					app_vs: this.app_vs,
					plugin_oc: this.plugin_oc,
					cli_memo: this.memo,
				},
				r: "".random(),
				ts: Date.parse(new Date())
			};
			cmd.d.title = data.title;
			cmd.d.desc = data.desc;
			console.log(JSON.stringify(cmd, null, 2));
			if(attachObj) {
				this.uploadMap[cmd.r] = attachObj;
			}
			M4C.send(cmd, 'quote');
			if(!config || !config.noNotify)
				this.$store.state.notify(`问题回报已送出`);
			config = config || {};
			this.sendMap[cmd.r] = config;
			this.$set(this.sendMap[cmd.r], "status", 'SUBMIT_ISSUE');
			this.$set(this.sendMap[cmd.r], "key", cmd.r);
			return this.sendMap[cmd.r];
		},
		reQueryIssue() {
			this.cleanData();
			// 有cache命令才重發
			if(Object.keys(this.cacheCmd).length)
				M4C.send(this.cacheCmd, 'quote');
			// 有cache命令才重發
			if(Object.keys(this.cacheUnreadCmd).length)
				M4C.send(this.cacheUnreadCmd, 'quote');
		},
		// 查詢是否有未讀訊息(預設第一頁50筆)
		queryUnreadMsg(pg=1, sz=50){
			let cmd = {
				s: "helpdesk",
				c: "issue.srch",
				d: {
					is_read: false,			// 讀取狀態. True=已讀, False=未讀.
					pager: {pg: pg, sz: sz},	// 分頁資訊. 取第pg頁sz筆未讀.
				},
				r: "".random(),
				ts: Date.parse(new Date())
			};
			this.unReadMap[cmd.r] = true;
			this.cacheUnreadCmd = cmd;
			M4C.send(cmd, 'quote');
		},
		// 查詢issue
		queryIssue(param) {
			let isRead = param? param.isRead: "";
			let page =  param? param.page: "";
			let cmd = {
				s: "helpdesk",
				c: "issue.srch",
				d: {},
				r: "".random(),
				ts: Date.parse(new Date())
			};
			if(page){	// 分頁資訊. 如果沒有此參數, 服務只會回傳前 20 個.
				cmd.d.pager = {pg: page};
			}
			if(isRead === false){	// 讀取狀態. True=已讀, False=未讀.
				cmd.d.is_read = isRead;
				this.unReadMap[cmd.r] = true;
				this.cacheUnreadCmd = cmd;
			}
			else this.cacheCmd = cmd;
			this.cleanData();			
			M4C.send(cmd, 'quote');
			return this.baseQuery('DataIssueList');
		},
		// 取特定問題回報
		getIssue(id){
			let cmd = {
				s: "helpdesk",
				c: "issue.get",
				d: {
					_id: id,	//	回報 ID
				},
				r: "".random(),
				ts: Date.parse(new Date())
			};
			M4C.send(cmd, 'quote');
		},
		// 增加留言
		addIssueCmt(data){
			let cmd = {
				s: "helpdesk",
				c: "issue.cmt.add",
				d: {
					_id: data.id,		//	回報 ID
					comment: data.comment,	// 訊息
				},
				r: "".random(),
				ts: Date.parse(new Date())
			};
			M4C.send(cmd, 'quote');
			this.$store.state.notify(`留言已送出`);
		},
		// 設定已讀
		setReaded(data){
			let cmd = {
				s: "helpdesk",
				c: "issue.read",
				d: {
					_id: data.id,	//	回報 ID
					_vs: data.vs,	// 版本號
				},
				r: "".random(),
				ts: Date.parse(new Date())
			};
			this.setReadMap[cmd.r] = data.id;
			M4C.send(cmd, 'quote');
		},
		// 更新問題回報已讀狀態
		updateRead(id) {
			let self = this;
			// 全部資料
			this.$store.state.data.issueData.data.map(is=>{
				if(is._id == _id) {
					is.is_read = true;
				}
			});
			// 未讀資料
			if(this.$store.state.data.issueUnreadData.data){
				this.$store.state.data.issueUnreadData.data.map(is=>{
					if(is._id == _id) {
						is.is_read = true;
						// 是否有下一頁
						if(this.$store.state.data.issueData.pager.hn) {
							// 有下一頁以當前頁數重查
							M4C.send(this.cacheUnreadCmd, 'quote');
						}
					}
				});
			}
		},
		// 更新特定問題回報
		updateData(data) {
			let self = this;
			// 全部資料(有資料)
			if(this.$store.state.data.issueData.data) {
				this.$store.state.data.issueData.data.forEach((is, idx)=>{
					if(is._id == data._id) {
						self.$set(self.$store.state.data.issueData.data, idx, data);
					}
				});
			}
			// 無資料=>有資料
			else {
				self.$store.state.data.issueData.data = [data];
			}
			// 未讀資料(有資料)
			if(this.$store.state.data.issueUnreadData.data) {
				this.$store.state.data.issueUnreadData.data.forEach((is, idx)=>{
					if(is._id == data._id) {
						self.$set(self.$store.state.data.issueUnreadData.data, idx, data);
					}
				});
			}
			// 無資料=>有資料
			else {
				self.$store.state.data.issueUnreadData.data = [data];
			}
			// 更新當前回報資料
			if(this.currentIssue._id == data._id) {
				this.currentIssue = data;
			}
		},
		// 收到建立反饋資料。
		onSubmitData(data) {
			let self = this;
			let noNotify = self.sendMap[data.r] && self.sendMap[data.r].noNotify;
			if (data.$CD < 0) {
				if(self.sendMap[data.r])
					self.$set(self.sendMap[data.r], "status", 'SUBMIT_ISSUE_FAIL');
				if(!noNotify){
					// 建立失敗提示
					eventBus.$emit("CONFIRM-DIALOG", {
						title: `问题回报建立失败`,
						content: `${self.$ln('问题回报建立失败, 请稍后再试')} (${data.$CD})`,
						confirmOnly: true,
					});
				}
			}
			if(data.$CD == 1){
				if(self.sendMap[data.r])
					self.$set(self.sendMap[data.r], "status", 'SUBMIT_ISSUE_SUCCESS');
				if(!noNotify){
					self.$store.state.notify({
						icon: `check_circle`,
						head: `问题回报`,
						body: `问题回报建立完成`,
					});
				}
				if(self.uploadMap[data.r]){
					if(self.sendMap[data.r])
						self.$set(self.sendMap[data.r], "status", 'ATTACHMENT_ISSUE_FILE');
					// 根據附圖數量各別上傳
					for(let i = 0; i< self.uploadMap[data.r].length; i++) {
						self.uploadFile(data.d._id, self.uploadMap[data.r][i].content, M4C.AC.acToken[i], self.uploadMap[data.r][i].name, data.r);
					}
				}
				// 當建立回報後重查問題回報清單
				// (因1.80版app在問題回報清單新增一個回報按鈕，所以回報完成需要另外查詢，以更新清單資料)
				self.reQueryIssue();
			}
			// 清除截圖資料及時間。
			self.catchScreenData = "";
			self.catchScreenName = "";
			self.catchScreenTime = "";
			self.catchScreenCost = 0;
			// 沒有上傳檔案，直接移除上傳mapping表的資料
			if(!self.uploadMap[data.r])
				delete self.sendMap[data.r];
			delete self.uploadMap[data.r];
		},
		// 收到查詢反饋資料(每頁資料)。
		onQueryData(pageIssue) {
			let self = this;
			let result = self.baseOnTradeData('DataIssueList', pageIssue);
			if (pageIssue.$CD < 0) {
				// 查询失敗提示
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `问题回报建立失败`,
					content: `${this.$ln('问题回报建立失败, 请稍后再试')} (${pageIssue.$CD})`,
					confirmOnly: true,
				});
			}
			if (pageIssue.$CD == 1 && pageIssue.d.data.length) {
				// 收到第一筆資料如果是未讀則設定未讀訊息為true;
				if(!pageIssue.d.data[0].is_read) this.unReadMsg = true;
				// 不是只查是否有未讀資料才做更新
				if(pageIssue.pg !== 1 || pageIssue.sz !== 1){
					// 覆蓋回報資料。
					if(this.unReadMap[pageIssue.r])
						this.$store.state.data.issueUnreadData = pageIssue.d;
					else
						this.$store.state.data.issueData = pageIssue.d;
				}
			}
			else if (pageIssue.$CD == 1 && !pageIssue.d.data.length){
				// 沒資料就表示可能沒未讀留言
				this.unReadMsg = false;
			}
		},
		onGetData(data) {
			if (data.$CD == 1 && data.d)
				this.updateData(data.d);
		},
		// 收到建立留言資料。
		onAddIssueCmt(data) {
			if (data.$CD < 0) {
				// 建立留言失敗提示
				this.$store.state.notify({
					icon: `error`,
					head: `问题回报`,
					body: `${this.$ln('建立留言失败')} (${data.$CD})`,
				});
			}
			else {
				this.$store.state.notify({
					icon: `check_circle`,
					head: `问题回报`,
					body: `留言已建立`,
				});
				this.updateData(data.d);			
			}
		},
		// 收到設定已讀資料。
		onSetReaded(data) {
			if (data.$CD == 1 && data.d){
				this.updateData(data.d);
			}
		},
		// 收到更新資料。
		onUpdateData(data) {
			if (data.$CD == 1 && data.d){
				this.unReadMsg = true;
				this.updateData(data.d);
			}
		},
	},
	watch: {
		// 建立quote連線後查詢是否有未讀留言
		"$store.state.wsConnMap.quote.$STATUS"(nv){
			if(nv == "AC-LOGIN-READY"){
				this.queryUnreadMsg();
				this.clsVersionObj = {};
				Object.entries(localStorage).forEach(obj => {
					if((obj[0].indexOf(`${this.projectID}_SYMBOL_`) != -1) && (obj[0].indexOf(`.d`) == -1)) {
						this.clsVersionObj[obj[0]] = obj[1];
					}
				});
			}
		},
		// 沒有多的未讀時
		"$store.state.data.issueUnreadData"(nv) {
			if(!nv && nv.pager.pg == 1) this.unReadMsg = false;
		},
	},
    computed: {
		projectID() {
			return this.$store.state.config.projectID;
		},
		mac() {return this.$store.state.device.macAddress;},					// MAC 位址
		device_id() {return this.$store.state.device.deviceID;},				// 裝置 ID
		os() {},																// OS 版本
		ap() {},																// 主程式
		ap_vs() {																// 主程式版本
			// 由於已經有送 userAgent，所以不再用 plugin 取 browser name/version
			return this.$store.state.device.appVersion;
		},				
		app_id() {},															// App ID
		app_vs() {return window._version.v;},									// App 版本
		plugin_oc() {return this.$store.state.device.optionCloudVersion;},		// 期權雲版本
		issueList() {return this.$store.state.data.issueData;},					// 問題與建議列表
		userAgent() {return navigator.userAgent;},
		$uploadHost() {
			return this.$store.state.status.quoteHost;
		},
		isIOS() {return this.$store.state.device.isIOS;},
		isAPP() {return this.$store.state.device.isAPP;},
		isMobile() {
			return this.$store.state.device.isMobile;
		},
		quoteInfo() {return this.$store.state.wsConnMap.quote.info;},
		tradeInfo() {return this.$store.state.selectedWSConn.info;},
		acPdSetting() {return this.$store.state.selectedWSConn.acPdSetting;},
		navigator() {
			let na = {};
			for(let key in window.navigator) {
				na[key] = window.navigator[key];
			}
			return na;
		},
		// 手機相關資訊(由native提供)
		deviceInfo() {return window.device;},
		memo() {
			let result = {};
			// 報價連線資料
			result.quoteInfo = this.quoteInfo;
			// 當前交易連線資料
			result.tradeInfo = this.tradeInfo;
			// pdsettin 資料
			result.acPdSetting = this.acPdSetting;
			// 總表、分類表、合約表版本資料。
			result.clsVersion = this.clsVersionObj;
			// result.navigator = this.navigator;
			result.userAgent = this.userAgent;
			// 期權雲產生的隨機碼
			result.OptionCloudUserKey = window.OptionCloud? window.OptionCloud.userKey: null;
			// 下滑截圖時間
			result.catchScreenTime = this.catchScreenTime;
			// 下滑截圖花費時間
			result.catchScreenCost = this.catchScreenCost;
			// 手機品牌相關資訊
			result.deviceInfo = this.deviceInfo;
			return JSON.stringify(result, null, 2);
		}
	},
}
</script>
