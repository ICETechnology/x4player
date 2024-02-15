<template>
</template>
<script>
export default {
    data() {
        return {
            orderInfo: null,
			// 工作佇列
			jobQuee: {},
			// 執行時間
			executeTime: "",
			// 最高限制秒數
			maxLimitSec: 250
        }
    },
    beforeMount() {
        // 支持 Vuex + Window全域
		M4C.Order.Split = this.$store.state.m4c.order.split = this;
    },
    methods: {
		// 執行委託
		executeOrder(oi) {
			M4C.Order.doSend(oi);
		},
		// 執行工作佇列
		executeJobQuee() {
			if(this.jobQueeKeys.length) {
				let self = this;
				let orderInfor = this.jobQuee[this.jobQueeKeys[0]];
				// 切割執行工作
				if(orderInfor.execute) {
					orderInfor.execute(orderInfor.oi);
				}
				// 委託
				else {
					// 執行委託。
					this.executeOrder(orderInfor);
				}
				// 移除已執行的工作
				this.$delete(this.jobQuee, this.jobQueeKeys[0]);
				// 依時間限制執行
				setTimeout(() => {
					// 還有剩餘工作佇列
					if(self.jobQueeKeys.length) {
						self.executeJobQuee();
					}
				}, this.maxLimitSec);
			}
		},
		// 加入工作佇列
		addToJobQuee(orderInfo) {
			let totalQty = this.orderQty;
			let lastOiMs = this.jobQueeKeys.slice(-1)[0];
			// 有工作佇列時間以最後時間 + 限制時間當第一筆委託的時間索引。
			let nowMs = lastOiMs? Number(lastOiMs) + this.maxLimitSec: Date.now();
			// 切割執行工作
			if(orderInfo.execute) {
				this.$set(this.jobQuee, nowMs, orderInfo);
			}
			// 刪單不計算數量
			else if(orderInfo.ACTION == 'CANCEL') {
				this.$set(this.jobQuee, nowMs, orderInfo);
			}
			// 分割委託數量
			else if(this.splitQty > 0){
				// 最多分幾次執行
				let count = Math.ceil(totalQty / this.splitQty);
				// 循環設定加入工作佇列。
				for(let i = 0; i < count; i++) {
					let oi = this.$store.state.fn.$disObserver(orderInfo);
					let qty = totalQty - this.splitQty * i;
					// 拆分委託數量
					oi.ORDER_QTY = qty >= this.splitQty? this.splitQty: qty;
					// 執行時間索引(不一定是實際執行時間, ex:全平、全刪動作)
					let execMs = nowMs + this.maxLimitSec * i;
					// 設定到工作佇列
					this.$set(this.jobQuee, execMs, oi);
				}
			}
			// 其他委託操作
			else {
				let oi = this.$store.state.fn.$disObserver(orderInfo);
				this.$set(this.jobQuee, nowMs, oi);
			}
		},
        // 執行拆單分批委託。
		sendSplitOrder(orderInfo, totalQty = this.orderQty){
			this.addToJobQuee(orderInfo);
		},
		executeSplitAction(orderInfo, action) {
			this.addToJobQuee({oi: orderInfo, execute: action});
		},
        // 判斷委託內容數量是否需要拆單
		shouldSplit(oi){
			// 判斷時間是否有效(小於時間限制需加到佇列等待執行)
			let needAddToJobQuee = this.executeTime? Date.now() - this.executeTime < this.maxLimitSec: false;
			if(oi) this.orderInfo = oi;
			// OCO單拆單會有非預期的委託情境，所以不支援。
			if(this.isOCO) return false;
			// 有子委託(反手、保護單)也不支援自動拆單。
			if(oi.SUB_ORDER) return false;
			this.executeTime = Date.now();
			// 回傳是否拆單
			return this.isSplit || needAddToJobQuee;
		},
    },
	watch: {
		// 有工作佇列時，執行委託。
		jobQueeKeys(nv, ov) {
			if(!ov.length && nv.length) {
				// 判斷時間是否有效(小於時間限制需加到佇列等待執行)
				let needAddToJobQuee = this.executeTime? Date.now() - this.executeTime < this.maxLimitSec: false;
				// 已有先執行的委託，且時間過短時，等待已執行時間+最大限制時間後，執行工作佇列中的委託。
				if(needAddToJobQuee){
					let self = this;
					setTimeout(() => {
						self.executeJobQuee();	
					},this.executeTime + this.maxLimitSec - Date.now());					
				}
				// 無先執行的委託，或已超過最大限制時間，直接執行工作佇列中的委託。
				else
					this.executeJobQuee();
			}
		}
	},
    computed: {
        orderInfo1() {return this.isOCO ? this.orderInfo.OCO[0] : this.orderInfo;},
		isOCO(){if(this.orderInfo) return this.orderInfo.OCO;},
        sid(){if(this.orderInfo) return this.orderInfo1.SYMBOL;},
		isFut(){return this.sid && this.sid.indexOf('I.F') >= 0;},
		isOpt(){return this.sid && this.sid.indexOf('I.O') >= 0;},
		isStk(){return this.sid && this.sid.indexOf('I.S') >= 0;},
		// 根據類型及委託數量回應是否拆單
		isSplit() {
			if(this.isFut)
				return this.isFut && this.splitQty > 0 && this.orderQty > this.splitQty;
			else if(this.isOpt)
				return this.isOpt && this.splitQty > 0 && this.orderQty > this.splitQty;
			else if(this.isStk)
				return this.isStk && this.splitQty > 0 && this.orderQty > this.splitQty;
			else return false;
		},
		orderQty(){
			try {
				return this.isOCO? this.orderInfo.OCO[0].ORDER_QTY: this.orderInfo.ORDER_QTY;
			} catch(e) {
				return 0;
			}
		},
		// 根據類型取得拆單數量
		splitQty(){
			if(this.isFut)
				return this.$store.state.order.futSplitQty;
			else if(this.isOpt)
				return this.$store.state.order.optSplitQty;
			else if(this.isStk)
				return this.$store.state.order.stkSplitQty;
			else return 0;
		},
		jobQueeKeys() {
			return Object.keys(this.jobQuee);
		}
    },
}
</script>