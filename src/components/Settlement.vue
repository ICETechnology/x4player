<template>
    <div class="flex-col">
		<div class="flex-1 flex-col settleCtn">
			<div class="settlement-head flex-row" :class="{'flex-end': isDesktop}">
				<span class="flex-center mgr3">{{$ln('历史查询')}}</span>
				<span class='flex-start pdr5'  :class="{'flex-1': !isDesktop}">
					<input type="date" class="date-input" v-model="inputStr"/>
				</span>
				<span class="flex-center">
					<Button class="pdlr5" @click="onBtnQuery">{{$ln('查询')}}</Button>
				</span>
				<span class='loading-icon-ctn'></span>
			</div>
			<div class='settlement-body flex-1 flex-column scroll-wrapper'>
				<iframe ref="iframe" class="w100p h100p" src="about:blank"></iframe>
			</div>
			<div class="settlement-foot flex-row" :class="[isDesktop? 'flex-center': 'flex-start']">
				<div class='flex-row flex-center pdr5'>
					<span class="mgr1">{{$ln(`自动确认`)}}</span>
					<Toggle v-model="autoConfirmSettlement" />
				</div>
				<div :class="{'flex-1': !isDesktop}"/>
				<div>
					<Button v-if="settlementConfirm && !showLoadBtn" class="pdlr5" @click="onBtnClose">{{$ln('关闭')}}</Button>
					<Button v-if="!settlementConfirm && !showLoadBtn" class="pdlr5" @click="onBtnConfirm">{{$ln('确认结算')}}</Button>
				</div>
				<div v-if="showLoadBtn">
					<Button class="pdlr5 nowrap load-btn" @click="onLoadSettlement">{{$ln('载入结算资料')}}</Button>
				</div>
			</div>
		</div>
		<LoadingIcon v-if="isLoading" class="clr-black"></LoadingIcon>
    </div>
</template>

