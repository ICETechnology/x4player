<template>
    <div class="m4c-selfgroup hidden" />	
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
/* 
	2022/11/08
	由於跨產品同步自選的調整，資料格式及驗證機制已與原本不同，
	所以如果要重新啟用同步桌機功能(...Ex...)需重新驗證相關的地方。
	目前由於x4桌機版已暫停，所以對於跨產品同步自選的這個調整，沒有再做同步桌機的機制驗證。
*/
export default {
	mixins: [M4C_Base],
	data() {
		return {
			// (預設一組自選群組不可刪)
			defaultGroup: [{idx: 0, label: "自選群組1", param: ['I.F.TWF.TXF.HOT', 'I.F.TWF.MXF.HOT']}],
			hasMktMap: {},
			// 是否同步(僅deviceID改變時切換)
			isSync: false,
			// 持倉商品代碼列表
			posSidList: [],
			cloudVersion: 0,
			subVersion: 0,
			// 跨產品同步自選的調整，將profile欄位固定為myselect(由於有幾個地方用到，所以設為變數處理)
			profileKey: "myselect",
			exeOnce: false,
		}
	},
	beforeMount() {
		M4C.regDispatch({'s': 'Q', 'c': 'mkt', 'callback': this.onMktData.bind(this)});
		// 支持 Vuex + Window全域
		M4C.SelfGroup = this.$store.state.m4c.selfgroup = this;
		// 註冊資料分派 - 訂閱雲端資料
		M4C.regDispatch({'s': 'APConfig', 'c': 'subBkr', 'callback': this.onSubCloudData.bind(this)});
		// 註冊資料分派 - 解訂閱雲端資料
		M4C.regDispatch({'s': 'APConfig', 'c': 'unsubBkr', 'callback': this.onUnsubCloudData.bind(this)});
		// 註冊資料分派 - 訂閱雲端資料EX
		M4C.regDispatch({'s': 'APConfig', 'c': 'subEx', 'callback': this.onSubCloudData.bind(this)});
		// 註冊資料分派 - 解訂閱雲端資料EX
		M4C.regDispatch({'s': 'APConfig', 'c': 'unsubEx', 'callback': this.onUnsubCloudData.bind(this)});	
		// 註冊資料分派 - 設定自選
		M4C.regDispatch({'s': 'APConfig', 'c': 'setBkrUser', 'callback': this.onSetUserData.bind(this)});
		// 註冊資料分派 - 設定自選EX
		M4C.regDispatch({'s': 'APConfig', 'c': 'setExUser', 'callback': this.onSetUserData.bind(this)});		
		// 註冊資料分派 - 取得自選
		M4C.regDispatch({'s': 'APConfig', 'c': 'getBkrUser', 'callback': this.onGetData.bind(this)});
		// 註冊資料分派 - 取得自選EX
		M4C.regDispatch({'s': 'APConfig', 'c': 'getExUser', 'callback': this.onGetData.bind(this)});
		// 註冊資料分派 - 刪除自選
		M4C.regDispatch({'s': 'APConfig', 'c': 'delBkrUser', 'callback': this.onDelUserData.bind(this)});
		// 註冊資料分派 - 刪除自選EX
		M4C.regDispatch({'s': 'APConfig', 'c': 'delExUser', 'callback': this.onDelUserData.bind(this)});
		
		// 支持公開設定指定預設的自選群組
		this.defaultGroup = this.multiSS && this.multiSS.defaultGroup ? this.multiSS.defaultGroup : this.defaultGroup;
	},
	mounted() {
		// 自選清單 from localStorage (不存在時預設塞入 defaultGroup)
		let ssgList = this.$store.state.data.ssgList = this.parseGroup(JSON.parse(localStorage.getItem(this.storageKey))) || this.defaultGroup;
		// 相容從『關注』升級為『多組自選』
		if (ssgList.length === 1 && ssgList[0].label === '自选群组1') {
			ssgList[0].label = '自選群組1';
			ssgList[0].idx = 0;
			ssgList[0].keep = true;
		}
	},
    methods: {
		resumeBundle() {
			this.$store.state.device.bundleDevice = {};
			this.$store.state.device.deviceID = this.$store.state.device.orginDeviceID;
		},
		// 新增自選群組
		addGroup(group) {
			this.$store.state.data.ssgList.push(group);
			// 紀錄資料儲存時間
			this.$store.state.config.ssgListUpdateTime = new Date().getTime();
			this.saveDataToCloud();
		},
		// 移除指定自選群組
		removeGroup(idx) {
			this.$store.state.data.ssgList.splice(idx, 1);
			// 紀錄資料儲存時間
			this.$store.state.config.ssgListUpdateTime = new Date().getTime();
			this.saveDataToCloud();
		},
		// 更改自選名稱
		changeGroupName(idx, newName) {
			this.$store.state.data.ssgList[idx].label = newName;
			// 紀錄資料儲存時間
			this.$store.state.config.ssgListUpdateTime = new Date().getTime();
			this.saveDataToCloud();
		},
		// 更新自選群組索引
		updateGroupidx(groupList){
			this.$store.state.data.ssgList = groupList;
			// 紀錄資料儲存時間
			this.$store.state.config.ssgListUpdateTime = new Date().getTime();
		},
		// 將指定的 sidList 存回至當前停留在的自選群組
		saveCurGroup(sidList) {
			let idx = vuex.status.quoteTabID.split(".")[2];
			vuex.data.ssgList[idx].param = sidList;
			this.saveGroup(vuex.data.ssgList);
		},
		// 儲存自選群組及清單資料
		saveGroup(groupList) {
			let groupData = this.parseGroup(groupList);
			// 當解析資料失敗時不處理
			if(!groupData) return;
			this.$store.state.data.ssgList = groupData;
			// 紀錄資料儲存時間
			this.$store.state.config.ssgListUpdateTime = new Date().getTime();

			localStorage.setItem(this.storageKey, this.strSsgList);
			// 同步雲端資料
			this.saveDataToCloud(this.groupList);
		},
		// 確認是否在關注列表裡 
		checkInGroup(sid) {
			if (this.multiSS)
				return this.strSsgList.indexOf(sid) !== -1;
			else
				return !!this.$store.state.data.focusList.find(s=>(s===sid));
		},
		checkInPos(sid){
			let strPosList = JSON.stringify(this.posSidList);
			return strPosList.indexOf(sid) !== -1;
		},
		// 查詢所有自選商品市況
		queryMkt() {
			let cmd = {};
			cmd.s = 'Q';
			cmd.c = 'mkt';
			// 增加"DataMkt_"以辨別
			cmd.r = `DataMkt_${"".random()}`;
			cmd.d = {};
			cmd.d.s = this.sidList;
			M4C.send(cmd);
			return this.baseQuery('DataMkt');
		},
		// 清除已下市商品
		cleanExpiredContract() {
			for(let key = 0; key < this.groupList.length; key++){
				let sidList = this.groupList[key].param;
				let newList = [];
				for(let i = 0; i < sidList.length; i++){
					let sid = sidList[i];
					if(this.hasMktMap[sid] || sid.indexOf("HOT") > 0) {
						// 週台期且轉月份後還是熱門月代碼==>移除(不加到自選)
						if(M4C.Symbol.isWeeklySymbol(sid) && M4C.Symbol.toMonthSymbol(sid) === sid)
							console.log(`clean Expired weekly Contract`, sid);
						else
							newList.push(sid)
					}
					// 已下市商品
					else {
					 	console.log(`clean Expired Contract`, sid);
					}
				}
				this.$store.state.data.ssgList[key].param = newList;
			}
		},
		// 清除系統不支持的合約
		cleanNoSupContract(){
			// 每次開啟只執行一次
			if(this.exeOnce) return;
			this.exeOnce = true;

			if(Object.keys(M4C.Symbol.mainformInfos).length<=100) return;
			// 延續已清除下市商品的自選 
			const groupList = this.$store.state.data.ssgList;
			// 每次最多只刪除一次
			let delFlag = false;

			groupList.forEach((group, key) =>{
				if(delFlag) return;
				const sidList = group.param;
				const newList = [...sidList];
				for ( let i = 0; i < sidList.length; i++){
					const sid = sidList[i];
					// 一次最多只刪除一個系統不支持的合約
					if (!M4C.Symbol.getMainformInfo(sid)){
						delFlag = true;
						newList.splice(i,1);
						// 有監聽這行，所以如果設定儲存雲端，會自動儲存在雲端
						this.$store.state.data.ssgList[key].param = newList;
						break
					}
				}
			})
		},
		// 收到市況資料
		onMktData(data) {
			if(data.r.indexOf("DataMkt_") == 0){
				let result = this.baseOnData('DataMkt', data);
				if (data.cd === 40) {
					data.d.forEach((qo)=>{
						this.hasMktMap[qo.s] = true;
					});
					this.cleanExpiredContract();
					this.cleanNoSupContract();
				}
			}
		},
		subExCloudData(){
			let cmd = {};
			cmd.s = "APConfig";
			cmd.c = "subEx";
			cmd.r = "".random();
			cmd.d = {"product": this.prod};
			this.sendCmd(cmd);
		},
		// 訂閱APConfig
		subCloudData(){
			let cmd = {};
			cmd.s = "APConfig";
			cmd.r = "".random();
			cmd.d = {};
			// 有綁定裝置，跨product取資料
			if(this.bundleDeviceID) {
				this.subExCloudData();
			}
			cmd.c = "subBkr";
			cmd.d = this.cmdData;
			this.sendCmd(cmd);
		},
		// 解除訂閱APConfig
		unsubCloudData(prod, unsubData){
			let cmd = {};
			cmd.s = "APConfig";
			cmd.r = "".random();
			cmd.d = {};
			// 解訂閱自己的產品(沒帶也是解訂自己)
			if(prod == window.prod || !prod) {
				cmd.c = "unsubBkr";
				cmd.d = unsubData;
			}
			// 解訂其他的產品
			else {
				cmd.c = "unsubEx";
				cmd.d["product"] = prod;
			}
			this.sendCmd(cmd);
		},
		// 廣播同步裝置
		broadcastSyncDevice() {
			let cmd = {};
			cmd.s = "APConfig";
			cmd.r = "".random();
			cmd.c = "setExUser";
			cmd.d = {"profile": 'syncDeviceID', "data": {}, "product": this.prod, "user": this.deviceID};
			this.sendCmd(cmd);
		},
		// 存儲自選到雲端
		saveDataToCloud(selfGroup = this.groupList, key = this.apConfigKey){
			// 雲端自選設定為否，不儲存雲端資料
			if(!this.saveToCloud)return;		
			let cmd = {};
			cmd.s = "APConfig";
			cmd.r = "".random();
			// 有綁定裝置，跨product取資料
			if(this.bundleDeviceID) {
				cmd.c = "setExUser";
				cmd.d = {"profile": key, "data": {'content': selfGroup ,'update_time': new Date().getTime()}, "product": this.prod, "user": this.deviceID};
			}
			else {
				cmd.c = "setBkrUser";
				cmd.d = JSON.parse(JSON.stringify(this.cmdData));
				cmd.d.data = {'content': selfGroup ,'update_time': new Date().getTime()};
			}
			this.sendCmd(cmd);
		},
		// 取得雲端自選
		getDataFromCloud(key = this.apConfigKey){
			// 雲端自選設定為否，不讀取雲端資料
			if(!this.saveToCloud)return;			
			let cmd = {};
			cmd.s = "APConfig";
			cmd.r = "".random();
			// 有綁定裝置，跨product取資料
			if(this.bundleDeviceID) {
				cmd.c = "getExUser";
				cmd.d = {"profile": key, "product": this.prod, "user": this.deviceID};
			}
			else {
				cmd.c = "getBkrUser";
				cmd.d = this.cmdData;
			}
			this.sendCmd(cmd);
		},
		// 刪除雲端資料
		delCloudData(key = this.apConfigKey){
			let cmd = {};
			cmd.s = "APConfig";
			cmd.r = "".random();
			// 有綁定裝置，跨product取資料
			if(this.bundleDeviceID) {
				cmd.c = "delExUser";
				cmd.d = {"profile": key, "product": this.prod, "user": this.deviceID};
			}
			else {
				cmd.c = "delBkrUser";
				cmd.d = this.cmdData;
			}
			this.sendCmd(cmd);
		},
		// 發送命令
		sendCmd(cmd) {
			// 指定交易連線存自選且未登入(如果存交易連線且又非DCore會掛)
			if(!this.loginReady && this.wsChannel != 'quote'){
				M4C.Trader.checkLoginTrade();
				return;
			}
			M4C.send(cmd, this.wsChannel);
		},
		// 訂閱雲端資料server回應訊息
		onSubCloudData(data) {
			if(data.$CD < 0){
				this.noticeErrorData(data, '[M4C.SelfGroup] SubCloudData fail:');
			}
			// 雲端版本不同時重新取得。
			else if(data.d.u){
				for(let key in data.d.u) {
					let cloudDataVersion = data.d.u[key];
					// 重新取得自選
					if(key === this.profileKey && cloudDataVersion != this.cloudVersion) {
						console.log('[M4C.SelfGroup]', 'SubCloudData update: ' + data.d.u[this.profileKey]);
						this.subVersion = cloudDataVersion;
						this.getDataFromCloud();
					}
					// 用移除profile方式暫時替代廣播，收到後移除該profile
					// 裝置同步通知(-1代表無資料，移除後還會收到syncDeviceID通知且值是-1，所以要避免重複執行)
					if(key === "syncDeviceID" && data.d.u.syncDeviceID != -1) {
						// 由被綁定裝置去執行刪除動作。可少開delExUser權限
						if(!this.bundleDeviceID)
							this.delCloudData("syncDeviceID");
						this.$store.state.notify(`同步完成 !`);
					}
				}
			}
		},
		// 解訂閱雲端資料server回應訊息
		onUnsubCloudData(data) {
			if(data.$CD < 0){
				this.noticeErrorData(data, '[M4C.SelfGroup] UnsubCloudData fail:');
			}
			else {
				console.log('[M4C.SelfGroup]', 'UnsubCloudData success');
			}
		},
		// 設定雲端自選server回應訊息
		onSetUserData(data){
			if(data.$CD < 0){
				this.noticeErrorData(data, '[M4C.SelfGroup] SetUserData fail:');
			}
		},
		// 依profile key指派處理
		onGetData(data) {
			if(!data.d) return;
			// 預期應該有profile，profile是myselect才處理
			if(data.d.profile == this.profileKey){
				this.onGetUserData(data);
			}
			// 同步狀態，代表初次與桌機連結，但未同步過桌機資料
			else if(this.isSync) {
				this.isSync = false;
				// 同步桌機資料
				// 因跨產品同步自選調整，這裡自選會變成後蓋前，不是之前的合併兩邊自選
				this.saveDataToCloud(this.groupList);
				// 廣播同步裝置
				this.broadcastSyncDevice();
			}
			// 初次使用沒有自選資料, 以預設清單當關注。
			else if(!data.d.v && !this.isSync) {
				this.updateFucusList();
			}
		},
		// 取得雲端自選server回應訊息
		onGetUserData(data){
			// 比較雲端儲存與localStorage儲存的時間，使用時間較後面的自選清單。以免雲端儲存失敗
			if(data.d.data){
				if(data.d.data && data.d.data.update_time < this.$store.state.config.ssgListUpdateTime) return;
			}

			let	dataList = (data.d.data && data.d.data.content) ? data.d.data.content: [];

			// 版本號不同就更新版本號。
			if(data.d.v && data.d.v !== this.cloudVersion){
				this.subVersion = this.cloudVersion = data.d.v;
			}
			else return;
			if(data.$CD < 0){
				this.noticeErrorData(data, '[M4C.SelfGroup] GetUserData fail:');
			}
			// 有資料->取代本地資料 (後蓋前)
			// 無資料->不處理。本地有資料維持不變。
			else if(dataList.length){
				this.$store.state.data.ssgList = dataList;
				this.queryMkt();
			}
		},
		// 刪除雲端自選server回應訊息
		onDelUserData(data) {
			if(data.$CD < 0){
				this.noticeErrorData(data, '[M4C.SelfGroup] DelUserData fail:');
			}
		},
		// 處理並提示錯誤訊息
		noticeErrorData(data, logPrefixText) {
			let msg = data.$MSG || "";
			let code = data.$CD;
			// this.$store.state.notify(`error`, msg);
			console.error(logPrefixText, msg, `(${code})`);
		},
		// 解析自選資料
		parseGroup(grp) {
			// 如果是字串就解析一次
			if(typeof grp === "string") {
				grp = JSON.parse(grp);
				// 還是字串就回傳false
				if(typeof grp === "string") {
					return false;
				}
				else {
					return grp;
				}
			}
			else 
				return grp;
		},
		// 更新關注列表
		updateFucusList() {
			/* 由於跨產品同步自選機制，自選陣列的第一組如果有變(ex: 其他產品有變動順序)，這裡的關注列表也會跟著變動。 */
			// 自選第一組列表
			let selfList = this.$store.state.data.ssgList[0].param;
			// 連結持倉、自選列表
			let concatList = this.$store.state.config.posListAddToFocusList? this.posSidList.concat(selfList): selfList;
			// 合併列表
			let mergeList = [...(new Set(concatList))];
			// 有合併列表或有雲端版號維持使用合併列表。反之取預設列表
			let list = mergeList.length || this.cloudVersion? mergeList: this.defaultWatchList;
			// 更新關注列表
			this.$store.state.data.focusList = list;
		},
	},
	watch: {
		// 建立quote連線後查詢、訂閱雲端資料
		"$store.state.wsConnMap.quote.$STATUS"(nv){
			if(nv == "AC-LOGIN-READY" && this.wsChannel === 'quote'){
				this.getDataFromCloud();
				this.subCloudData();
			}
		},
		loginReady(nv) {
			if(nv && this.wsChannel !== 'quote'){
				this.getDataFromCloud();
				this.subCloudData();
			}
		},
		mainformReadyAndQuoteLoginReady(nv) {
			// 總表與行情連線已完成
			if (nv) {
				// 回補自選市況
				this.queryMkt();
			}
		},
		// 監看$store.state.data.ssgList
		"$store.state.data.ssgList": {
			handler(nv, ov) {
				if(localStorage.getItem(this.storageKey) !== this.strSsgList){
					localStorage.setItem(this.storageKey, this.strSsgList);
					// 訂閱版本與雲端版本不同時同步雲端資料
					// if(this.subVersion != this.cloudVersion)
					// 同步雲端資料
					this.saveDataToCloud(this.groupList);
				}
				// 更新關注列表
				this.updateFucusList();
			},
			deep: true,
		},
		deviceID(nv, ov) {
			if(ov && nv != ov) {
				// 有設定同步裝置
				if(this.bundleDeviceID)
					this.isSync = true;
				// 切換登入帳號(行情)
				this.cloudVersion = "";
				M4C.wsConnMap.quote.info.user = nv;
				M4C.reconnect(M4C.wsConnMap.quote);
			}
		},
		"$store.state.data.normalPositionSumList"(nv, ov) {
			// 更新持倉商品代碼列表
			this.posSidList = this.$store.state.data.normalPositionSumList.map(pos=>(pos.SYMBOL));
			// 更新關注列表
			this.updateFucusList();
		},
		// 系統設定關開
		"$store.state.config.posListAddToFocusList"(nv, ov) {
			this.updateFucusList();
		},
	},
    computed: {
		apConfigKey() {if(this.deviceID) return `${this.deviceID}_selfGroup_v1`;},
		apConfigUser() {return this.$store.state.config.twMode? this.traderID: this.deviceID;},
		bundleDevice() {return this.$store.state.device.bundleDevice;},
		bundleDeviceID() {return this.bundleDevice.deviceID;},
		bundleDeviceProd() {return this.bundleDevice.prod;},
		prod() {return this.bundleDeviceID? this.bundleDeviceProd: window.prod},
		deviceID() {return this.bundleDeviceID || this.$store.state.device.deviceID;},
		storageKey() {
			return `${this.$store.state.config.projectID}-SELFSELECT`;
		},
		groupList() {
			let list = this.parseGroup(this.$store.state.data.ssgList);
			return list || this.defaultGroup;
		},
		strSsgList() {
			return JSON.stringify(this.$store.state.data.ssgList);
		},
		sidList() {
			let result = [];
			if(this.groupList[0] && this.groupList[0].param){
				this.groupList.forEach((obj)=>{
					result = result.concat(obj.param);
				});
			}
			return result;
		},
		quoteLoginReady() {
			if (this.$store.state.wsConnMap.quote)
				return this.$store.state.wsConnMap.quote.loginReady;
		},
		// 總表與行情連線是否已完成
		mainformReadyAndQuoteLoginReady() {
			return this.$store.state.status.mainformReady && this.quoteLoginReady;
		},
		// 當前交易連線
		wsConn() {
			return this.$store.state.selectedWSConn;
		},
		// 交易連線 - 登入完成
		loginReady() {
			try {return this.wsConn.loginReady;} catch(e) {return false;}
		},
		/** 取行情pdsetting中的資料當預設清單 */
		defaultWatchList() {
			try {
				return this.$store.state.config.quotePdSetting.function.watchlist || [];
			}
			catch(e) {
				return [];
			}
		},
		compKey() {try{return `${window.comp}_shared`;} catch(e) {return "";}},
		traderID() {if(this.loginReady) return this.$store.state.login.traderID;},
		twMode() {
			return this.$store.state.config.twMode;
		},
		cmdData() {
			return {
					company: this.compKey,		// company、product以{company代碼}_shared當key;
					product: this.compKey,
					user: this.apConfigUser, 	// 台灣版以交易主帳當user，cn以deviceid當user;
					profile: this.profileKey,		// profile自選固定是"myselect"為key
				};
		},
		// 啟用多組自選機制
		multiSS() {
			return this.$store.state.config.publicPdSetting.function.multiSS;
		},
		// 雲端自選存取用的頻道(預設為quote)，其他為trade(M4C核心判斷非quote就用當前交易連線。)
		// 此設定如果設非quote在台灣版可能有用，但在CN有問題的機率很高，所以使用時要多測試各種情境。
		wsChannel() {
			return this.$store.state.config.publicPdSetting.selfGroupWsChannel || 'quote';
		},
		// 是否儲存至雲端
		saveToCloud(){try {return this.$store.state.config.CONFIG.SelfGroup.saveToCloud;} catch(e) {}}
	},
}
</script>
