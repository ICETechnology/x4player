<template>
    <div class="m4c-continuous-ioc hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
import ContinuousIOC from '@/components/ContinuousIOC/ContinuousIOC.vue';

export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			pageIdx: 0,
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
        M4C.ContinuousIOC = this.$store.state.m4c.continuousIOC = this;
		// 註冊資料分派 - 新增
		M4C.regDispatch({'s': 'TRADE', 'c': 'cioc.add', 'callback': this.onAddData.bind(this)});
		// 註冊資料分派 - 查詢
		M4C.regDispatch({'s': 'TRADE', 'c': 'cioc.get', 'callback': this.onQueryData.bind(this)});
		// 註冊資料分派 - 刪除
		M4C.regDispatch({'s': 'TRADE', 'c': 'cioc.remove', 'callback': this.onDeleteData.bind(this)});
		// 註冊資料分派 - 更新
		M4C.regDispatch({'s': 'TRADE', 'c': 'cioc.update', 'callback': this.onUpdateData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'cioc.stop', 'callback': this.onChangeStatus.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'cioc.active', 'callback': this.onChangeStatus.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'cioc.pause', 'callback': this.onChangeStatus.bind(this)});
		// 註冊資料分派 - 歷史紀錄
		M4C.regDispatch({'s': 'TRADE', 'c': 'cioc.history', 'callback': this.onHistoryData.bind(this)});
		// 註冊資料分派 - 即時回報
		M4C.regDispatch({'s': 'TRADE', 'c': 'cioc', 'callback': this.onRealtimeData.bind(this)});

	},
    methods: {
		queryContiIOC(){
			this.$store.state.data.continuousIOCList = [];
			let result = this.$store.state.result.queryContinuousIOCResult = this.baseQuery(`${this.baID}|cioc.get`);
			let cmd = {
				"s": "TRADE",
				"c": "cioc.get",
				"d": {
					ACCOUNT_ID: this.accountID,
					BROKER_ID: this.brokerID
				},
				"r": "".random(),
			};

			M4C.send(cmd);

			return result;	
		},
		addContiIOC(param){
			let cmd = {
				"s": "TRADE",
				"c": "cioc.add",
				"r": "".random(),
			};
			cmd.d = param;
			cmd.d.ACCOUNT_ID = this.accountID;
			cmd.d.BROKER_ID = this.brokerID;
			M4C.send(cmd);

			return this.baseQuery(`${this.baID}|cioc.add`);
		},
		updateContiIOC(param){
			let cmd = {
				"s": "TRADE",
				"c": "cioc.update",
				"r": "".random(),
			};
			cmd.d = param;
			cmd.d.ACCOUNT_ID = this.accountID;
			cmd.d.BROKER_ID = this.brokerID;
			M4C.send(cmd);

			return this.baseQuery(`${this.baID}|cioc.update`);
		},
		deleteContiIOC(param){
			let cmd = {
				"s": "TRADE",
				"c": "cioc.remove",
				"d": {
					ACCOUNT_ID: this.accountID,
					BROKER_ID: this.brokerID
				},
				"r": "".random(),
			};
			cmd.d.CIOC_ID = param.CIOC_ID;
			M4C.send(cmd);

			return this.baseQuery(`${this.baID}|cioc.remove`);
		},
		changeContiIOCStatus(param,status){
			let cmd = {
				"s": "TRADE",
				"c": `cioc.${status}`,
				"d": {
					ACCOUNT_ID: this.accountID,
					BROKER_ID: this.brokerID,
					CIOC_ID: param.CIOC_ID,
					AP_TOOL: param.AP_TOOL,
					AP_PLUGIN: param.AP_PLUGIN,
				},
				"r": "".random(),
			};

			if (this.$store.state.cert[cmd.d.ACCOUNT_ID] && status == "active")
				this.sigSend(param, cmd);	
			else
				M4C.send(cmd);			

			return this.baseQuery(`${this.baID}|cioc.${status}`);
		},
		queryHistory(param, pageIdx, limit){
			let result = this.baseQuery(`${this.baID}|cioc.history`);
			
			// 有帶入的頁數，直接重新紀錄
			if(!isNaN(pageIdx))
				this.pageIdx = pageIdx;

			const skip = this.pageIdx * limit;

			let cmd = {
				"s": "TRADE",
				"c": `cioc.history`,
				"d": {
					ACCOUNT_ID: this.accountID,
					BROKER_ID: this.brokerID,
					CIOC_ID: param.CIOC_ID,
					SKIP: skip,
					LIMIT: limit, 
				},
				"r": "".random(),
			};
			M4C.send(cmd);
			return result;
		},
		onAddData(data){
			let result = this.baseOnTradeData(`${this.baID}|cioc.add`, data);
			// 命令已完成(cd=2)
			if (data.cd === 0) {				
				this.extendColumn(result);
				this.lightUpCard(data);
				this.flashMessage(result);
			}
		},
		onQueryData(data){
			let result = this.baseOnTradeData(`${this.baID}|cioc.get`, data);
			if (data.d && data.d.SYMBOL) {
				this.ciocList.push(data.d);
			}
			if(data.lt){
				this.ciocList.sort((a,b)=> new Date(b.UPDATE_TIME) - new Date(a.UPDATE_TIME));
			}
		},	
		onUpdateData(data)	{
			let result = this.baseOnTradeData(`${this.baID}|cioc.update`, data);

			if (data.cd === 0) {
				if(data.d){
					this.extendColumn(result);
					const updateIndex = this.ciocList.findIndex((contiObj)=> contiObj.CIOC_ID === result.data.d.CIOC_ID);
					this.ciocList.splice(updateIndex,1);
					this.ciocList.unshift(result.data.d);
					this.lightUpCard(data);
					this.flashMessage(result);
				}	
			}
		},
		onRealtimeData(data){
			if (data.cd === 0) {
				if(data.d){
					const updateIndex = this.ciocList.findIndex((contiObj)=> contiObj.CIOC_ID === data.d.CIOC_ID);
					this.ciocList.splice(updateIndex, 1, data.d);
				}	
			}
		},
		onChangeStatus(data){
			let result = this.baseOnTradeData(`${this.baID}|${data.c}`, data);
		},
		onDeleteData(data){
			let result = this.baseOnTradeData(`${this.baID}|cioc.remove`, data);
			if (data.cd === 0) {
				if(data.d){
					const updateIndex = this.ciocList.findIndex((contiObj)=> contiObj.CIOC_ID === data.d.CIOC_ID);
					result.data.d = Object.assign(result.data.d,{...this.ciocList[updateIndex]});
					this.extendColumn(result);
					this.ciocList.splice(updateIndex,1);
					this.flashMessage(result);
				}				
			}
		},
		onHistoryData(data){
			let result = this.baseOnTradeData(`${this.baID}|cioc.history`, data);

			if(data.cd == 0){
				if(data.d && data.d.HISTORY.length !=0)
					this.pageIdx ++;
			}
		},
		lightUpCard(data){
			const findIndex = this.dialogList.findIndex((obj)=>obj.cls === ContinuousIOC);
			// 新增的部分
			if(findIndex < 0){
				eventBus.$emit("CLOSE-DIALOG");		
				setTimeout(()=>{eventBus.$emit("POPUP-DIALOG", ContinuousIOC, data.d)},50);
			}
			// 修改的部分
			else{
				eventBus.$emit("CLOSE-DIALOG");	
				eventBus.$emit("CLOSE-DIALOG");		
				setTimeout(()=>{eventBus.$emit("POPUP-DIALOG", ContinuousIOC, data.d)},50);
			}		
		},
		// 簽章後送出
		sigSend(param, cmd) {
			let accountID = cmd.d.ACCOUNT_ID;
			let $cert = this.$store.state.cert[accountID];
			
			const cmdData = JSON.parse(JSON.stringify(cmd));
			cmdData.d = Object.assign(cmdData.d,param);
			let certContent = M4C.Order.getCertContent(cmdData ,true);	

			// 將明文簽出密文
			M4C.Cert.getSign(certContent).then((certSig)=>{
				cmd.d.CERT_NO = $cert.CERT_NO;			// 簽章序號
				cmd.d.CERT_SUBJECT = 'IOC_ORDER';		// 簽章主旨
				cmd.d.CERT_CONTENT = certContent;		// 簽章明文
				cmd.d.CERT_SIG = certSig;				// 簽章密文
				M4C.send(cmd);
			}).catch(err=>{
				// 委託失敗提示
				this.$store.state.notify({icon: `error`, head: `簽章失敗`, body: `(${err.CODE || '-99600'}) ${err.MSG || this.$ln('簽章異常')}`});
			});
		},
		// 擴增欄位
		extendColumn(result){
			switch (result.data.c){
				case 'cioc.update':
					result.$ACTION = "修改";
					break;
				case 'cioc.add':
					result.$ACTION = "加入";
					break;
				case 'cioc.remove':
					result.$ACTION = "刪除";
					break;
			}
			result.$CONTRACT_NAME = M4C.Symbol.getCNM4(result.data.d.SYMBOL, " ");
			result.$CONTRACT_NAME2 = M4C.Symbol.getCNM4(result.data.d.SYMBOL2, " ");
		},
		// 彈出提示訊息
		flashMessage(rpt) {	
			let brokerName = '';
			try{brokerName = this.$store.state.brokerNameMap[this.brokerID] || this.brokerID;}catch(e){}
			let displayAccountID = M4C.Trader.getDisplayTraderID(this.brokerID|| this.brokerID);

			this.$store.state.notify({
				icon: "campaign",
				head: `${rpt.$ACTION||''}成功`,
				htmlBody: `
					<div class="flex-col">
						<div class="clr-gray">${brokerName}</div>
						<div>${displayAccountID}</div>
						<div>${this.$ln('合约')} : ${rpt.$CONTRACT_NAME} ${rpt.$CONTRACT_NAME2 ? ('& ' + rpt.$CONTRACT_NAME2) : ''}</div>
						<div>${this.$ln('委托')} : 連續IOC${rpt.$ACTION||''}成功</div>
					</div>
					`,
				rpt: rpt,
			});
		},
		// 計算價差
		followPrice(p1,p2,selectedStrategy,symbol1,symbol2) {
			let price1 = p1 || 0;
			let price2 = p2 || 0;
			const strike1 = M4C.Option.getStrike(symbol1);
			const strike2 = M4C.Option.getStrike(symbol2);
			switch(selectedStrategy.key) {
				// 遠月對手價權利金 - 近月對手價權利金
				case 'StDiffTime':		// 時間價差
					// 非週選時組合 W3 進去比大小 (順序是 W1>W2>X月>X4>X5)
					let mth1 = `${this.getOptionMonth(symbol1)}${this.getOptionMonth(symbol1).length===6?'W3':''}`;
					let mth2 = `${this.getOptionMonth(symbol2)}${this.getOptionMonth(symbol2).length===6?'W3':''}`;
					return +Big(price1).minus(price2).times(mth1 > mth2 ? 1 : -1);
				// 較低履約價權利金 - 高履約價權利金
				case 'BullCallSpread':	// 多頭價差(C)
				case 'BearCallSpread':	// 空頭價差(C)
					return +Big(price1).minus(price2).times(Number(strike1) > Number(strike2) ? -1 : 1);
				// 較高履約價權利金 - 低履約價權利金
				case 'BullPutSpread':	// 多頭價差(P)
				case 'BearPutSpread':	// 空頭價差(P)
					return +Big(price1).minus(price2).times(Number(strike1) > Number(strike2) ? 1 : -1);
				// 腳1履約價權利金 + 腳2履約價權利金
				case 'BuyStraddles':	// 買進跨式
				case 'SellStraddles':	// 賣出跨式
				case 'BuyStrangles':	// 買進勒式
				case 'SellStrangles':	// 賣出勒式
					return +Big(price1).plus(price2);
				// PUT腳位的權利金 - CALL腳位的權利金
				case 'Conversions':		// 轉換
				case 'Reversals':		// 逆轉
					// selectedStrategy.CP1 === 'P' ? 1 : -1
					return +Big(price1).minus(price2).times(1);
			}
		},
		getOptionMonth(sid){
            const sids = sid.split('.');
            if (sids[2] === 'TWF') {
				switch (sids[3]) {
					case 'TX1':
                        return sids[4] + 'W1'
					case 'TX2':
                        return sids[4] + 'W2'
                    case 'TX3':
                        return sids[4] + 'W3'
					case 'TX4':
                        return sids[4] + 'W4'
					case 'TX5':
                        return sids[4] + 'W5'
				}
			}
            return sids[4] || '';
        },
	},
	watch: {
	},
    computed: {
		baID() {
			return this.$store.state.login.baID;
		},
		accountID() {
			return this.$store.state.login.accountID;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		ciocList(){
			return this.$store.state.data.continuousIOCList;
		},
		dialogList() {
			return this.$store.state.popup.dialogList;
		},
	},
}
</script>