<script>
export default {
	props: ["param"],
	data() {
		return {
			inputStr: "",
			/** 結算單確認結果 */
			confirmResult: {},
			/** 載入按鈕 */
			showLoadBtn: false,
        }
	},
	beforeMount() {
		this.$emit('title', `${this.$ln(`结算单`)} ${this.isDesktop? `${this.displayBrokerName} - ${this.traderID}`:""}`);
		this.$emit('dialogClass', `dialog-size-big`);
		let today =  new Date().day8();
		this.inputStr = today.substring(0, 4) + "-" + today.substring(4, 6) + "-" + today.substring(6);

		// 此新造 key:value 必須響應式 (才能讓 自動儲存 與 Toggle 生效)
		if (this.autoConfirmSettlement == null)
			this.$set(this.$store.state.autoConfirmSettlement, this.btID, false);
	},
    mounted() {
		this.doc = this.$refs.iframe.contentWindow.document;

		// 已有結算單資料
		if(this.queryResult && this.queryResult.$STATUS === "DONE") {
			this.loadSettlementData();
		}
		// 預設查詢結算單不帶日期，由 server 支持回覆最後交易日的結算單 https://trello.com/c/9ZuSbv3M
		else {
			this.querySettlement();
		}
    },
	beforeDestroy() {
	},
	components: {
	},
    methods: {
		// 手動載入結算資料(如果開啟結算功能時，結算資料過大，會導致卡頓。因此改讓user手動載入)
		onLoadSettlement() {
			let doc = this.doc;
			let obj = Base64.decode(this.settlementData);
			doc.open();
			doc.write(obj);
			doc.close();
			this.showLoadBtn = false;
		},
		onBtnQuery() {
			let date = this.inputStr.replace(/\-/g, "");
			this.querySettlement(date);
		},
		querySettlement(date) {
			// 清空
			let doc = this.doc;
			doc.open();
			doc.write('');
			doc.close();
			// 查詢結算單
			M4C.Settlement.querySettlement(date);
		},
		// 關閉
		onBtnClose() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		// 确认结算
		onBtnConfirm() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `结算单确认`,
				content: `确认确认结算单？`,
				confirm: ()=>{
					this.confirmResult = M4C.Settlement.confirmSettlement();
				}
			});
		},
		loadSettlementData() {
			let doc = this.doc;
			let maxSize = 100; // 可直接顯示資料的最大上限 100k
			doc.open();
			// 結算資料小於100K時才直接載入顯示。
			if (this.settlementData && this.settlementData.length && this.settlementData.length < maxSize * 1024) {
				console.log(`settlement lenght`, this.settlementData.length);
				let obj = Base64.decode(this.settlementData);
				doc.write(obj);
			}
			// 顯示提示訊息讓user手動載入。
			else if(this.settlementData && this.settlementData.length > maxSize * 1024) {
				console.log(`settlement lenght large then 100k`, this.settlementData.length);
				doc.write("资料过大，请点击载入结算资料按钮。");
				this.showLoadBtn = true;
			}
			else {
				doc.write("查无资料");
			}
			doc.close();
		},
	},
	watch: {
		inputStr(nv) {
			// 僅允許設定至今日以前的日期
			let thisDay =  new Date().day8();
			let today = thisDay.substring(0, 4) + "-" + thisDay.substring(4, 6) + "-" + thisDay.substring(6);
			if (nv > today)
				this.inputStr = today;
		},
		/** 查詢結算單狀態改變 */
		queryStatus: function(nv) {
			if (nv === "DONE") {
				this.loadSettlementData();
			}
			else if (nv === "FAIL") {
				if (!isNaN(nv.CODE) && nv.MSG != null) {
					eventBus.$emit("CONFIRM-DIALOG", {
						title: `结算单查询失败`,
						content: `(${nv.CODE}) ${nv.MSG}`,
						confirmOnly: true,
					});
				}
			}
		},
		/** 確認結算單狀態改變 */
		'confirmResult.$STATUS': function(nv) {
			// 結算單確認完成
			if (nv === "DONE") {
				this.$store.state.notify({
					head: `结算单`,
					body: `结算单确认完成`,
				});
				eventBus.$emit("CLOSE-DIALOG");
			}
		},
	},
    computed: {
		/** 是否顯示 loading-icon */
		isLoading() {
			if(this.queryResult)
				return this.queryResult.$STATUS === "QUERY";
			else return true;
		},
		queryResult() {return M4C.Settlement.querySettlementResult;},
		queryStatus() {if(this.queryResult) return this.queryResult.$STATUS;},
		settlementData() {if(this.queryResult) return this.queryResult.HTML;},
		settlementConfirm() {if(this.queryResult) return this.queryResult.CONFIRM;},
		btID() {
			return this.$store.state.login.btID;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		traderID() {
			return this.$store.state.login.traderID;
		},
		brokerKey() {
			return this.$store.state.login.brokerKey;
		},
		autoConfirmSettlement: {
            get: function () {
				return this.$store.state.autoConfirmSettlement[this.btID];
            },
            set: function (nv) {
                this.$store.state.autoConfirmSettlement[this.btID] = nv;
            }			
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
		displayBrokerName() {
			return this.$store.state.brokerNameMap[this.brokerKey];
		},
    }
}
</script>

<style scoped>
.date-input {
	height: 8vw;
	border-radius: 2vw;
}
.settleCtn .settlement-head {
    height: 50px;
	padding: 0 10px;
}
.settleCtn .settlement-head input {
	font-size: 15px;
}
.settleCtn .settlement-foot {
	padding: 0 10px;
    height: 50px;
}
.settleCtn iframe {
	background-color: white;
}
.scroll-wrapper {
	overflow-y: scroll;
}
.load-btn {
	max-width: 6em;
}
/** 桌機版 */
.desktop .date-input {
	height: 30px;
	border-radius: 8px;
}
</style>