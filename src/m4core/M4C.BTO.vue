<template>
    <div class="m4c-bto" v-show="false">
		<span>{{btaID}}</span>
		<span>{{sortedBTOList.length}}</span>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.BTO = this.$store.state.m4c.bto = this;
	},
	mounted() {},
    methods: {
		/** 指定 wsConn 設為選定 */
		setSelected(wsConn) {
			this.selectedBTO.selected = false;
			this.$set(wsConn.bto, 'selected', true);
		},
		/** 指定 bto 設為選定 */
		setSelectedBTO(bto) {
			this.selectedBTO.selected = false;
			this.$set(bto, 'selected', true);
		},
		/** 更新已登入交易帳號列表 */
		updateLoginedBTOList(wsConn, encryptPwd, accounts) {
			// 登入成功時同步
			this.$store.state.login.keepPassword = this.$store.state.status.keepPassword;
			this.$store.state.login.keepAccount = this.$store.state.status.keepAccount;
			let bto = wsConn.bto;
			// 尋找是否已經存在相同 btID 的 bto
			let idx = this.loginedBTOList.findIndex(obj => obj.brokerID === bto.brokerID && obj.traderID === bto.traderID);
			// 不存在時建一個新的
			if (idx === -1)
				this.loginedBTOList.push(bto);
			// 已存在時直接覆蓋 (同步 loginedBTOList[n].bto 至新建出來的 wsConn.bto)
			else
				this.loginedBTOList[idx] = bto;
			// 是否選中
			if (bto.selected == null)
				this.$set(bto, "selected", false);
			// 選中的子帳ID (預設第一個)
			if (bto.selectedAccountID == null)
				this.$set(bto, 'selectedAccountID', accounts ? accounts[0].ACCOUNT_ID : traderID);
			// 更新編碼後密碼 (不論有無記憶密碼都要留存，簽署雲端洗價同意書時需要使用)
			if (encryptPwd)
				this.$set(bto, "encryptPwd", encryptPwd);
			// 登入成功要立即設為選中的 btID
			if (this.setSelectedIfLoginReadyBTID === wsConn.key) {
				this.setSelected(wsConn);
				delete this.setSelectedIfLoginReadyBTID;
			}
			// 同步出 state.login 所有屬性
			this.updateStateLogin();
		},
		/**
			同步出 state.login 所有屬性
			同步出 state.login.btID = `brokerID|traderID` (可用來識別交易帳號切換)
			同步出 state.login.btaID = `brokerID|traderID|accountID` (這是保證唯一的身份ID，可用來識別資金帳號切換)
		 */
		updateStateLogin() {
			let brokerID = this.$store.state.login.brokerID = this.selectedBTO.brokerID;
			let traderID = this.$store.state.login.traderID = this.selectedBTO.traderID;
			let brokerKey = this.$store.state.login.brokerKey = this.selectedBTO.brokerKey;
			let accountID =  this.$store.state.login.accountID = this.selectedBTO.selectedAccountID;
			this.$store.state.login.displayTraderID = M4C.Trader.getDisplayTraderID(traderID);
			this.$store.state.login.loginReady = this.selectedWSConn.loginReady;
			this.$store.state.login.btID = brokerID && traderID ? `${brokerID}|${traderID}` : ``;
			this.$store.state.login.baID = brokerID && accountID ? `${brokerID}|${accountID}` : ``;
			this.$store.state.login.btaID = brokerID && traderID && accountID ? `${brokerID}|${traderID}|${accountID}` : ``;
			this.$store.state.login.accounts = this.selectedWSConn.accounts;
			this.$store.state.login.brokerName = this.$store.state.brokerNameMap[brokerKey];
			try{this.$store.state.login.traderName = this.selectedWSConn.accounts.find(o=>o.BROKER_ID===brokerID).CUST_NAME;}catch(e){}
			this.$store.state.login.isSIM = this.$store.state.selectedBTO.brokerID === 'IceTech';
		},
		/** 設定此 btID 登入成功後要立即設為選中 */
		setSelectedIfLoginReady(btID) {
			this.setSelectedIfLoginReadyBTID = btID;
		},
		// bto 對應回 wsConn
		btoToWsConn(bto) {
			let btID = `${bto.brokerID}|${bto.traderID}`;
			return this.$store.state.wsConnMap[btID];
		},
	},
	watch: {},
    computed: {
		loginedBTOList() {
			return this.$store.state.loginedBTOList;
		},
		/** 由報價登入 AC 回覆的可用 Broker 列表 */
		brokerMap() {
			return this.$store.state.brokerMap;
		},
		/** 同步出 state.selectedBTO */
		selectedBTO() {
			if (this.loginedBTOList.length === 0)
				return this.$store.state.selectedBTO = {};
			let bto = this.loginedBTOList.find(obj=>obj.selected) || this.loginedBTOList[0];
			return this.$store.state.selectedBTO = bto;
		},
		/** 同步出 state.selectedWSConn */
		selectedWSConn() {
			let bto = this.selectedBTO;
			let btID = `${bto.brokerID}|${bto.traderID}`;
			if (bto.brokerID && bto.traderID)
				window.btID = btID;
			return this.$store.state.selectedWSConn = this.$store.state.wsConnMap[btID] || {};
		},
		// 把 selectedBTO 與 selectedWSConn 當參數是為了讓這兩個變數內容有異動時都觸發此 computed
		btaID() {
			this.updateStateLogin(this.selectedBTO, this.selectedWSConn);
			return this.$store.state.login.btaID;
		},
		/** 經排序後的所有 bto 列表 */
		sortedBTOList() {
			return this.$store.state.sortedBTOList = this.loginedBTOList.sort((a,b)=>{
    			return `${a.brokerID}${a.traderID}` > `${b.brokerID}${b.traderID}` ? 1 : -1;
			});
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 是否要記憶密碼
		keepEncryptPwd() {
			return !this.twMode || this.$store.state.login.keepPassword;
		},
	},
}
</script>
